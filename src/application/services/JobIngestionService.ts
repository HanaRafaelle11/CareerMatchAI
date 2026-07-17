import { type IngestionResult } from './parsers/BaseJobParser';
import { TextParser } from './parsers/TextParser';
import { UrlParser } from './parsers/UrlParser';
import { PdfParser } from './parsers/PdfParser';
import { GreenhouseParser } from './parsers/GreenhouseParser';

export class JobIngestionService {
  private textParser = new TextParser();
  private urlParser = new UrlParser();
  private pdfParser = new PdfParser();
  private greenhouseParser = new GreenhouseParser();

  async ingestText(input: { title: string; companyName?: string; description: string; requirementsInput?: string }): Promise<IngestionResult> {
    return this.textParser.parse(input);
  }

  async ingestUrl(url: string): Promise<IngestionResult> {
    const lowercaseUrl = url.toLowerCase().trim();
    
    if (lowercaseUrl.includes('greenhouse.io')) {
      return this.greenhouseParser.parse(url);
    }

    return this.urlParser.parse(url);
  }

  async ingestPdf(file: File): Promise<IngestionResult> {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Formato de arquivo inválido. Apenas arquivos PDF são aceitos.');
    }
    return this.pdfParser.parse(file);
  }

  async ingestGreenhouse(boardToken: string, jobId: string): Promise<IngestionResult> {
    return this.greenhouseParser.parse({ boardToken, jobId });
  }
}

export const jobIngestionService = new JobIngestionService();
