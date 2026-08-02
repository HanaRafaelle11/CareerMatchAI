import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class GupyConnector extends BaseJobConnector {
  readonly platformName = "Gupy";

  async searchJobs(keyword: string, _location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 2) return []; // Limite de 2 páginas para reduzir latência

    const jobs: RawJob[] = [];
    const limit = 10;
    const offset = Math.max(0, (pageNum - 1) * limit);

    // Tentativa 1: API v1 do employability portal (endpoint público)
    const primaryUrl = `https://employability-portal.gupy.io/api/v1/jobs?jobName=${encodeURIComponent(keyword)}&offset=${offset}&limit=${limit}`;
    // Fallback: busca pública gupy.io (alternativa documentada)
    const fallbackUrl = `https://portal.gupy.io/api/v1/jobs?jobName=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`;

    const tryFetch = async (url: string): Promise<RawJob[]> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Referer': 'https://portal.gupy.io/'
          }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.warn(`[GupyConnector] HTTP ${res.status} em ${url}`);
          return [];
        }

        const data = await res.json();
        const rawJobs = Array.isArray(data) ? data : (data.data || data.results || data.jobs || []);
        if (!Array.isArray(rawJobs) || rawJobs.length === 0) return [];

        rawJobs.forEach((j: any) => {
          let mode: 'remote' | 'hybrid' | 'onsite' | undefined = undefined;
          const wp = (j.workplaceType || '').toLowerCase();
          if (wp === 'remote' || j.isRemoteWork === true) mode = 'remote';
          else if (wp === 'hybrid') mode = 'hybrid';
          else if (wp === 'on-site' || wp === 'onsite' || wp === 'face_to_face') mode = 'onsite';

          const locStr = j.city
            ? (j.state ? `${j.city}, ${j.state}` : j.city)
            : (j.isRemoteWork ? 'Remoto' : 'Brasil');

          const company = j.careerPageName || j.companyName || j.company || "Empresa Parceira Gupy";
          const link = j.jobUrl || j.careerPageUrl || (j.id ? `https://portal.gupy.io/job/${j.id}` : undefined);
          if (!link) return;

          jobs.push({
            title: j.name || j.title || "Vaga Gupy",
            description: j.description || `Oportunidade em ${company} via Gupy.`,
            companyName: company,
            location: locStr,
            workMode: mode,
            sourceUrl: link,
            sourcePlatform: this.platformName,
            publishedAt: j.publishedDate || j.publishedAt
          });
        });

        return jobs;
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[GupyConnector] Falha em ${url}:`, err.message);
        return [];
      }
    };

    // Tenta endpoint primário; se vazio, tenta fallback
    const primary = await tryFetch(primaryUrl);
    if (primary.length > 0) return primary;

    console.log('[GupyConnector] Endpoint primário sem resultados. Tentando fallback...');
    return await tryFetch(fallbackUrl);
  }
}
