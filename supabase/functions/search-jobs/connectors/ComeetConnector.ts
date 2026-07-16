import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class ComeetConnector extends BaseJobConnector {
  readonly platformName = "Comeet";
  private curatedCompanies = ["comeet", "fiverr"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        const res = await fetch(`https://www.comeet.co/careers-api/v1/company/${company}/positions`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!Array.isArray(data)) return;

        const matching = data.filter((j: any) => 
          j.name?.toLowerCase().includes(keywordLower) ||
          (j.description && j.description.toLowerCase().includes(keywordLower))
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.name || "Vaga Comeet",
            description: j.description || "",
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.location?.name || "Remoto",
            sourceUrl: j.url || "",
            sourcePlatform: this.platformName,
            publishedAt: j.time_created
          });
        });
      } catch (err) {
        console.error(`[ComeetConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
