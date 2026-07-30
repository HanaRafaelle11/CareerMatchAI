import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class GupyConnector extends BaseJobConnector {
  readonly platformName = "Gupy";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 2) return []; // Limite de 2 páginas para reduzir latência

    const jobs: RawJob[] = [];
    const limit = 10; // 10 vagas por busca — reduz tamanho da resposta e traz latência para ~3s
    const offset = Math.max(0, (pageNum - 1) * limit);

    const controller = new AbortController();
    // Timeout ajustado para 4200ms para encaixar no teto de 4.5s do Tier A
    const timeoutId = setTimeout(() => controller.abort(), 4200);

    try {
      const url = `https://employability-portal.gupy.io/api/v1/jobs?jobName=${encodeURIComponent(keyword)}&offset=${offset}&limit=${limit}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[GupyConnector] Resposta com status HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const rawJobs = data.data || [];
      if (!Array.isArray(rawJobs)) return [];

      rawJobs.forEach((j: any) => {
        let mode: 'remote' | 'hybrid' | 'onsite' | undefined = undefined;
        const wp = (j.workplaceType || '').toLowerCase();
        if (wp === 'remote' || j.isRemoteWork === true) mode = 'remote';
        else if (wp === 'hybrid') mode = 'hybrid';
        else if (wp === 'on-site' || wp === 'onsite' || wp === 'face_to_face') mode = 'onsite';

        const locStr = j.city 
          ? (j.state ? `${j.city}, ${j.state}` : j.city)
          : (j.isRemoteWork ? 'Remoto' : 'Brasil');

        const company = j.careerPageName || j.companyName || "Empresa Parceira Gupy";
        const link = j.jobUrl || j.careerPageUrl || `https://portal.gupy.io/job/${j.id}`;

        jobs.push({
          title: j.name || "Vaga Gupy",
          description: j.description || `Oportunidade na empresa ${company}.`,
          companyName: company,
          location: locStr,
          workMode: mode,
          sourceUrl: link,
          sourcePlatform: this.platformName,
          publishedAt: j.publishedDate
        });
      });

      return jobs;
    } catch (err: any) {
      console.warn("[GupyConnector] Falha ao consultar endpoint da Gupy:", err.message);
      return [];
    }
  }
}
