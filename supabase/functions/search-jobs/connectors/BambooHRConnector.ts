import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class BambooHRConnector extends BaseJobConnector {
  readonly platformName = "BambooHR";
  private curatedCompanies = ["bamboohr", "zipcar"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        const res = await fetch(`https://${company}.bamboohr.com/jobs/jobs.php?json=true`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!Array.isArray(data)) return;

        const matching = data.filter((j: any) => 
          j.jobTitle?.toLowerCase().includes(keywordLower) ||
          j.department?.toLowerCase().includes(keywordLower)
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.jobTitle || "Vaga BambooHR",
            description: `Oportunidade na área de ${j.department || 'Geral'} em ${j.locationName || 'Remoto'}.`,
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.locationName || "Remoto",
            sourceUrl: `https://${company}.bamboohr.com/jobs/view.php?id=${j.id}`,
            sourcePlatform: this.platformName,
            publishedAt: new Date().toISOString() // BambooHR json list doesn't have exact publishedAt
          });
        });
      } catch (err) {
        console.error(`[BambooHRConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
