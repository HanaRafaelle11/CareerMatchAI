import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

// Helper XML Parser for ProgramaThor jobs.xml feed
function parseProgramaThorXml(xml: string): RawJob[] {
  const jobs: RawJob[] = [];
  const matches = xml.matchAll(/<job>([\s\S]*?)<\/job>/g);
  
  for (const match of matches) {
    const content = match[1];
    const title = (content.match(/<title>[\s\n]*<!\[CDATA\[([\s\S]*?)\]\]>[\s\n]*<\/title>/i)?.[1] ||
                   content.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
    const description = (content.match(/<description>[\s\n]*<!\[CDATA\[([\s\S]*?)\]\]>[\s\n]*<\/description>/i)?.[1] ||
                         content.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || "").trim();
    const url = (content.match(/<url>[\s\n]*<!\[CDATA\[([\s\S]*?)\]\]>[\s\n]*<\/url>/i)?.[1] ||
                 content.match(/<url>([\s\S]*?)<\/url>/i)?.[1] || "").trim();
    const company = (content.match(/<company>[\s\n]*<!\[CDATA\[([\s\S]*?)\]\]>[\s\n]*<\/company>/i)?.[1] ||
                     content.match(/<company>([\s\S]*?)<\/company>/i)?.[1] || "Empresa Parceira").trim();
    const city = (content.match(/<city>[\s\n]*<!\[CDATA\[([\s\S]*?)\]\]>[\s\n]*<\/city>/i)?.[1] ||
                  content.match(/<city>([\s\S]*?)<\/city>/i)?.[1] || "Brasil").trim();
    const date = (content.match(/<date>[\s\n]*<!\[CDATA\[([\s\S]*?)\]\]>[\s\n]*<\/date>/i)?.[1] ||
                  content.match(/<date>([\s\S]*?)<\/date>/i)?.[1] || "").trim();

    if (title) {
      jobs.push({
        title,
        description: description || `Vaga de ${title} na empresa ${company}.`,
        companyName: company,
        location: city.toLowerCase().includes('home office') || city.toLowerCase().includes('remot') ? 'Remoto' : city,
        workMode: city.toLowerCase().includes('home office') || city.toLowerCase().includes('remot') ? 'remote' : 'onsite',
        sourceUrl: url,
        sourcePlatform: "ProgramaThor",
        publishedAt: date ? new Date(date).toISOString() : undefined
      });
    }
  }
  return jobs;
}

// 1. Programathor (OPERAÇÃO CONFIRMADA VIA JOBS.XML FEED)
export class ProgramathorConnector extends BaseJobConnector {
  readonly platformName = "ProgramaThor";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];
    try {
      const res = await fetch("https://programathor.com.br/jobs.xml", {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Erro ao carregar feed XML do ProgramaThor`);
      }
      
      const xml = await res.text();
      const allJobs = parseProgramaThorXml(xml);
      const kw = keyword.toLowerCase();

      // Filter by keyword
      const filtered = allJobs.filter(j => 
        j.title.toLowerCase().includes(kw) || 
        j.description.toLowerCase().includes(kw)
      );

      return filtered;
    } catch (err: any) {
      console.error("[ProgramathorConnector] Erro:", err.message);
      throw err;
    }
  }
}

// 2. Trampos.co (OPERAÇÃO CONFIRMADA VIA API V2)
export class TramposConnector extends BaseJobConnector {
  readonly platformName = "Trampos.co";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    try {
      const url = `https://trampos.co/api/v2/opportunities?search_term=${encodeURIComponent(keyword)}&page=${pageNum}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Erro na API Trampos.co`);
      }

      const data = await res.json();
      const opportunities = data.opportunities || [];
      if (!Array.isArray(opportunities)) return [];

      opportunities.forEach((op: any) => {
        jobs.push({
          title: op.name || "Vaga Trampos",
          description: op.description || "",
          companyName: op.company?.name || "Empresa Parceira",
          location: op.city ? `${op.city}, ${op.state || 'BR'}` : "Brasil",
          sourceUrl: op.permalink || `https://trampos.co/oportunidades/${op.id}`,
          sourcePlatform: this.platformName,
          publishedAt: op.published_at
        });
      });
      return jobs;
    } catch (err: any) {
      console.error("[TramposConnector] Erro:", err.message);
      throw err;
    }
  }
}

// 3. GeekHunter (FEED PÚBLICO DESCONTINUADO/REDIRECIONADO)
export class GeekHunterConnector extends BaseJobConnector {
  readonly platformName = "GeekHunter";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    // GeekHunter descontinuou o feed público RSS/XML em favor do portal fechado
    throw new Error("ENDPOINT_DEPRECATED: Feed XML público do GeekHunter foi descontinuado.");
  }
}

// 4. Revelo (FEED PÚBLICO DESCONTINUADO)
export class ReveloConnector extends BaseJobConnector {
  readonly platformName = "Revelo";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    // Revelo migrou todas as vagas para o banco exclusivo de candidatos logados
    throw new Error("ENDPOINT_DEPRECATED: Feed público do Revelo foi descontinuado.");
  }
}

// 5. Abler (API PÚBLICA DE BUSCA REDIRECIONADA)
export class AblerConnector extends BaseJobConnector {
  readonly platformName = "Abler";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    // Abler descontinuou o endpoint publico /api/v1/jobs (redireciona para portal de login)
    throw new Error("ENDPOINT_DEPRECATED: Endpoint público de busca da Abler foi descontinuado.");
  }
}
