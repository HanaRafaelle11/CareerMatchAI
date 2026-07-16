import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class WorkableConnector extends BaseJobConnector {
  readonly platformName = "Workable";
  private curatedAccounts = ["workable", "chattermill"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedAccounts.map(async (company) => {
      try {
        const res = await fetch(`https://apply.workable.com/api/v1/widget/accounts/${company}?visibility=public`);
        if (!res.ok) return;
        const data = await res.json();
        
        const rawJobs = data.jobs || [];
        if (!Array.isArray(rawJobs)) return;

        const matching = rawJobs.filter((j: any) => 
          j.title?.toLowerCase().includes(keywordLower) ||
          j.description?.toLowerCase().includes(keywordLower)
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.title || "Vaga Workable",
            description: j.description || "",
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.location?.city || "Remoto",
            sourceUrl: `https://apply.workable.com/jobs/${company}/${j.shortcode}`,
            sourcePlatform: this.platformName,
            publishedAt: j.published
          });
        });
      } catch (err) {
        console.error(`[WorkableConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
