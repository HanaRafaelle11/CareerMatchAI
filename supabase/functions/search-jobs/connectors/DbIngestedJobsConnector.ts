import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class DbIngestedJobsConnector extends BaseJobConnector {
  readonly platformName = "Banco de Vagas Ingeridas (InHire)";

  private supabaseClient: any;

  constructor(supabaseClient?: any) {
    super();
    this.supabaseClient = supabaseClient;
  }

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (!this.supabaseClient) {
      console.warn("[DbIngestedJobsConnector] SupabaseClient não injetado.");
      return [];
    }

    const pageSize = 30;
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      const cleanKeyword = (keyword || '').trim();
      let query = this.supabaseClient
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cleanKeyword && cleanKeyword !== 'Vagas' && cleanKeyword !== 'Brasil') {
        const terms = [cleanKeyword];
        const lowerKwd = cleanKeyword.toLowerCase();

        // Mapeamento de Sinônimos Comuns (Fuzzy Match Expandido)
        if (lowerKwd.includes('ajudante')) terms.push(lowerKwd.replace('ajudante', 'auxiliar'), lowerKwd.replace('ajudante', 'assistente'));
        if (lowerKwd.includes('auxiliar')) terms.push(lowerKwd.replace('auxiliar', 'ajudante'), lowerKwd.replace('auxiliar', 'assistente'));
        if (lowerKwd.includes('vendedor')) terms.push('vendas', 'comercial', 'consultor');
        if (lowerKwd.includes('desenvolvedor')) terms.push('programador', 'developer', 'software');

        const uniqueTerms = Array.from(new Set(terms));
        const orClauses: string[] = [];
        uniqueTerms.forEach(t => {
          orClauses.push(`title.ilike.%${t}%,company_name.ilike.%${t}%,description.ilike.%${t}%`);
        });

        query = query.or(orClauses.join(','));
      }

      const { data, error } = await query;

      if (error) {
        console.warn("[DbIngestedJobsConnector] Erro ao consultar tabela jobs:", error.message);
        return [];
      }

      if (!data || !Array.isArray(data)) return [];

      return data.map((j: any): RawJob => ({
        title: j.title || "Vaga Ingerida",
        description: j.description || `Oportunidade publicada na empresa ${j.company_name}.`,
        companyName: j.company_name || "Empresa Parceira",
        location: j.location || "Brasil",
        workMode: (j.work_mode as any) || 'onsite',
        sourceUrl: j.url || j.source_url || "",
        sourcePlatform: j.source_platform ? `Ingested (${j.source_platform})` : this.platformName,
        publishedAt: j.created_at,
        salaryMin: j.salary_min || undefined,
        salaryMax: j.salary_max || undefined
      }));
    } catch (err: any) {
      console.warn("[DbIngestedJobsConnector] Falha ao consultar banco local:", err.message);
      return [];
    }
  }
}
