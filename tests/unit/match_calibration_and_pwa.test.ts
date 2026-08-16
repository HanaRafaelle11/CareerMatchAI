import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { MatchingEngine } from '../../src/application/services/matchingEngine';

describe('Validação de Calibração de Match, PWA Manifest e Service Worker', () => {

  describe('1. Calibração Realista do Match Estimado (calculateMatchSync)', () => {
    const ouvidoriaResume: any = {
      id: 'res_ouvidoria_01',
      fileName: 'Curriculo_Ouvidoria_SAC.pdf',
      skills: [
        'Atendimento ao Cliente',
        'Ouvidoria',
        'Mediação de Conflitos',
        'Gestão de Reclamações',
        'Procon / Consumidor.gov',
        'Relacionamento com Cliente',
        'Empatia e Comunicação',
        'Zendesk',
        'Reclame Aqui'
      ],
      yearsOfExperience: 6,
      structured_data: {
        experience: [
          { role: 'Ouvidor Sênior', company: 'Empresa A', years: 4 }
        ]
      }
    };

    const ouvidoriaProfile: any = {
      personal: {
        preferences: {
          targetRoles: ['Ouvidor', 'Analista de Ouvidoria', 'Especialista de Atendimento ao Cliente'],
          salaryExpectationMin: 6000
        }
      },
      skills: ouvidoriaResume.skills,
      experience: ouvidoriaResume.structured_data.experience
    };

    it('deve atribuir score baixo (<= 15%) para vaga totalmente incompatível (Product Manager) sem piso inflado', () => {
      const productManagerJob: any = {
        id: 'job_pm_01',
        title: 'Product Manager',
        companyName: 'Enter Tech',
        location: 'São Paulo, SP',
        seniority: 'Pleno',
        requirements: [
          'Experiência como Product Manager / PM',
          'Roadmap de Produto',
          'Métricas de Produto (CAC, LTV, Churn)',
          'Scrum e Kanban para Produto',
          'SQL para análise de produto',
          'Discovery contínuo'
        ],
        workMode: 'remote'
      };

      const pmMatch = MatchingEngine.calculateMatchSync(ouvidoriaResume, productManagerJob, ouvidoriaProfile);
      
      expect(pmMatch.scoreTechnical).toBe(0);
      expect(pmMatch.scoreOverall).toBeLessThanOrEqual(15);
      expect(pmMatch.scoreOverall).toBeGreaterThan(0);
    });

    it('deve atribuir score alto (>= 80%) para vaga compatível (Ouvidor Sênior)', () => {
      const ouvidorJob: any = {
        id: 'job_ouvidor_01',
        title: 'Ouvidor Sênior',
        companyName: 'Banco Digital B',
        location: 'São Paulo, SP',
        seniority: 'Senior',
        requirements: [
          'Ouvidoria',
          'Atendimento ao Cliente',
          'Mediação de Conflitos',
          'Zendesk',
          'Reclame Aqui'
        ],
        workMode: 'hybrid'
      };

      const ouvidorMatch = MatchingEngine.calculateMatchSync(ouvidoriaResume, ouvidorJob, ouvidoriaProfile);
      expect(ouvidorMatch.scoreOverall).toBeGreaterThanOrEqual(80);
    });
  });

  describe('2. Validação do Manifest PWA (Android WebAPK Compliance)', () => {
    const manifestWeb = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf-8'));
    const manifestJson = JSON.parse(fs.readFileSync('public/manifest.json', 'utf-8'));

    it('deve conter campos essenciais de conformidade moderna PWA', () => {
      expect(manifestWeb.id).toBe('https://vocentro.com.br/');
      expect(manifestWeb.display).toBe('standalone');
      expect(manifestWeb.start_url).toBe('/?source=pwa');
      expect(manifestWeb.icons.length).toBeGreaterThanOrEqual(4);
      expect(manifestWeb.screenshots.length).toBeGreaterThanOrEqual(2);
      expect(manifestWeb.categories).toContain('business');
      expect(manifestWeb.prefer_related_applications).toBe(false);
      expect(JSON.stringify(manifestWeb)).toBe(JSON.stringify(manifestJson));
    });
  });

  describe('3. Validação do Service Worker (public/sw.js)', () => {
    const swContent = fs.readFileSync('public/sw.js', 'utf-8');

    it('deve conter ciclo de vida imediato e estratégias de cache corretas', () => {
      expect(swContent).toContain('self.skipWaiting()');
      expect(swContent).toContain('self.clients.claim()');
      expect(swContent).toContain("request.mode === 'navigate'");
      expect(swContent).toContain('caches.delete');
      expect(swContent).toContain('supabase.co');
    });
  });

  describe('4. Limpeza de Badges no CompactHeader', () => {
    const headerContent = fs.readFileSync('src/presentation/components/ds/CompactHeader.tsx', 'utf-8');

    it('não deve conter o badge confuso IA {aiScore}%', () => {
      expect(headerContent).not.toContain('IA {aiScore}%');
    });
  });

  describe('5. Limpeza de Jargão Técnico no JobMatchHub', () => {
    const hubContent = fs.readFileSync('src/presentation/pages/JobMatchHub.tsx', 'utf-8');

    it('deve exibir Prévia de Match e não conter Jaccard cru', () => {
      expect(hubContent).toContain('Prévia de Match: ~{job.scoreOverall}%');
      expect(hubContent).not.toContain('Jaccard: Math');
    });
  });
});
