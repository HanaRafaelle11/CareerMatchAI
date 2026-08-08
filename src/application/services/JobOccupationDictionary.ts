/**
 * JobOccupationDictionary.ts
 *
 * Dicionário de famílias ocupacionais para fallback de busca de vagas.
 * Quando o termo literal do currículo não traz resultados suficientes,
 * a cascata usa este dicionário para encontrar o termo canônico da família.
 */

// ─── Dicionário de famílias: chave em lowercase → termos canônicos ordenados do mais específico ao mais amplo
export const OCCUPATION_FAMILIES: Record<string, string[]> = {
  // Ouvidoria / Relacionamento
  'ouvidor':              ['Ouvidor', 'Relacionamento com Cliente', 'Atendimento ao Cliente', 'Compliance'],
  'ouvidora':             ['Ouvidora', 'Relacionamento com Cliente', 'Atendimento ao Cliente'],
  'ouvidoria':            ['Ouvidoria', 'Relacionamento com Cliente', 'Atendimento ao Cliente', 'Compliance'],
  'ombudsman':            ['Ouvidoria', 'Compliance', 'Relacionamento com Cliente'],

  // Customer Success / CX
  'customer success':     ['Customer Success', 'Sucesso do Cliente', 'Customer Experience'],
  'sucesso do cliente':   ['Customer Success', 'Sucesso do Cliente', 'Atendimento ao Cliente'],
  'customer experience':  ['Customer Experience', 'Customer Success', 'Atendimento ao Cliente'],
  'cx':                   ['Customer Experience', 'Customer Success', 'Atendimento ao Cliente'],
  'cs':                   ['Customer Success', 'Sucesso do Cliente'],

  // Atendimento / SAC
  'atendimento':          ['Atendimento ao Cliente', 'Customer Success', 'SAC'],
  'sac':                  ['Atendimento ao Cliente', 'SAC', 'Customer Success'],
  'suporte':              ['Suporte ao Cliente', 'Atendimento ao Cliente', 'Customer Success'],
  'helpdesk':             ['Suporte Técnico', 'Helpdesk', 'Atendimento ao Cliente'],

  // Cozinha / Gastronomia
  'cozinheiro':           ['Cozinheiro', 'Gastronomia', 'Auxiliar de Cozinha'],
  'cozinheira':           ['Cozinheira', 'Gastronomia', 'Auxiliar de Cozinha'],
  'chefe de cozinha':     ['Chef de Cozinha', 'Gastronomia', 'Cozinheiro'],
  'chef':                 ['Chef de Cozinha', 'Gastronomia'],
  'gastronomia':          ['Gastronomia', 'Cozinheiro', 'Auxiliar de Cozinha'],
  'auxiliar de cozinha':  ['Auxiliar de Cozinha', 'Cozinheiro', 'Gastronomia'],
  'confeiteiro':          ['Confeiteiro', 'Gastronomia', 'Padeiro'],
  'padeiro':              ['Padeiro', 'Gastronomia', 'Confeiteiro'],

  // Tecnologia
  'desenvolvedor':        ['Desenvolvedor', 'Engenheiro de Software', 'Desenvolvedor Full Stack'],
  'desenvolvedor full stack': ['Desenvolvedor Full Stack', 'Desenvolvedor', 'Engenheiro de Software'],
  'desenvolvedor frontend':   ['Desenvolvedor Frontend', 'Desenvolvedor', 'Engenheiro de Software'],
  'desenvolvedor backend':    ['Desenvolvedor Backend', 'Desenvolvedor', 'Engenheiro de Software'],
  'engenheiro de software':   ['Engenheiro de Software', 'Desenvolvedor', 'Desenvolvedor Full Stack'],
  'software engineer':        ['Software Engineer', 'Desenvolvedor', 'Engenheiro de Software'],

  // Produto
  'product manager':      ['Product Manager', 'Gerente de Produto', 'Product Owner'],
  'product owner':        ['Product Owner', 'Product Manager', 'Analista de Produto'],
  'gerente de produto':   ['Gerente de Produto', 'Product Manager', 'Product Owner'],

  // Vendas
  'vendedor':             ['Vendedor', 'Representante Comercial', 'Account Executive'],
  'vendedora':            ['Vendedora', 'Representante Comercial', 'Account Executive'],
  'account executive':    ['Account Executive', 'Executivo de Vendas', 'Consultor de Vendas'],
  'executivo de vendas':  ['Executivo de Vendas', 'Account Executive', 'Representante Comercial'],
  'consultor de vendas':  ['Consultor de Vendas', 'Vendedor', 'Account Executive'],

  // Administrativo / Operações
  'analista administrativo': ['Analista Administrativo', 'Assistente Administrativo', 'Analista de Operações'],
  'assistente administrativo': ['Assistente Administrativo', 'Analista Administrativo', 'Auxiliar Administrativo'],
  'coordenador':          ['Coordenador', 'Analista', 'Supervisor'],
  'supervisor':           ['Supervisor', 'Coordenador', 'Analista'],
  'operações':            ['Analista de Operações', 'Operações', 'Coordenador de Operações'],
  'operations':           ['Operations Manager', 'Analista de Operações', 'Operações'],

  // Marketing
  'marketing':            ['Analista de Marketing', 'Marketing', 'Marketing Digital'],
  'marketing digital':    ['Marketing Digital', 'Analista de Marketing', 'Social Media'],
  'social media':         ['Social Media', 'Marketing Digital', 'Analista de Marketing'],

  // RH / Pessoas
  'recursos humanos':     ['Analista de RH', 'Recursos Humanos', 'People & Culture'],
  'rh':                   ['Analista de RH', 'Recursos Humanos', 'People & Culture'],
  'recrutamento':         ['Recrutador', 'Analista de RH', 'Talent Acquisition'],
  'talent acquisition':   ['Talent Acquisition', 'Recrutador', 'Analista de RH'],

  // Finanças / Contabilidade
  'financeiro':           ['Analista Financeiro', 'Financeiro', 'Controladoria'],
  'contabilidade':        ['Contador', 'Analista Contábil', 'Controladoria'],
  'contador':             ['Contador', 'Analista Contábil', 'Financeiro'],
};

