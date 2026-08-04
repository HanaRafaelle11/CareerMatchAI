import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class SerpApiConnector extends BaseJobConnector {
  readonly platformName = "Google Jobs (SerpApi)";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const apiKey = Deno.env.get('SERPAPI_KEY');
    if (!apiKey) {
      console.warn("[SerpApiConnector] SERPAPI_KEY não configurada.");
      return [];
    }

    const start = (pageNum - 1) * 10;
    const isBr = !location || /brasil|brazil|br|são paulo|sao paulo|rio|sp|curitiba|porto alegre|belo horizonte|df|brasília/i.test(location.toLowerCase());
    let serpLoc = "Brazil";
    if (location && location.trim().length > 0 && !/^(brasil|brazil|br)$/i.test(location.trim())) {
      serpLoc = `${location.trim().replace(/brasil/i, '').replace(/,\s*$/, '')}, Brazil`;
    }
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(serpLoc)}${isBr ? '&gl=br&hl=pt' : ''}&api_key=${apiKey}&start=${start}`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[SerpApiConnector] Resposta com status ${res.status}`);
        return [];
      }

      const data = await res.json();
      const jobs = data.jobs_results || [];

      return jobs.map((j: any) => ({
        title: j.title || "",
        description: j.description || j.snippet || "",
        companyName: j.company_name || "Empresa Confidencial",
        location: j.location || location || "Brasil",
        salaryMin: undefined,
        salaryMax: undefined,
        sourceUrl: j.share_link || j.apply_options?.[0]?.link || "",
        sourcePlatform: this.platformName,
        publishedAt: j.detected_extensions?.posted_at
      }));
    } catch (err: any) {
      console.error("[SerpApiConnector] Erro na requisição:", err.message);
      return [];
    }
  }
}
