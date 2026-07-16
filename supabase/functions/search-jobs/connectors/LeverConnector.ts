import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class LeverConnector extends BaseJobConnector {
  readonly platformName = "Lever";
  private curatedCompanies = ["vercel", "stripe", "figma", "lever"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return []; // Lever postings are single lists

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!Array.isArray(data)) return;

        const matching = data.filter((j: any) => 
          j.categories?.team?.toLowerCase().includes(keywordLower) ||
          j.text?.toLowerCase().includes(keywordLower) || 
          (j.description && j.description.toLowerCase().includes(keywordLower))
        );

        matching.forEach((j: any) => {
          jobs.push({
            title: j.text || "Vaga Lever",
            description: j.description || j.descriptionPlain || "",
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.categories?.location || "Remoto",
            sourceUrl: j.hostedUrl || "",
            sourcePlatform: this.platformName,
            publishedAt: new Date(j.createdAt).toISOString()
          });
        });
      } catch (err) {
        console.error(`[LeverConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
