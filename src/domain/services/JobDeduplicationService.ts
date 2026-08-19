import type { Job } from '../models/types';

export type DuplicateClassification = 'EXACT_DUPLICATE' | 'PROBABLE_DUPLICATE' | 'DISTINCT';

export interface CanonicalJob extends Job {
  canonicalKey: string;
  providers: string[];
  sourceUrls: string[];
  canonicalSource: string;
  duplicateCount: number;
}

export class JobDeduplicationService {
  /**
   * Normaliza strings removendo acentos, caracteres especiais e espaços extras.
   */
  public static normalizeText(text?: string | null): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
      .replace(/\./g, '')              // remove pontos primeiro (ex: S.A. -> SA)
      .replace(/[^a-z0-9]/g, ' ')       // remove outros caracteres especiais
      .replace(/\s+/g, ' ')             // unifica múltiplos espaços
      .trim();
  }

  /**
   * Gera uma chave determinística canônica para agrupamento de vagas.
   */
  public static generateCanonicalKey(job: Partial<Job>): string {
    // Remove parênteses como (B2B SaaS), (Remoto), etc. para unificar chave canônica
    const rawTitle = (job.title || '').replace(/\s*\([^)]*\)/g, '');
    const title = this.normalizeText(rawTitle);
    const company = this.normalizeText(job.companyName);
    const location = this.normalizeText(job.location);
    const mode = this.normalizeText(job.workMode);

    return `${title}__${company}__${location || mode || 'any'}`;
  }

  /**
   * Classifica a relação de duplicidade entre duas vagas.
   */
  public static classifyDuplicate(jobA: Partial<Job>, jobB: Partial<Job>): DuplicateClassification {
    const titleA = this.normalizeText(jobA.title);
    const titleB = this.normalizeText(jobB.title);
    const compA = this.normalizeText(jobA.companyName);
    const compB = this.normalizeText(jobB.companyName);
    const locA = this.normalizeText(jobA.location);
    const locB = this.normalizeText(jobB.location);

    if (!titleA || !titleB) return 'DISTINCT';

    const isSameCompany = compA && compB && (compA === compB || compA.includes(compB) || compB.includes(compA));
    if (!isSameCompany) return 'DISTINCT';

    const isExactTitle = titleA === titleB;
    const isSimilarTitle = titleA.includes(titleB) || titleB.includes(titleA);

    const isSameLocation = locA === locB || locA.includes(locB) || locB.includes(locA) || !locA || !locB;

    if (isExactTitle && isSameLocation) {
      return 'EXACT_DUPLICATE';
    }

    if (isSimilarTitle && isSameLocation) {
      return 'PROBABLE_DUPLICATE';
    }

    return 'DISTINCT';
  }

  /**
   * Deduplica uma lista de vagas agregando provedores e URLs canônicas.
   * Não altera os dados de scoring ou matching.
   */
  public static deduplicateJobs(jobs: (Job & { provider?: string; url?: string })[]): CanonicalJob[] {
    const canonicalMap = new Map<string, CanonicalJob>();

    for (const job of jobs) {
      const canonicalKey = this.generateCanonicalKey(job);
      const provider = job.provider || 'default';
      const url = job.url || '';

      if (canonicalMap.has(canonicalKey)) {
        const existing = canonicalMap.get(canonicalKey)!;
        if (!existing.providers.includes(provider)) {
          existing.providers.push(provider);
        }
        if (url && !existing.sourceUrls.includes(url)) {
          existing.sourceUrls.push(url);
        }
        existing.duplicateCount++;
        // Se a vaga nova tiver requisitos mais completos, enriquece a vaga canônica
        if ((job.requirements?.length || 0) > (existing.requirements?.length || 0)) {
          existing.requirements = job.requirements;
        }
        if (!existing.salary && job.salary) {
          existing.salary = job.salary;
        }
      } else {
        const canonicalJob: CanonicalJob = {
          ...job,
          canonicalKey,
          providers: [provider],
          sourceUrls: url ? [url] : [],
          canonicalSource: provider,
          duplicateCount: 1
        };
        canonicalMap.set(canonicalKey, canonicalJob);
      }
    }

    return Array.from(canonicalMap.values());
  }
}
