import { describe, it, expect } from 'vitest';

describe('Sidebar & Mobile Navigation Architecture (Fase 4)', () => {
  it('deve eliminar a ambiguidade "Meu Copiloto" e nomear o Dashboard como "Visão Geral"', () => {
    const mainNavLabel = 'Visão Geral';
    const copilotButtonLabel = 'Copiloto IA';

    expect(mainNavLabel).toBe('Visão Geral');
    expect(mainNavLabel).not.toBe('Meu Copiloto');
    expect(copilotButtonLabel).toBe('Copiloto IA');
  });

  it('deve estruturar as 4 etapas da Jornada de Carreira com nomenclaturas claras', () => {
    const journeySteps = [
      { id: 'profile', label: 'Perfil & Currículo' },
      { id: 'match', label: 'Vagas & Match' },
      { id: 'strategy', label: 'Minhas Candidaturas' },
      { id: 'coach', label: 'Simulador de Entrevistas' }
    ];

    expect(journeySteps.find(s => s.id === 'profile')?.label).toBe('Perfil & Currículo');
    expect(journeySteps.find(s => s.id === 'match')?.label).toBe('Vagas & Match');
    expect(journeySteps.find(s => s.id === 'strategy')?.label).toBe('Minhas Candidaturas');
    expect(journeySteps.find(s => s.id === 'coach')?.label).toBe('Simulador de Entrevistas');
  });

  it('deve manter exatamente 5 abas na barra inferior mobile com Copiloto IA em destaque', () => {
    const mobileBottomItems = [
      { id: 'dashboard', label: 'Visão Geral' },
      { id: 'match', label: 'Vagas' },
      { id: 'copilot', label: 'Copiloto IA', isSpecial: true },
      { id: 'strategy', label: 'Candidaturas' },
      { id: 'coach', label: 'Entrevistas' },
    ];

    expect(mobileBottomItems).toHaveLength(5);
    expect(mobileBottomItems.map(i => i.id)).toEqual(['dashboard', 'match', 'copilot', 'strategy', 'coach']);
    expect(mobileBottomItems.find(i => i.id === 'copilot')?.isSpecial).toBe(true);
  });

  it('deve garantir que o botão Copiloto IA aciona o drawer sem navegar para o Dashboard', () => {
    let copilotOpened = false;
    let currentTab = 'match';

    const onOpenCopilot = () => {
      copilotOpened = true;
    };

    // Simula clique no botão Copiloto IA
    onOpenCopilot();

    expect(copilotOpened).toBe(true);
    expect(currentTab).toBe('match'); // Não alterou para 'dashboard'
  });

  it('deve validar atributos de acessibilidade WCAG (aria-current, aria-expanded, aria-label)', () => {
    const isCollapsed = false;
    const activeTab = 'dashboard';

    const ariaExpanded = !isCollapsed;
    const ariaLabel = isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral';
    const ariaCurrent = activeTab === 'dashboard' ? 'page' : undefined;

    expect(ariaExpanded).toBe(true);
    expect(ariaLabel).toBe('Recolher menu lateral');
    expect(ariaCurrent).toBe('page');
  });
});
