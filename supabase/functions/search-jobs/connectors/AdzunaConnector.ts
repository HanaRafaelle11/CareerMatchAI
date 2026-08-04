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
      const results = (data.results || []).map((j: any) => ({
        title: j.title || "",
        description: j.description || "",
        companyName: j.company?.display_name || "Empresa Confidencial",
        location: j.location?.display_name || "Brasil",
        salaryMin: j.salary_min || undefined,
        salaryMax: j.salary_max || undefined,
        sourceUrl: j.redirect_url || "",
        sourcePlatform: this.platformName,
        publishedAt: j.created
      }));

      return results;
    } catch (_) {
      return [];
    }
  }
}
