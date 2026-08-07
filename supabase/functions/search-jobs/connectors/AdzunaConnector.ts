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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const combinedSignal = signal || controller.signal;

    try {
      const resultsPerPage = 50; // 50 resultados por busca em Adzuna (Brasil)
      const url = `https://api.adzuna.com/v1/api/jobs/br/search/${pageNum}?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
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
      return [];
    }
  }
}
