import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class GupyConnector extends BaseJobConnector {
  readonly platformName = "Gupy";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    // Gupy legacy public search API portal.api.gupy.io was protected with partner auth tokens.
    // We attempt fetching, but if 404/401 is returned, throw explicit deprecation/auth error.
    const url = `https://portal.api.gupy.io/api/v1/jobs?name=${encodeURIComponent(keyword)}&page=${pageNum}&perPage=15`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        throw new Error(`AUTH_REQUIRED: Portal Gupy requer token de integração de parceiro (HTTP ${res.status}).`);
      }
      throw new Error(`HTTP ${res.status}: Erro ao consultar API Gupy.`);
    }

    const data = await res.json();
    const rawJobs = data.data || [];
    if (!Array.isArray(rawJobs)) return [];

    rawJobs.forEach((j: any) => {
      let mode: 'remote' | 'hybrid' | 'onsite' | undefined = undefined;
      if (j.workMode === 'remote') mode = 'remote';
      else if (j.workMode === 'hybrid') mode = 'hybrid';
      else if (j.workMode === 'face_to_face') mode = 'onsite';

      const subdomain = j.careerPageSubdomain || j.companySubdomain || "portal";
      const link = `https://${subdomain}.gupy.io/jobs/${j.id}`;

      jobs.push({
        title: j.name || "Vaga Gupy",
        description: j.description || `Oportunidade na empresa ${j.companyName || 'Confidencial'}.`,
        companyName: j.companyName || "Empresa Parceira Gupy",
        location: j.addressCity ? `${j.addressCity}, ${j.addressState || 'BR'}` : "Brasil",
        workMode: mode,
        sourceUrl: link,
        sourcePlatform: this.platformName,
        publishedAt: j.publishedAt
      });
    });

    return jobs;
  }
}
