import { BaseJobParser, type IngestionResult } from './BaseJobParser';

export class GreenhouseParser extends BaseJobParser {
  private urlRegex = /boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i;

  async parse(input: string | { boardToken: string; jobId: string }): Promise<IngestionResult> {
    let boardToken = '';
    let jobId = '';

    if (typeof input === 'string') {
      const match = input.match(this.urlRegex);
      if (!match) {
        throw new Error('Link do Greenhouse inválido. O formato esperado é: https://boards.greenhouse.io/empresa/jobs/12345');
      }
      boardToken = match[1];
      jobId = match[2];
    } else {
      boardToken = input.boardToken;
      jobId = input.jobId;
    }

    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao obter dados da vaga no Greenhouse (Código ${response.status}).`);
    }

    const data = await response.json();
    
    // Strip HTML tags from description
    const cleanContent = (html: string) => {
      if (!html) return '';
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const description = data.content || '';
    const cleanDescription = cleanContent(description);

    // Mapear requisitos básicos por heurística simples a partir do texto
    const requirements: string[] = [];
    const keywords = ['react', 'typescript', 'javascript', 'node', 'python', 'aws', 'docker', 'sql', 'salesforce', 'nps'];
    keywords.forEach(kw => {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(cleanDescription)) {
        requirements.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    });

    if (requirements.length === 0) {
      requirements.push('Tecnologia');
    }

    return {
      title: data.title || 'Vaga Greenhouse',
      companyName: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
      description: cleanDescription,
      requirements,
      location: data.location?.name || 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      sourceUrl: data.absolute_url || (typeof input === 'string' ? input : undefined),
      sourcePlatform: 'greenhouse',
      benefits: []
    };
  }
}
