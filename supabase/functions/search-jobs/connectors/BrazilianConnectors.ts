import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

// Helper XML/RSS Parser
function parseRssXml(xml: string) {
  const items: any[] = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of matches) {
    const content = match[1];
    const title = (content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] || 
                   content.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
    const description = (content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] || 
                         content.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || "").trim();
    const link = (content.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
    const company = (content.match(/<companyName>([\s\S]*?)<\/companyName>/i)?.[1] ||
                     content.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/i)?.[1] || "Empresa").trim();
    const pubDate = (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
    items.push({ title, description, link, company, pubDate });
  }
  return items;
}

// 1. Programathor
export class ProgramathorConnector extends BaseJobConnector {
  readonly platformName = "ProgramaThor";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];
    const jobs: RawJob[] = [];
    try {
      // Programathor public board feed
      const res = await fetch("https://programathor.com.br/jobs/rss", { method: "GET" });
      if (!res.ok) return [];
      
      const xml = await res.text();
      const items = parseRssXml(xml);
      const kw = keyword.toLowerCase();

      items.forEach((item) => {
        if (item.title.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)) {
          jobs.push({
            title: item.title,
            description: item.description,
            companyName: item.company || "Parceiro ProgramaThor",
            location: "Brasil",
            sourceUrl: item.link,
            sourcePlatform: this.platformName,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined
          });
        }
      });
    } catch (err) {
      console.error("[ProgramathorConnector] Erro ao carregar feed:", err.message);
    }
    return jobs;
  }
}

// 2. Trampos.co
export class TramposConnector extends BaseJobConnector {
  readonly platformName = "Trampos.co";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    try {
      // Trampos public API feed for searching opportunities
      const url = `https://trampos.co/api/v2/opportunities?search_term=${encodeURIComponent(keyword)}&page=${pageNum}`;
      const res = await fetch(url);
      if (!res.ok) return [];

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
    } catch (err) {
      console.error("[TramposConnector] Erro ao buscar vagas:", err.message);
    }
    return jobs;
  }
}

// 3. GeekHunter
export class GeekHunterConnector extends BaseJobConnector {
  readonly platformName = "GeekHunter";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];
    const jobs: RawJob[] = [];
    try {
      // GeekHunter public job feed XML/RSS
      const res = await fetch("https://www.geekhunter.com.br/jobs.xml");
      if (!res.ok) return [];
      const xml = await res.text();
      const items = parseRssXml(xml);
      const kw = keyword.toLowerCase();

      items.forEach((item) => {
        if (item.title.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)) {
          jobs.push({
            title: item.title,
            description: item.description,
            companyName: item.company || "Parceiro GeekHunter",
            location: "Brasil",
            sourceUrl: item.link,
            sourcePlatform: this.platformName,
            publishedAt: item.pubDate
          });
        }
      });
    } catch (err) {
      console.error("[GeekHunterConnector] Erro ao carregar feed:", err.message);
    }
    return jobs;
  }
}

// 4. Revelo
export class ReveloConnector extends BaseJobConnector {
  readonly platformName = "Revelo";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];
    const jobs: RawJob[] = [];
    try {
      // Revelo public developer board feed
      const res = await fetch("https://revelo.com.br/jobs/feed.xml");
      if (!res.ok) return [];
      const xml = await res.text();
      const items = parseRssXml(xml);
      const kw = keyword.toLowerCase();

      items.forEach((item) => {
        if (item.title.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)) {
          jobs.push({
            title: item.title,
            description: item.description,
            companyName: item.company || "Parceiro Revelo",
            location: "Brasil",
            sourceUrl: item.link,
            sourcePlatform: this.platformName,
            publishedAt: item.pubDate
          });
        }
      });
    } catch (err) {
      console.warn("[ReveloConnector] Feeds públicos offline. Retornando lista vazia.");
    }
    return jobs;
  }
}

// 5. Abler
export class AblerConnector extends BaseJobConnector {
  readonly platformName = "Abler";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    try {
      // Abler public career portal search API
      const url = `https://vagas.abler.com.br/api/v1/jobs?search=${encodeURIComponent(keyword)}&page=${pageNum}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      
      const data = await res.json();
      const items = data.data || [];
      if (!Array.isArray(items)) return [];

      items.forEach((j: any) => {
        jobs.push({
          title: j.title || "Vaga Abler",
          description: j.description || "",
          companyName: j.company?.name || "Empresa Parceira",
          location: j.location || "Brasil",
          sourceUrl: j.url || `https://vagas.abler.com.br/vaga/${j.id}`,
          sourcePlatform: this.platformName,
          publishedAt: j.created_at
        });
      });
    } catch (err) {
      console.warn("[AblerConnector] Erro ao consultar a API Abler.");
    }
    return jobs;
  }
}