// Qualificadores de senioridade/hierarquia a remover antes da busca
const SENIORITY_QUALIFIERS = [
  'estagiário', 'estagiaria', 'estágio',
  'júnior', 'junior', 'jr',
  'pleno', 'pl',
  'sênior', 'senior', 'sr',
  'especialista',
  'analista sênior', 'analista pleno', 'analista júnior', 'analista',
  'supervisor', 'supervisora',
  'coordenador', 'coordenadora',
  'gerente',
  'diretor', 'diretora',
  'head',
  'líder', 'lider',
  'assistente',
  'auxiliar',
  'trainee',
  'consultor', 'consultora',
  'nível 1', 'nível 2', 'nível 3', 'nivel 1', 'nivel 2', 'nivel 3',
  'level 1', 'level 2', 'level 3', 'n1', 'n2', 'n3'
];

const CONNECTOR_PATTERN = /\s*[&,\/]\s*|\s+e\s+/gi;

/**
 * Resolve os termos canônicos da família ocupacional para um título de cargo.
 * Retorna array vazio se não encontrar mapeamento.
 */
export function resolveOccupationFamilies(title: string): string[] {
  if (!title) return [];
  const lower = title.toLowerCase().trim();

  // Busca exata no dicionário
  if (OCCUPATION_FAMILIES[lower]) return OCCUPATION_FAMILIES[lower];

  // Busca por substring (chave contida no título ou título contido na chave)
  for (const [key, values] of Object.entries(OCCUPATION_FAMILIES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return values;
    }
  }

  return [];
}

/**
 * Simplifica o título do cargo para a cascata de busca.
 * Retorna lista ordenada de candidatos, do mais específico ao mais genérico:
 *   [0] literal completo
 *   [1] sem qualificador de senioridade/hierarquia
 *   [2..n] partes do título composto (split por &, e, /, ,)
 *   [n+1] família ocupacional canônica do dicionário
 */
export function simplifySearchTitle(rawTitle: string): string[] {
  if (!rawTitle) return [];

  const candidates: string[] = [];
  const original = rawTitle.trim();

  // Camada 1: literal completo
  candidates.push(original);

  // Remover qualificadores de senioridade
  let stripped = original;
  for (const qualifier of SENIORITY_QUALIFIERS) {
    const regex = new RegExp(`\\b${qualifier}\\b`, 'gi');
    stripped = stripped.replace(regex, '').trim();
  }
  // Limpar espaços duplos e preposições soltas
  stripped = stripped.replace(/\s+(de|do|da|dos|das|em|para|no|na)\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();

  // Camada 2: sem qualificador (se diferente do original)
  if (stripped && stripped.toLowerCase() !== original.toLowerCase()) {
    candidates.push(stripped);
  }

  // Camada 3: partes do título composto (split por conectores)
  const parts = stripped
    .split(CONNECTOR_PATTERN)
    .map(p => p.trim())
    .filter(p => p.length > 2);

  if (parts.length > 1) {
    for (const part of parts) {
      if (!candidates.some(c => c.toLowerCase() === part.toLowerCase())) {
        candidates.push(part);
      }
    }
  }

  // Camada 4: família ocupacional canônica
  const familyCandidates = resolveOccupationFamilies(stripped || original);
  for (const fam of familyCandidates) {
    if (!candidates.some(c => c.toLowerCase() === fam.toLowerCase())) {
      candidates.push(fam);
    }
  }

  // Deduplicar preservando ordem
  return Array.from(new Set(candidates.map(c => c))).filter(Boolean);
}
