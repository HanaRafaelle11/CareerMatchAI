import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class AdzunaConnector extends BaseJobConnector {
  readonly platformName = "Adzuna";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const appId = Deno.env.get('ADZUNA_APP_ID');
    const appKey = Deno.env.get('ADZUNA_APP_KEY');
    if (!appId || !appKey) {
      console.warn("[AdzunaConnector] Chaves não configuradas.");
      return [];
    }

    const resultsPerPage = 50;
    const pagesToFetch = 3;
    const startPage = (pageNum - 1) * pagesToFetch + 1;

    const fetchPage = async (page: number): Promise<RawJob[]> => {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/br/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
        const res = await fetch(url);
        if (!res.ok) return [];

        const data = await res.json();
        return (data.results || []).map((j: any) => ({
          title: j.title || "",
          description: j.description || "",
          companyName: j.company?.display_name || "Empresa Confidencial",
          location: j.location?.display_name || "Brasil",
          salaryMin: j.salary_min ? Math.round(j.salary_min / 12) : undefined,
          salaryMax: j.salary_max ? Math.round(j.salary_max / 12) : undefined,
          sourceUrl: j.redirect_url || "",
          sourcePlatform: this.platformName,
          publishedAt: j.created
        }));
      } catch (err) {
        console.warn(`[AdzunaConnector] Erro na página ${page}:`, err.message);
        return [];
      }
    };

    const pages = Array.from({ length: pagesToFetch }, (_, i) => startPage + i);
    const results = await Promise.all(pages.map(fetchPage));
    return results.flat();
  }
}
