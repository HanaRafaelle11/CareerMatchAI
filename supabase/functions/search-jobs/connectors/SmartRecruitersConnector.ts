import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class SmartRecruitersConnector extends BaseJobConnector {
  readonly platformName = "SmartRecruiters";
  private curatedCompanies = ["ubisoft", "ikea", "smartrecruiters"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${company}/postings`);
        if (!res.ok) return;
        const data = await res.json();
        
        const postings = data.content || [];
        if (!Array.isArray(postings)) return;

        const matching = postings.filter((j: any) => 
          j.name?.toLowerCase().includes(keywordLower) ||
          j.department?.name?.toLowerCase().includes(keywordLower)
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.name || "Vaga SmartRecruiters",
            description: `Vaga no departamento de ${j.department?.name || 'Engenharia'} anunciada via SmartRecruiters.`,
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.location?.city || "Remoto",
            sourceUrl: `https://jobs.smartrecruiters.com/${company}/${j.id}`,
            sourcePlatform: this.platformName,
            publishedAt: j.releasedDate
          });
        });
      } catch (err) {
        console.error(`[SmartRecruitersConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
