import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class GreenhouseConnector extends BaseJobConnector {
  readonly platformName = "Greenhouse";

  /**
   * Dynamic board resolution:
   * 1. Check environment variable GREENHOUSE_COMPANIES
   * 2. Default expanded list of Brazilian & Global tech companies using Greenhouse
   */
  private async getBoards(supabaseClient?: any): Promise<string[]> {
    // 1. Try querying Supabase greenhouse_boards table if available
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('greenhouse_boards')
          .select('slug')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          console.log(`[GreenhouseConnector] Carregados ${data.length} boards da tabela greenhouse_boards`);
          return data.map((b: any) => b.slug.trim().toLowerCase());
        }
      } catch (_) {
        // Fall back to env or default list if table doesn't exist yet
      }
    }

    // 2. Check env var GREENHOUSE_COMPANIES
    const envBoards = Deno.env.get('GREENHOUSE_COMPANIES');
    if (envBoards) {
      return envBoards.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    }

    // 3. Fallback list of top Brazilian & Global tech companies using Greenhouse
    return [
      "nubank", "ifood", "quintoandar", "stone",
      "olist", "hotmart", "picpay", "mercadolivre",
      "neon", "loggi", "creditas", "gympass",
      "cloudflare", "figma", "github", "hashicorp",
      "stripe", "vtex"
    ];
  }

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return []; // Greenhouse API delivers board feeds in a single call

    const boards = await this.getBoards();
    const keywordLower = keyword.toLowerCase();
    const jobs: RawJob[] = [];

    // Fetch from all configured boards in parallel
    const promises = boards.map(async (board) => {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`);
        if (!res.ok) {
          if (res.status === 404) return; // Board does not exist or is inactive
          console.warn(`[GreenhouseConnector] Board ${board} HTTP ${res.status}`);
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
      } catch (err: any) {
        console.error(`[GreenhouseConnector] Erro no board ${board}:`, err.message);
      }
    });

    await Promise.all(promises);
    return jobs;
  }
}
