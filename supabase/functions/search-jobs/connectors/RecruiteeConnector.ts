import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class RecruiteeConnector extends BaseJobConnector {
  readonly platformName = "Recruitee";
  private curatedCompanies = ["recruitee", "hotjar"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        const res = await fetch(`https://api.recruitee.com/c/${company}/careers/offers`);
        if (!res.ok) return;
        const data = await res.json();
        
        const offers = data.offers || [];
        if (!Array.isArray(offers)) return;

        const matching = offers.filter((j: any) => 
          j.title?.toLowerCase().includes(keywordLower) ||
          (j.description && j.description.toLowerCase().includes(keywordLower))
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.title || "Vaga Recruitee",
            description: j.description || "",
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.location || "Remoto",
            sourceUrl: j.careers_url || "",
            sourcePlatform: this.platformName,
            publishedAt: j.created_at
          });
        });
      } catch (err) {
        console.error(`[RecruiteeConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
