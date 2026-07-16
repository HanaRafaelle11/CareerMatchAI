import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class TeamtailorConnector extends BaseJobConnector {
  readonly platformName = "Teamtailor";
  private curatedCompanies = ["teamtailor", "kinsta"];

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    const promises = this.curatedCompanies.map(async (company) => {
      try {
        const res = await fetch(`https://api.teamtailor.com/v1/jobs`, {
          headers: {
            "Accept": "application/vnd.api+json"
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        
        const rawJobs = data.data || [];
        if (!Array.isArray(rawJobs)) return;

        const matching = rawJobs.filter((j: any) => {
          const title = j.attributes?.title || "";
          const body = j.attributes?.body || "";
          return title.toLowerCase().includes(keywordLower) || body.toLowerCase().includes(keywordLower);
        });

        matching.forEach((j: any) => {
          jobs.push({
            title: j.attributes?.title || "Vaga Teamtailor",
            description: j.attributes?.body || "",
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            location: j.attributes?.location || "Remoto",
            sourceUrl: j.links?.self || "",
            sourcePlatform: this.platformName,
            publishedAt: j.attributes?.["created-at"]
          });
        });
      } catch (err) {
        console.error(`[TeamtailorConnector] Erro ao buscar da empresa ${company}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
