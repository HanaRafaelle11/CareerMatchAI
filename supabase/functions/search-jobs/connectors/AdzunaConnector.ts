import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class AdzunaConnector extends BaseJobConnector {
  readonly platformName = "Adzuna";

  async searchJobs(keyword: string, location: string, pageNum: number, signal?: AbortSignal): Promise<RawJob[]> {
    const appId = Deno.env.get('ADZUNA_APP_ID');
    const appKey = Deno.env.get('ADZUNA_APP_KEY');
    if (!appId || !appKey) {
      console.warn("[AdzunaConnector] Chaves não configuradas.");
      return [];
    }

    // ── MULTI-PAGE FETCH: 3 páginas paralelas (até 150 vagas brutas) ──
    // Justificativa: A API do Adzuna tem 6.000+ vagas para termos populares como "vendedor" em SP,
    // mas cada página retorna no máximo 50. Buscar apenas 1 página é um gargalo artificial.
    // Limite intencional: 3 páginas (150 vagas) equilibra volume vs. latência (~3s paralelo).
    const PAGES_TO_FETCH = 3;
    const RESULTS_PER_PAGE = 50;
    const TIMEOUT_PER_PAGE_MS = 3500;

    const fetchPage = async (page: number): Promise<RawJob[]> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_PAGE_MS);
      const combinedSignal = signal || controller.signal;

      try {
        const url = `https://api.adzuna.com/v1/api/jobs/br/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=${RESULTS_PER_PAGE}&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
        const res = await fetch(url, { signal: combinedSignal });
        clearTimeout(timeoutId);
        if (!res.ok) return [];

        const data = await res.json();
        const results = (data.results || []).map((j: any) => {
          let salMin = j.salary_min ? Math.round(j.salary_min) : undefined;
          let salMax = j.salary_max ? Math.round(j.salary_max) : undefined;
          
          // Adzuna envia valores anuais (ex: 30000 = 2.5k/mês). Normalizar para mensal quando > 25.000.
          if (salMin && salMin > 25000) salMin = Math.round(salMin / 12);
          if (salMax && salMax > 25000) salMax = Math.round(salMax / 12);

          return {
            title: j.title || "",
            description: j.description || "",
            companyName: j.company?.display_name || "Empresa Confidencial",
            location: j.location?.display_name || "Brasil",
            salaryMin: salMin,
            salaryMax: salMax,
            sourceUrl: j.redirect_url || "",
            sourcePlatform: this.platformName,
            publishedAt: j.created,
            totalMarketCount: data.count || 0
          };
        });

        return results;
      } catch (_) {
        clearTimeout(timeoutId);
        return [];
      }
    };

    // Disparar todas as páginas em paralelo com Promise.allSettled para resiliência
    const pageNumbers = Array.from({ length: PAGES_TO_FETCH }, (_, i) => pageNum + i);
    const settled = await Promise.allSettled(pageNumbers.map(p => fetchPage(p)));

    const allJobs: RawJob[] = [];
    settled.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        console.log(`[AdzunaConnector] Página ${pageNumbers[idx]}: ${result.value.length} vagas`);
        allJobs.push(...result.value);
      } else {
        console.warn(`[AdzunaConnector] Página ${pageNumbers[idx]}: falhou (${result.reason?.message || 'timeout'})`);
      }
    });

    console.log(`[AdzunaConnector] Total bruto: ${allJobs.length} vagas de ${PAGES_TO_FETCH} páginas`);
    return allJobs;
  }
}

