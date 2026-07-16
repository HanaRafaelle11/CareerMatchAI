import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class GupyConnector extends BaseJobConnector {
  readonly platformName = "Gupy";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    try {
      // Query standard Gupy Portal API (used for the global search pages)
      const url = `https://portal.api.gupy.io/api/v1/jobs?name=${encodeURIComponent(keyword)}&page=${pageNum}&perPage=15`;
      const res = await fetch(url);
      if (!res.ok) return [];

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
    } catch (err) {
      console.error("[GupyConnector] Erro na busca de vagas:", err.message);
    }
    return jobs;
  }
}
