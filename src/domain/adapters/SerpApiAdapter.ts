import { NormalizedJobResult } from '../../domain/models/types';
import { extractSeniorityFromJob } from '../../application/services/jobMatchEngine';

export class SerpApiAdapter {
  static transform(data: any, location: string = 'Brasil'): NormalizedJobResult[] {
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    const results = (data?.results || []).map((res: any, idx: number): NormalizedJobResult => {
      const title = (res.title || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
      const description = (res.description || res.snippet || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
      const company = res.company_name || res.company || 'Empresa Confidencial';
      const locStr = res.location || location;
      
      // PRIORIZAR O LINK DIRETO DA VAGA DA EMPRESA OU PORTAL DE CANDIDATURA (LinkedIn, Catho, Glassdoor, Gupy, InfoJobs)
      // Evitar links genéricos de busca do Google
      const directApplyUrl = res.apply_options?.[0]?.link || res.applyUrl || res.redirect_url || res.sourceUrl || res.url;
      const fallbackUrl = res.share_link || res.link || '';
      
      let finalUrl = directApplyUrl || fallbackUrl || '';
      if (finalUrl.includes('google.com/search') && fallbackUrl && !fallbackUrl.includes('google.com/search')) {
        finalUrl = fallbackUrl;
      }
      if (!finalUrl && res.apply_options && res.apply_options.length > 0) {
        finalUrl = res.apply_options[0].link || '';
      }

      const workMode = (locStr.toLowerCase().includes('remot') || title.toLowerCase().includes('remot') || res.detected_extensions?.work_from_home) ? 'remote' : 'onsite';
      const seniority = extractSeniorityFromJob(title, description);

      return {
        id: `serp_${res.job_id || idx}_${Date.now()}`,
        title,
        company,
        location: locStr,
        description,
        url: finalUrl,
        seniority,
        workMode,
        is_active: res.isActive !== false,
        posted_at: res.detected_extensions?.posted_at || new Date().toISOString(),
        salaryMin: res.salaryMin,
        salaryMax: res.salaryMax,
        currency: 'BRL',
        requirements: res.requirements || [],
        rawSource: res.sourcePlatform || 'Google Jobs (SerpApi)',
        sources: res.sources && res.sources.length > 0 ? res.sources : [res.sourcePlatform || 'Google Jobs (SerpApi)']
      };
    });

    return results;
  }
}
