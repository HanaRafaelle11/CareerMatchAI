import { BaseJobParser, type IngestionResult } from './BaseJobParser';

export class TextParser extends BaseJobParser {
  async parse(input: { title: string; companyName?: string; description: string; requirementsInput?: string }): Promise<IngestionResult> {
    const { title, companyName, description, requirementsInput = '' } = input;
    
    let requirements: string[] = [];
    if (requirementsInput.trim()) {
      requirements = requirementsInput.split(',').map(r => r.trim()).filter(Boolean);
    }

    return {
      title: title.trim() || 'Nova Vaga',
      companyName: companyName?.trim() || 'Inserida Manualmente',
      description: description.trim(),
      requirements,
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      sourcePlatform: 'manual',
      benefits: []
    };
  }
}
