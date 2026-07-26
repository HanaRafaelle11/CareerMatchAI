import { useState } from 'react';
import { 
  FileText, 
  Search, 
  MessageSquare, 
  Trophy, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  Sparkles,
  Check,
  UserCheck,
  ShieldCheck,
  Mail,
  CheckSquare
} from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';
import { HeroProductMockup } from '../components/HeroProductMockup';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'signup') => void;
}

export function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqData = [
    {
      q: 'Meus dados ficam seguros no Vocentro?',
      a: 'Sim, totalmente. Seus dados profissionais, currículos e histórico de simulações são criptografados de ponta a ponta e armazenados de acordo com as diretrizes da LGPD/GDPR. O Vocentro garante que seus dados pertencem exclusivamente a você e nunca são compartilhados ou vendidos a terceiros sem seu consentimento explícito.'
    },
    {
      q: 'Por que o Vocentro utiliza o login do Google?',
      a: 'O login com o Google no Vocentro serve única e exclusivamente para autenticação rápida e segura do usuário. Ele evita a necessidade de memorizar senhas adicionais e permite acessar a plataforma em um clique. O Vocentro não lê, não edita e não possui acesso a e-mails do Gmail, contatos ou arquivos do Google Drive.'
    },
    {
      q: 'A Inteligência Artificial realmente melhora meu currículo?',
      a: 'Sim. Nosso motor semântico analisa a descrição e os requisitos da vaga desejada, identificando termos técnicos relevantes e sugerindo adaptações no padrão STAR (Situação, Tarefa, Ação, Resultado). Isso aumenta significativamente a aprovação em robôs de triagem automáticos de RH (ATS) mantendo a veracidade das suas experiências.'
    },
    {
      q: 'Posso cancelar o plano Premium quando quiser?',
      a: 'Sim, sem burocracia. O plano Premium pode ser cancelado a qualquer momento com apenas um clique em seu painel de faturamento. Não há contratos de fidelidade ou taxas ocultas.'
    },
    {
      q: 'Como funciona o Match de Vagas?',
      a: 'Realizamos uma análise de afinidade semântica tridimensional comparando (1) Requisitos Técnicos, (2) Competências Comportamentais e (3) Nível de Senioridade. Com isso, indicamos uma nota percentual de compatibilidade e a lista exata de lacunas para sua aprovação.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-800 font-sans relative overflow-x-hidden selection:bg-brand-500/30 selection:text-white transition-colors duration-300">
      
      {/* Subtle Ambient Background Gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-brand-500/5 dark:bg-brand-500/5 light:bg-brand-500/3 blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vh] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 light:bg-indigo-500/3 blur-[100px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/95 backdrop-blur-md border-b border-slate-900 dark:border-slate-900 light:border-slate-200 flex items-center justify-between px-6 z-50 transition-colors duration-300 shadow-xs">
        <VocentroLogo className="h-7 text-white dark:text-white light:text-slate-900" showText={true} />
        
        <nav className="hidden md:flex items-center gap-5">
          <a href="#sobre" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Sobre o Vocentro</a>
          <a href="#como-funciona" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Como funciona</a>
          <a href="#recursos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Recursos</a>
          <a href="#quem-somos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Quem somos</a>
          <a href="#planos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Planos</a>
          <a href="/about.html" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Institucional</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5 min-h-[32px] inline-flex items-center"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-sm cursor-pointer min-h-[36px] inline-flex items-center"
          >
            Começar gratuitamente
          </button>
        </div>
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative pt-20 pb-8 px-6 md:px-12 z-10 w-full max-w-7xl mx-auto font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Left Hero Copy */}
          <div className="lg:col-span-5 flex flex-col items-start gap-3.5 text-left w-full min-w-0">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 light:text-brand-600 text-[10px] font-bold tracking-wider uppercase font-mono">
                <Sparkles size={10} className="animate-pulse" />
                Vocentro | Inteligência Artificial para Carreiras
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display w-full block">
              Vocentro
            </h1>

            <h2 className="text-base sm:text-lg font-bold text-brand-accent dark:text-brand-accent light:text-brand-600 font-display leading-snug w-full block">
              Encontre vagas compatíveis, aumente seu Match Score e prepare-se para entrevistas com Inteligência Artificial.
            </h2>
            
            <div className="w-full max-w-lg">
              <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs sm:text-sm leading-relaxed font-normal w-full block">
                O Vocentro é uma plataforma de carreira que utiliza Inteligência Artificial para ajudar profissionais a encontrar vagas, otimizar currículos ATS, preparar entrevistas e acompanhar candidaturas em um único lugar.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck size={15} className="text-brand-accent shrink-0" />
              <span>Autenticação simples e segura por E-mail ou Conta Google</span>
            </div>
            
            {/* Prominent Hero CTA Button */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="h-13 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-brand-500/25 border border-brand-400/30 cursor-pointer hover:scale-[1.02]"
              >
                Começar gratuitamente
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => onNavigateToAuth('login')}
                className="h-13 px-6 py-3.5 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Entrar
              </button>
            </div>

            {/* Social Proof */}
            <div className="w-full pt-3 border-t border-slate-900/80 dark:border-slate-900/80 light:border-slate-200 font-sans flex flex-wrap items-center gap-2 text-xs">
              <div className="flex text-amber-400 text-sm font-bold tracking-tight">★★★★★</div>
              <span className="text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium text-[11px]">
                <strong className="text-white dark:text-white light:text-slate-900 font-bold">2.300+ profissionais</strong> já usaram o Vocentro
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                94% de aprovação
              </span>
            </div>
          </div>

          {/* Right Hero - Product Mockup */}
          <div className="lg:col-span-7 flex justify-center relative w-full font-sans">
            <HeroProductMockup onSimulateClick={() => onNavigateToAuth('signup')} />
          </div>
        </div>
      </section>

      {/* ── 2. SEÇÃO INSTITUCIONAL OBRIGATÓRIA: SOBRE O VOCENTRO (LOGO APÓS O HERO) ── */}
      <section id="sobre" className="py-8 sm:py-9 px-6 max-w-5xl mx-auto relative z-10 w-full min-w-0 font-sans">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-4 shadow-md">
          <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto mb-2">
            <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
              Institucional
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
              Sobre o Vocentro
            </h2>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed space-y-3.5 max-w-4xl mx-auto font-normal">
            <p>
              O <strong>Vocentro</strong> é uma plataforma de desenvolvimento profissional e apoio à carreira projetada para otimizar e estruturar toda a jornada de busca por oportunidades de trabalho. Utilizando tecnologia de Inteligência Artificial semântica, o Vocentro atua como uma central inteligente de gestão de candidaturas para trabalhadores e profissionais de diferentes áreas de atuação.
            </p>
            <p>
              A aplicação permite que o candidato cadastre seu perfil e faça upload do seu currículo profissional em formato PDF. A partir dessas informações, o motor de Inteligência Artificial do Vocentro analisa a compatibilidade entre as experiências do usuário e os requisitos das vagas de emprego cadastradas, calculando um <strong>Match Score</strong> percentual de afinidade e identificando pontos fortes e lacunas técnicas a serem aprimoradas.
            </p>
            <p>
              Além do mapeamento de oportunidades, o Vocentro oferece ferramentas de otimização de currículo focadas na aprovação em robôs de triagem de Recursos Humanos (sistemas ATS), reestruturando conquistas profissionais no método STAR (Situação, Tarefa, Ação, Resultado). A plataforma dispõe também de um simulador interativo de entrevistas conduzido pela Recrutadora IA e de um painel Kanban para acompanhamento de candidaturas ativas.
            </p>
            <p>
              Para a conveniência e segurança dos usuários, o Vocentro oferece autenticação simples por e-mail ou integração segura com a Conta Google (Google OAuth 2.0).
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-white block">📌 Ferramenta de Apoio ao Candidato</span>
              <p>
                O Vocentro opera exclusivamente como uma ferramenta consultiva e de orientação para o candidato. O Vocentro <strong>não</strong> publica vagas automaticamente em portais externos e <strong>não</strong> envia currículos a empresas ou recrutadores sem o consentimento e o comando explícito do usuário.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. COMO FUNCIONA (FLUXO EM 6 ETAPAS COMPACTAS) ── */}
      <section id="como-funciona" className="py-8 sm:py-9 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto mb-6">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Metodologia
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Como funciona o Vocentro
          </h2>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans max-w-lg">
            Um fluxo visual integrado em seis etapas para transformar sua busca de vagas em aprovação.
          </p>
        </div>

        {/* 6-Step Visual Grid (3 cols x 2 rows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-6xl mx-auto font-sans">
          {[
            {
              step: '01',
              title: 'Cadastrar',
              desc: 'Crie sua conta no Vocentro de forma rápida e segura utilizando sua Conta Google ou e-mail.',
              icon: <UserCheck className="w-4 h-4 text-brand-accent" />
            },
            {
              step: '02',
              title: 'Enviar currículo',
              desc: 'Suba seu arquivo original em PDF para que o Vocentro leia e estruture seu perfil de competências.',
              icon: <FileText className="w-4 h-4 text-brand-accent" />
            },
            {
              step: '03',
              title: 'Encontrar vagas',
              desc: 'Mapeie oportunidades de trabalho alinhadas ao seu objetivo em múltiplos portais e empresas.',
              icon: <Search className="w-4 h-4 text-brand-accent" />
            },
            {
              step: '04',
              title: 'Receber análises',
              desc: 'Visualize seu Match Score percentual de afinidade, pontos fortes e lacunas técnicas para a vaga.',
              icon: <Trophy className="w-4 h-4 text-brand-accent" />
            },
            {
              step: '05',
              title: 'Preparar entrevistas',
              desc: 'Simule entrevistas reais no método STAR com a Recrutadora IA e receba feedback em tempo real.',
              icon: <MessageSquare className="w-4 h-4 text-brand-accent" />
            },
            {
              step: '06',
              title: 'Acompanhar candidaturas',
              desc: 'Gerencie todo o seu pipeline de processos seletivos em um painel Kanban intuitivo.',
              icon: <CheckSquare className="w-4 h-4 text-brand-accent" />
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <div className="p-1.5 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
                    {item.icon}
                  </div>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-700 light:text-slate-300 font-mono">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display mb-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. RECURSOS DA PLATAFORMA (EXATAMENTE 4 CARDS ESSENCIAIS) ── */}
      <section id="recursos" className="py-8 sm:py-9 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto mb-6">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Recursos Essenciais
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Recursos da Plataforma
          </h2>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans max-w-lg">
            As quatro ferramentas de Inteligência Artificial focadas na sua aceleração profissional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-6xl mx-auto font-sans">
          {[
            {
              title: 'Busca Inteligente de Vagas',
              desc: 'Mapeamento automatizado e centralizado de oportunidades alinhadas ao seu perfil em múltiplos portais.'
            },
            {
              title: 'Match Score Semântico',
              desc: 'Análise semântica de afinidade com nota percentual de compatibilidade e diagnóstico de lacunas.'
            },
            {
              title: 'Otimização ATS (Método STAR)',
              desc: 'Reescrita estratégica de experiências com foco em aprovação por robôs de triagem de RH.'
            },
            {
              title: 'Simulador de Entrevistas com IA',
              desc: 'Treine perguntas reais do seu cargo por chat com a Recrutadora IA e receba feedback imediato.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs font-mono">
                0{idx + 1}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display mb-1">
                  {feature.title}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. QUEM SOMOS ── */}
      <section id="quem-somos" className="py-8 sm:py-9 px-6 max-w-5xl mx-auto relative z-10 w-full min-w-0 font-sans">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4 shadow-sm">
          <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto mb-2">
            <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
              Institucional
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
              Quem somos
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-normal text-center max-w-3xl mx-auto">
            O Vocentro foi criado por especialistas em tecnologia e desenvolvimento de carreira para nivelar o jogo nos processos seletivos modernos. Combinando IA de última geração com princípios sólidos de recrutamento, capacitamos trabalhadores a apresentar seu real valor às empresas de forma transparente e eficiente.
          </p>
        </div>
      </section>

      {/* ── 6. PLANOS & PREÇOS ── */}
      <section id="planos" className="py-8 sm:py-9 px-6 max-w-5xl mx-auto relative z-10 space-y-6 w-full min-w-0">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto font-sans">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Planos
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Planos para cada momento de carreira
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto font-sans">
          {/* Plano Gratuito */}
          <div className="p-5 rounded-2xl bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Gratuito</h3>
                  <p className="text-[11px] text-slate-400">Para iniciar sua busca e testar a plataforma</p>
                </div>
                <div className="text-right shrink-0 font-display">
                  <span className="text-2xl font-black text-white dark:text-white light:text-slate-900">R$ 0</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 leading-relaxed font-medium">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Cadastro de perfil profissional
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Leitura e parsing de currículo PDF
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Busca básica de vagas e Match Score
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> 1 simulação de entrevista com Recrutadora IA
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3.5 px-4 rounded-xl border border-slate-750 dark:border-slate-750 light:border-slate-300 hover:bg-slate-900 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Criar Conta Grátis
            </button>
          </div>

          {/* Plano Premium (Com Borda Brand e Selo "★ Mais escolhido") */}
          <div className="p-5 rounded-2xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border-2 border-brand-500 scale-[1.02] shadow-2xl shadow-brand-500/20 flex flex-col justify-between space-y-4 relative">
            <div className="absolute -top-3 left-5 bg-brand-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono shadow-md tracking-wider">
              ★ Mais escolhido
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Premium</h3>
                  <p className="text-[11px] text-brand-400 font-medium">Aceleração completa com IA ilimitada</p>
                </div>
                <div className="text-right shrink-0 font-display">
                  <span className="text-2xl font-black text-white dark:text-white light:text-slate-900">R$ 29</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-semibold">/mês</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 leading-relaxed font-semibold">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Simulações ilimitadas com Recrutadora IA
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Otimizador ATS ilimitado no método STAR
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Ingestão automática de vagas parceiras
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Cartas de apresentação personalizadas ilimitadas
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs transition-all shadow-lg shadow-brand-500/30 cursor-pointer"
            >
              Aderir ao Premium
            </button>
          </div>
        </div>
      </section>

      {/* ── 7. PERGUNTAS FREQUENTES (FAQ COMPACTO) ── */}
      <section id="faq" className="py-8 sm:py-9 px-6 max-w-3xl mx-auto relative z-10 space-y-6 w-full min-w-0">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto font-sans">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Dúvidas
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-2.5 w-full min-w-0">
          {faqData.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-slate-900 dark:border-slate-900 light:border-slate-200 rounded-xl bg-slate-900/10 dark:bg-slate-900/10 light:bg-white overflow-hidden transition-all duration-300 shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-3.5 px-4 flex items-center justify-between text-left text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white transition-colors cursor-pointer select-none gap-3 min-h-[36px]"
                >
                  <span className="flex items-center gap-2.5 font-sans">
                    <HelpCircle size={13} className="text-brand-accent shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-accent' : ''}`} 
                  />
                </button>

                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100 px-4 pb-4 pt-1' : 'max-h-0 opacity-0 px-4 py-0'
                  } text-[11px] text-slate-300 leading-relaxed border-t border-slate-950/30 font-sans font-normal`}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 8. CTA FINAL ÚNICO ── */}
      <section className="py-10 sm:py-12 px-6 text-center max-w-3xl mx-auto relative z-10 space-y-5 font-sans leading-relaxed w-full min-w-0">
        <div className="space-y-2.5 w-full max-w-xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display text-center">
            Sua próxima contratação começa hoje.
          </h2>
          <p className="text-slate-200 dark:text-slate-200 light:text-slate-700 text-xs sm:text-sm leading-relaxed font-medium text-center">
            Você não precisa enviar centenas de currículos genéricos. Precisa enviar o currículo certo, ajustado para a vaga certa, no momento certo. O Vocentro faz esse trabalho com você.
          </p>
        </div>

        <button 
          onClick={() => onNavigateToAuth('signup')}
          className="h-13 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-xl shadow-brand-500/25 border border-brand-400/30 inline-flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
        >
          Começar gratuitamente
          <ArrowRight size={16} />
        </button>
      </section>

      {/* ── 9. RODAPÉ INSTITUCIONAL (LINKS >= 32px TOUCH TARGETS) ── */}
      <footer className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white backdrop-blur-md py-10 px-6 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-3">
            <VocentroLogo className="h-8 text-white dark:text-white light:text-slate-900" showText={true} />
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans font-normal max-w-xs">
              O Vocentro é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Produto</h3>
            <ul className="space-y-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
              <li><a href="#sobre" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Sobre o Vocentro</a></li>
              <li><a href="#como-funciona" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Como funciona</a></li>
              <li><a href="#recursos" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Recursos da Plataforma</a></li>
              <li><a href="#planos" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Planos & Preços</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Institucional</h3>
            <ul className="space-y-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
              <li><a href="/google-auth" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Autenticação Google</a></li>
              <li><a href="/about.html" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Sobre o Vocentro</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Política de Privacidade</a></li>
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Contato & Suporte</h3>
            <ul className="space-y-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
              <li>
                <a href="mailto:contato@vocentro.com.br" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-brand-accent" />
                  contato@vocentro.com.br
                </a>
              </li>
              <li>
                <a href="mailto:suporte@vocentro.com.br" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-brand-accent" />
                  suporte@vocentro.com.br
                </a>
              </li>
            </ul>
            <p className="text-[10px] text-slate-500 mt-2">Suporte institucional ao candidato</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900 dark:border-slate-900 light:border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 gap-3 font-sans leading-relaxed font-normal">
          <span className="shrink-0">© 2026 Vocentro. Todos os direitos reservados.</span>
          <span className="text-center sm:text-right">Plataforma inteligente para desenvolvimento profissional e gestão de candidaturas de carreira.</span>
        </div>
      </footer>
    </div>
  );
}
