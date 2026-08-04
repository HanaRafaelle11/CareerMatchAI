import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class JoobleConnector extends BaseJobConnector {
  readonly platformName = "Jooble";

  async searchJobs(keyword: string, location: string, pageNum: number, signal?: AbortSignal): Promise<RawJob[]> {
    const apiKey = Deno.env.get('JOOBLE_API_KEY');
    if (!apiKey) {
      console.warn("[JoobleConnector] JOOBLE_API_KEY não configurada.");
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const combinedSignal = signal || controller.signal;

    const isBr = !location || /brasil|brazil|br|são paulo|sao paulo|rio|sp|rj|mg|pr|rs/i.test(location.toLowerCase());
    const baseUrl = isBr ? 'https://br.jooble.org' : 'https://jooble.org';
    const url = `${baseUrl}/api/${apiKey}`;
    const joobleLoc = isBr ? "Brasil" : location;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keyword,
          location: joobleLoc,
          page: pageNum
        }),
        signal: combinedSignal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
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
