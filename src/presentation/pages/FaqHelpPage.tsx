import React, { useState } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  ChevronDown, 
  Target, 
  ScanSearch, 
  BriefcaseBusiness, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  LayoutDashboard, 
  Settings, 
  FileText,
  Award,
  Bot
} from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';

interface FaqHelpPageProps {
  onBack?: () => void;
}

export const FaqHelpPage: React.FC<FaqHelpPageProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<'scores' | 'telas' | 'funcionalidades' | 'geral'>('scores');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'score-1': true,
    'tela-1': true
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const faqScores = [
    {
      id: 'score-1',
      title: '📈 Match da vaga (%)',
      icon: Target,
      desc: 'O Match da vaga é a porcentagem que mede a sintonia entre seu perfil e uma vaga específica.',
      details: 'Ele analisa simultaneamente: (1) Hard Skills exigidas na vaga vs. competências do seu currículo, (2) Match de cargo e área de atuação, (3) Exigências de senioridade. Vagas fora da sua área principal recebem uma trava de Match com pontuação ajustada (< 15%) para evitar falsos positivos.'
    },
    {
      id: 'score-2',
      title: '🤖 Score ATS & Leitura de Robôs (%)',
      icon: ScanSearch,
      desc: 'Mede a capacidade do seu currículo ser lido e aprovado pelos sistemas automatizados de seleção (Applicant Tracking Systems).',
      details: 'Avalia a estrutura do documento, termos técnicos de alto impacto, palavras-chave exatas da vaga e a estruturação das suas experiências no método STAR (Situação, Tarefa, Ação e Resultado).'
    },
    {
      id: 'score-3',
      title: '👑 Score de Senioridade (%)',
      icon: Award,
      desc: 'Estimativa da sua faixa hierárquica (Júnior, Pleno, Sênior, Lead ou Direção) calculada pela IA.',
      details: 'Calculada a partir dos anos acumulados de experiência profissional declarados e da complexidade das atribuições exercidas no seu histórico.'
    },
    {
      id: 'score-4',
      title: '🧠 Score Comportamental / Soft Skills (%)',
      icon: Sparkles,
      desc: 'Avaliação da presença de competências humanas e interpessoais cruciais para o ambiente de trabalho.',
      details: 'Identifica evidências no seu currículo de habilidades como comunicação, resiliência, liderança, organização e trabalho em equipe recomendadas para o cargo.'
    },
    {
      id: 'score-5',
      title: '🛡️ Score Geral de Saúde de Carreira (%)',
      icon: ShieldCheck,
      desc: 'Métrica sintética exibida no Dashboard que representa o nível geral de prontidão da sua carreira.',
      details: 'Combina a completude do seu perfil, a quantidade de candidaturas ativas organizadas no pipeline e o nível de preparo atingido no Simulador de Entrevistas.'
    }
  ];

  const faqTelas = [
    {
      id: 'tela-1',
      title: '🏠 Tela 1: Dashboard (Painel Principal)',
      icon: LayoutDashboard,
      desc: 'O centro de controle da sua jornada profissional no Vocentro.',
      details: 'Exibe o cartão do seu currículo ativo, o Score Geral de Carreira, briefing resumido do seu progresso, próximas etapas de entrevistas agendadas e acesso rápido com um clique para explorar novas vagas.'
    },
    {
      id: 'tela-2',
      title: '🎯 Tela 2: Vagas & Match (Explorar Vagas)',
      icon: Target,
      desc: 'Hub inteligente de busca e recomendação de oportunidades reais do mercado.',
      details: 'Reúne vagas agregadas (via Google Jobs e portais parceiros). Permite filtrar por palavras-chave, localização e vagas 100% remotas, exibindo o Match Score em cada card com link direto para o site de candidatura original.'
    },
    {
      id: 'tela-3',
      title: '👤 Tela 3: Perfil & Currículo (Inteligência de Carreira)',
      icon: UserCheck,
      desc: 'Local onde você gerencia seus currículos e visualiza a análise da IA.',
      details: 'Faça upload de arquivos em PDF/DOCX, selecione a Área Desejada (Cozinha/Gastronomia, TI, Admin, Vendas), veja competências mapeadas em badges coloridas, identifique Gaps de Competências específicos da sua área e exporte seu currículo otimizado em PDF ou texto.'
    },
    {
      id: 'tela-4',
      title: '📊 Tela 4: Estratégia & Candidaturas (Funil Kanban)',
      icon: BriefcaseBusiness,
      desc: 'Gerenciador visual para organizar cada processo seletivo em andamento.',
      details: 'Dividido nas colunas: "Inscrito", "Análise de RH", "Entrevista Agendada" e "Proposta/Aprovado". Permite adicionar novas vagas, registrar notas e acompanhar datas chave.'
    },
    {
      id: 'tela-5',
      title: '🤖 Tela 5: Coach IA (Simulador de Entrevistas)',
      icon: Bot,
      desc: 'Treinador virtual para preparar você antes de falar com recrutadores.',
      details: 'Simule entrevistas comportamentais e técnicas específicas para o seu cargo desejado, receba perguntas reais de RH, envie suas respostas e ganhe feedback imediato com dicas de melhoria.'
    },
    {
      id: 'tela-6',
      title: '⚙️ Tela 6: Configurações & Conta',
      icon: Settings,
      desc: 'Painel de controle pessoal e preferências do aplicativo.',
      details: 'Gerencie sua foto de perfil (com validação automática de até 5MB), nome de exibição, tema visual (Modo Escuro / Modo Claro) e segurança de acesso.'
    }
  ];

  const faqFuncionalidades = [
    {
      id: 'func-1',
      title: '🔍 Busca Inteligente & Link Direto da Vaga Original',
      icon: Target,
      desc: 'Ao clicar em um card de vaga do Google Jobs, o Vocentro redireciona você direto para a página original de candidatura (LinkedIn, Gupy, Catho, Glassdoor).',
      details: 'Evita pesquisas duplicadas no Google e economiza tempo no seu processo de candidatura.'
    },
    {
      id: 'func-2',
      title: '🍳 Seletor de Área Desejada & Gaps Personalizados',
      icon: Sparkles,
      desc: 'Permite selecionar sua área de destino caso esteja em transição de carreira (ex: migrando para Gastronomia/Cozinha).',
      details: 'A IA ajusta as sugestões de competências ausentes (Gaps) para os requisitos reais da área escolhida (ex: Manipulação de Alimentos, Anvisa, Mise en Place, Método PEPS de estoque).'
    },
    {
      id: 'func-3',
      title: '📱 Exportação de PDF Nativa para Dispositivos Móveis',
      icon: FileText,
      desc: 'Gere e baixe a versão otimizada do seu currículo direto do seu celular (Android Chrome ou iOS Safari).',
      details: 'Equipado com mecanismo de fallback via iframe para evitar bloqueios de janelas pop-up em navegadores mobile.'
    },
    {
      id: 'func-4',
      title: '📸 Validação Inteligente de Foto de Perfil',
      icon: UserCheck,
      desc: 'Envio seguro de fotos de perfil com mensagens explicativas ao usuário.',
      details: 'Caso o arquivo seja maior que 5MB ou de formato inválido, o sistema alerta o usuário via mensagem Toast amigável, orientando a escolha de um arquivo menor.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-500/30 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg bg-card border border-border hover:bg-card/80 text-foreground transition-colors cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <VocentroLogo className="h-7 text-foreground" showText={true} />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold hidden sm:inline-block">
            Central de Ajuda & FAQ Completa
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        
        {/* Title Header */}
        <div className="space-y-3 border-b border-border pb-6 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-bold font-mono">
            <HelpCircle size={14} />
            <span>Guia Completo da Plataforma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
            Central de Dúvidas & FAQ Vocentro
          </h1>
          <p className="text-sm text-muted-foreground">
            Entenda detalhadamente cada tela, pontuação de Match, método de análise e funcionalidade do aplicativo.
          </p>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-border pb-4">
          {[
            { id: 'scores', label: '📈 Métrica de Scores & Pontuações' },
            { id: 'telas', label: '📱 Guia de Telas da Plataforma' },
            { id: 'funcionalidades', label: '✨ Recursos & Funcionalidades' },
            { id: 'geral', label: '🛡️ Segurança & Suporte' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-card text-muted-foreground border border-border hover:bg-card/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category 1: Scores */}
        {activeCategory === 'scores' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Target size={20} className="text-brand-500" />
              O que significa cada Score no Vocentro?
            </h2>
            <div className="space-y-3">
              {faqScores.map(item => {
                const IconComponent = item.icon;
                return (
                  <div key={item.id} className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full p-5 text-left font-bold text-sm sm:text-base text-foreground flex justify-between items-center hover:bg-card/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={20} className="text-brand-500 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown size={18} className={`transition-transform shrink-0 ${openItems[item.id] ? 'rotate-180 text-brand-500' : 'text-muted-foreground'}`} />
                    </button>
                    {openItems[item.id] && (
                      <div className="p-5 pt-0 text-xs sm:text-sm text-muted-foreground space-y-2 border-t border-border mt-1">
                        <p className="font-semibold text-foreground">{item.desc}</p>
                        <p className="leading-relaxed bg-card/60 p-3.5 rounded-xl border border-border">{item.details}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 2: Telas */}
        {activeCategory === 'telas' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <LayoutDashboard size={20} className="text-emerald-500" />
              Conheça todas as Telas do Vocentro
            </h2>
            <div className="space-y-3">
              {faqTelas.map(item => {
                const IconComponent = item.icon;
                return (
                  <div key={item.id} className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full p-5 text-left font-bold text-sm sm:text-base text-foreground flex justify-between items-center hover:bg-card/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={20} className="text-emerald-500 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown size={18} className={`transition-transform shrink-0 ${openItems[item.id] ? 'rotate-180 text-emerald-500' : 'text-muted-foreground'}`} />
                    </button>
                    {openItems[item.id] && (
                      <div className="p-5 pt-0 text-xs sm:text-sm text-muted-foreground space-y-2 border-t border-border mt-1">
                        <p className="font-semibold text-foreground">{item.desc}</p>
                        <p className="leading-relaxed bg-card/60 p-3.5 rounded-xl border border-border">{item.details}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 3: Funcionalidades */}
        {activeCategory === 'funcionalidades' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Sparkles size={20} className="text-purple-500" />
              Recursos Especiais & Ferramentas Inteligentes
            </h2>
            <div className="space-y-3">
              {faqFuncionalidades.map(item => {
                const IconComponent = item.icon;
                return (
                  <div key={item.id} className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full p-5 text-left font-bold text-sm sm:text-base text-foreground flex justify-between items-center hover:bg-card/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={20} className="text-purple-500 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown size={18} className={`transition-transform shrink-0 ${openItems[item.id] ? 'rotate-180 text-purple-500' : 'text-muted-foreground'}`} />
                    </button>
                    {openItems[item.id] && (
                      <div className="p-5 pt-0 text-xs sm:text-sm text-muted-foreground space-y-2 border-t border-border mt-1">
                        <p className="font-semibold text-foreground">{item.desc}</p>
                        <p className="leading-relaxed bg-card/60 p-3.5 rounded-xl border border-border">{item.details}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 4: Geral */}
        {activeCategory === 'geral' && (
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <ShieldCheck size={20} className="text-brand-500" />
              Segurança, Privacidade & Suporte
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">Vocentro</strong> cumpre rigorosamente as normas da LGPD e as diretrizes de verificação de privacidade do Google OAuth.
            </p>
            <div className="p-4 rounded-xl bg-card/60 border border-border space-y-2 text-xs text-muted-foreground">
              <p><strong className="text-foreground">E-mail Único de Suporte:</strong> <a href="mailto:suporte@vocentro.com.br" className="text-brand-500 hover:underline font-bold">suporte@vocentro.com.br</a></p>
              <p><strong className="text-foreground">Termos Jurídicos:</strong> Consulte nossa <a href="/politica-de-privacidade" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/politica-de-privacidade'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-brand-500 hover:underline">Política de Privacidade</a> e nossos <a href="/termos-de-uso" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/termos-de-uso'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-brand-500 hover:underline">Termos de Uso</a>.</p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • suporte@vocentro.com.br</p>
      </footer>
    </div>
  );
};
