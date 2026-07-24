import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class JoobleConnector extends BaseJobConnector {
  readonly platformName = "Jooble";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const apiKey = Deno.env.get('JOOBLE_API_KEY');
    if (!apiKey) {
      console.warn("[JoobleConnector] JOOBLE_API_KEY não configurada.");
      return [];
    }

    const url = `https://jooble.org/api/${apiKey}`;
    const joobleLoc = (!location || location.toLowerCase().includes('brasil')) ? "Brazil" : location;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keyword,
          location: joobleLoc,
          page: pageNum
        })
      });

      if (!res.ok) {
        console.warn(`[JoobleConnector] Resposta com status ${res.status}`);
        return [];
      }

      const data = await res.json();
      const jobs = data.jobs || [];

      return jobs.map((j: any) => ({
        title: j.title || "",
        description: j.snippet || j.description || "",
        companyName: j.company || "Empresa Confidencial",
        location: j.location || location || "Brasil",
        salaryMin: j.salary ? parseFloat(j.salary.replace(/[^0-9.]/g, '')) || undefined : undefined,
        salaryMax: undefined,
        sourceUrl: j.link || "",
        sourcePlatform: this.platformName,
        publishedAt: j.updated
      }));
    } catch (err: any) {
      console.error("[JoobleConnector] Erro na requisição:", err.message);
      return [];
    }
  }
}
