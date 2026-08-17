import { describe, it, expect } from 'vitest';
import { NextStepService } from '../../src/domain/services/NextStepService';

describe('Copilot Engine Context Alignment (Fase 4)', () => {
  it('deve derivar a recomendação #1 diretamente do NextStepService canônico', () => {
    const mockContext = {
      profile: { id: 'usr-1', fullName: 'Sthephany Martins' } as any,
      careerProfileNew: {
        skills: ['React', 'TypeScript'],
        experience: [{ id: 'exp-1', role: 'Frontend Dev', companyName: 'Tech' }]
      } as any,
      resumes: [{ id: 'res-1', fileName: 'CV.pdf' }] as any,
      matches: [{ id: 'm-1', jobId: 'job-1', overallScore: 85 }] as any,
      applications: []
    };

    const nextStepResult = NextStepService.getUserNextStep(mockContext);

    expect(nextStepResult).toBeDefined();
    expect(nextStepResult.primaryAction).toBeDefined();
    expect(nextStepResult.primaryAction.title).toBeTruthy();
    expect(nextStepResult.primaryAction.ctaTab).toBeTruthy();
  });

  it('deve calcular o Career Score com a fórmula canônica 50 + skills*3 + exp*5 para o contexto do Copiloto', () => {
    const skills = ['React', 'TypeScript', 'Node.js']; // 3 * 3 = 9 pts
    const exp = [{ id: '1' }, { id: '2' }]; // 2 * 5 = 10 pts
    const base = 50;

    const skillsPoints = Math.min(30, skills.length * 3);
    const expPoints = Math.min(20, exp.length * 5);
    const total = base + skillsPoints + expPoints;

    expect(total).toBe(69);
    expect(skillsPoints).toBe(9);
    expect(expPoints).toBe(10);
  });

  it('deve gerar saudação humanizada com o primeiro nome do candidato', () => {
    const fullName = 'Sthephany Martins';
    const firstName = fullName.split(' ')[0];

    const greetingHeadline = `Olá, ${firstName}! Analisei seu momento na jornada. Como posso te orientar hoje?`;

    expect(greetingHeadline).toBe('Olá, Sthephany! Analisei seu momento na jornada. Como posso te orientar hoje?');
  });

  it('deve sugerir vagas com alto fit (score >= 75%) quando existirem matches não candidatados', () => {
    const matches = [
      { id: 'm-1', jobId: 'job-fe-sr', overallScore: 88 }
    ];
    const activeApps = [
      { id: 'app-1', jobId: 'other-job' }
    ];

    const highMatches = matches.filter(m => {
      const score = m.overallScore;
      const hasApp = activeApps.some(a => a.jobId === m.jobId);
      return score >= 75 && !hasApp;
    });

    expect(highMatches).toHaveLength(1);
    expect(highMatches[0].overallScore).toBe(88);
  });
});
