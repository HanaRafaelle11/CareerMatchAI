import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class GreenhouseConnector extends BaseJobConnector {
  readonly platformName = "Greenhouse";
  
  // Configurable via GREENHOUSE_COMPANIES env var or default curated list
  private getBoards(): string[] {
    const envBoards = Deno.env.get('GREENHOUSE_COMPANIES');
    if (envBoards) {
      return envBoards.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    }
    // Default: mix of global tech + Brazilian tech companies with Greenhouse boards
    return [
      "cloudflare", "figma", "hashicorp", "github",
      "stripe", "nubank", "quintoandar", "neon",
      "olist", "ifood", "picpay", "vtex",
      "gympass", "creditas", "loggi", "stone"
    ];
  }

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return []; // Greenhouse feed is single-page lists

    const boards = this.getBoards();
    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    // Fetch from all curated boards in parallel
    const promises = boards.map(async (board) => {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`);
        if (!res.ok) {
          if (res.status === 404) return; // Board doesn't exist
          console.warn(`[GreenhouseConnector] Board ${board} returned status ${res.status}`);
          return;
        }
        const data = await res.json();
        
        const matchingJobs = (data.jobs || []).filter((j: any) => 
          j.title.toLowerCase().includes(keywordLower) || 
          (j.content && j.content.toLowerCase().includes(keywordLower))
        );

        matchingJobs.forEach((j: any) => {
          jobs.push({
            title: j.title || "Vaga Greenhouse",
            description: j.content || "",
            companyName: board.charAt(0).toUpperCase() + board.slice(1),
            location: j.location?.name || "Remoto",
            sourceUrl: j.absolute_url || "",
            sourcePlatform: this.platformName,
            publishedAt: j.updated_at
          });
        });
      } catch (err) {
        console.error(`[GreenhouseConnector] Erro ao buscar do board ${board}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
