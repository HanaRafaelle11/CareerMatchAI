import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class RemotiveConnector extends BaseJobConnector {
  readonly platformName = "Remotive";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return []; // Remotive has single list search

    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=15`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results = (data.jobs || []).map((j: any) => ({
      title: j.title || "",
      description: j.description || "",
      companyName: j.company_name || "Remotive Hirer",
      location: j.candidate_required_location || "Remoto",
      sourceUrl: j.url || "",
      sourcePlatform: this.platformName,
      publishedAt: j.publication_date
    }));

    return results;
  }
}
