import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class ArbeitnowConnector extends BaseJobConnector {
  readonly platformName = "Arbeitnow";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(keyword)}&page=${pageNum}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results = (data.data || []).map((j: any) => ({
      title: j.title || "",
      description: j.description || "",
      companyName: j.company_name || "Arbeitnow Partner",
      location: j.location || "Remoto",
      sourceUrl: j.url || "",
      sourcePlatform: this.platformName,
      publishedAt: j.created_at
    }));

    return results;
  }
}
