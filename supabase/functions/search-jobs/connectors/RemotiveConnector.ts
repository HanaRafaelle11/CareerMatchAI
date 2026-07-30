import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class RemotiveConnector extends BaseJobConnector {
  readonly platformName = "Remotive";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    // Remotive: limit to 30 results and 2500ms timeout to prevent 2MB JSON download latency
    const pageSize = 15;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=30`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return [];

      const data = await res.json();
      const allResults = (data.jobs || []).map((j: any) => ({
        title: j.title || "",
        description: j.description || "",
        companyName: j.company_name || "Remotive Hirer",
        location: j.candidate_required_location || "Remoto",
        sourceUrl: j.url || "",
        sourcePlatform: this.platformName,
        publishedAt: j.publication_date
      }));

      const start = (pageNum - 1) * pageSize;
      return allResults.slice(start, start + pageSize);
    } catch (_) {
      return [];
    }
  }
}
