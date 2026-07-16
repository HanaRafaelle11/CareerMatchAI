import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class AshbyConnector extends BaseJobConnector {
  readonly platformName = "Ashby";
  private curatedCompanies = ["linear", "openai", "replicate", "duolingo"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        // Ashby public board postings API endpoint
        const res = await fetch(`https://api.ashbyhq.com/v2/job-board/api/${company}/postings`);
        if (!res.ok) return;
        const data = await res.json();
        
        const postings = data.postings || [];
        if (!Array.isArray(postings)) return;

        const matching = postings.filter((j: any) => 
          j.title?.toLowerCase().includes(keywordLower) || 
          j.department?.toLowerCase().includes(keywordLower) ||
          (j.descriptionHtml && j.descriptionHtml.toLowerCase().includes(keywordLower))
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.title || "Vaga Ashby",
            description: j.descriptionHtml || j.descriptionPlain || "",
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.location || "Remoto",
            sourceUrl: j.jobUrl || "",
            sourcePlatform: this.platformName,
            publishedAt: j.publishedAt
          });
        });
      } catch (err) {
        console.error(`[AshbyConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
