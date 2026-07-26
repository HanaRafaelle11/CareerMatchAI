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
  Building,
  Target,
  Zap,
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
          <a href="#o-que-e" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">O que é</a>
          <a href="#como-funciona" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Como funciona</a>
          <a href="#autenticacao-google" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Entrar com Google</a>
          <a href="#recursos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Recursos</a>
          <a href="#quem-somos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Quem somos</a>
          <a href="#planos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Planos</a>
          <a href="/about.html" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Sobre</a>
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

      {/* ── 1. HERO SECTION (ULTRA-COMPACT FOLD) ── */}
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

            <h2 className="text-lg sm:text-xl font-bold text-brand-accent dark:text-brand-accent light:text-brand-600 font-display leading-snug w-full block">
              A plataforma inteligente para acelerar sua carreira.
            </h2>
            
            <div className="w-full max-w-lg">
              <p className="text-slate-200 dark:text-slate-200 light:text-slate-800 text-xs sm:text-sm leading-relaxed font-semibold w-full block">
                Encontre vagas compatíveis, aumente seu Match Score e prepare-se para entrevistas com IA. Tudo em uma única plataforma.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck size={15} className="text-brand-accent shrink-0" />
              <span>Autenticação rápida e segura via Conta Google ou E-mail</span>
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

            {/* Social Proof (Prova Social) */}
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

          {/* Right Hero - Product Mockup (10-15% Larger & SaaS Aesthetic) */}
          <div className="lg:col-span-7 flex justify-center relative w-full font-sans">
            <HeroProductMockup onSimulateClick={() => onNavigateToAuth('signup')} />
          </div>
        </div>
      </section>

      {/* ── 2. O QUE É O VOCENTRO? (INSTITUCIONAL COMPACTO) ── */}
      <section id="o-que-e" className="py-8 sm:py-9 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto mb-6">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Apresentação Institucional
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            O que é o Vocentro?
          </h2>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans max-w-lg">
            Uma plataforma de Inteligência Artificial para apoiar profissionais na busca de vagas, otimização de currículo e treino para entrevistas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-6xl mx-auto font-sans">
          <div className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Building size={15} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Quem somos</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Plataforma institucional focada em capacitar trabalhadores com inteligência semântica e orientação contínua.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Zap size={15} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">O que a plataforma faz</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Centraliza busca de vagas, analisa compatibilidade (Match Score), otimiza currículos ATS e simula entrevistas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Target size={15} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Quais problemas resolve</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Elimina envios massivos sem resposta, desmistifica robôs de triagem de RH e prepara para entrevistas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <CheckSquare size={15} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Funcionalidades principais</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Mapeamento de vagas, cálculo de Match Score, Otimizador STAR, Treino com Recrutadora IA e Gestão Kanban.
            </p>
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

      {/* ── 4. SEÇÃO INSTITUCIONAL: FINALIDADE DO APP & TRANSPARÊNCIA GOOGLE OAUTH ── */}
      <section id="autenticacao-google" className="py-8 sm:py-9 px-6 max-w-5xl mx-auto relative z-10">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-brand-500/30 dark:border-brand-500/30 light:border-slate-200 space-y-5 shadow-lg font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3.5">
              {/* Google Colored Logo */}
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent font-mono block">Google Auth Platform Verification</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">
                  Finalidade do Aplicativo Vocentro (vocentro) e Uso de Dados do Google
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono shrink-0">
              ✓ OAuth 2.0 Transparência Garantida
            </span>
          </div>

          {/* Institutional Statement Box */}
          <div className="p-4 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 border border-slate-800 text-xs leading-relaxed space-y-3">
            <div>
              <span className="font-bold text-white text-xs block mb-1">
                📌 Identificação e Nome do Aplicativo
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Este aplicativo é oficialmente identificado como <strong>Vocentro</strong> (nome configurado na Tela de Consentimento do Google OAuth: <strong>vocentro</strong>). Domínio oficial verificado: <a href="https://vocentro.com.br" className="text-brand-accent underline font-semibold">https://vocentro.com.br</a>.
              </p>
            </div>

            <div className="border-t border-slate-800/80 pt-2.5">
              <span className="font-bold text-white text-xs block mb-1">
                🎯 Finalidade do Aplicativo Vocentro (vocentro)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                O <strong>Vocentro (vocentro)</strong> é uma plataforma SaaS de Inteligência Artificial voltada para gestão de carreira e desenvolvimento profissional. A aplicação permite que os candidatos:
              </p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-slate-300">
                <li>Encontrem vagas de emprego compatíveis com seu perfil em portais integrados;</li>
                <li>Otimizem seus currículos para aprovação em filtros robóticos de RH (ATS) no padrão STAR;</li>
                <li>Realizem simulações interativas de entrevistas de emprego com a Recrutadora IA;</li>
                <li>Gerenciem e acompanhem o fluxo completo de suas candidaturas em um painel Kanban.</li>
              </ul>
            </div>

            <div className="border-t border-slate-800/80 pt-2.5">
              <span className="font-bold text-white text-xs block mb-1">
                🔒 Transparência e Escopo do Google OAuth 2.0
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                O aplicativo <strong>Vocentro (vocentro)</strong> solicita autenticação via Conta do Google exclusivamente para permitir que o usuário crie sua conta e faça login na plataforma de forma rápida, segura e sem a necessidade de gerenciar senhas adicionais.
              </p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-slate-300">
                <li><strong>Dados Coletados:</strong> Apens o endereço de e-mail, nome público de perfil e foto do usuário.</li>
                <li><strong>Garantia de Privacidade:</strong> O Vocentro (vocentro) <strong>NÃO</strong> solicita, não lê, não edita, não armazena e não compartilha e-mails do Gmail, arquivos do Google Drive ou contatos.</li>
                <li><strong>Conformidade:</strong> O uso dos dados recebidos das APIs do Google obedece integralmente à <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline font-semibold">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado.</li>
              </ul>
            </div>

            <div className="border-t border-slate-800/80 pt-2.5 flex flex-wrap gap-4 text-[11px]">
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline font-bold inline-flex items-center gap-1">
                📄 Ler Política de Privacidade do Vocentro
              </a>
              <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline font-bold inline-flex items-center gap-1">
                ⚖️ Ler Termos de Uso do Vocentro
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. RECURSOS DA PLATAFORMA (4 CARDS ESSENCIAIS SAAS) ── */}
      <section id="recursos" className="py-8 sm:py-9 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-2xl mx-auto mb-6">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Recursos Essenciais
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Recursos da Plataforma
          </h2>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans max-w-lg">
            As quatro ferramentas de IA focadas na sua aceleração profissional.
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

      {/* ── 6. QUEM SOMOS, PRIVACIDADE & SEGURANÇA (CONTRASTE MELHORADO) ── */}
      <section id="quem-somos" className="py-8 sm:py-9 px-6 max-w-5xl mx-auto relative z-10">
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 text-center space-y-4 shadow-lg font-sans">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Quem somos & Compromisso Institucional
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">
            Quem somos
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 dark:text-slate-200 light:text-slate-800 leading-relaxed max-w-3xl mx-auto font-medium">
            O Vocentro é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Nossa Missão</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Empoderar trabalhadores de todas as áreas com inteligência semântica e automação ética.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Nossa Visão</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ser o ecossistema de referência nacional para preparação profissional e transparência em recrutamento.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Privacidade & LGPD</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Seus dados pertencem 100% a você. Criptografia ponta a ponta e zero compartilhamento com terceiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PLANOS & PREÇOS (DESTAQUE PREMIUM) ── */}
      <section id="planos" className="py-8 sm:py-9 px-6 max-w-7xl mx-auto relative z-10 space-y-6">
        <div className="flex flex-col items-center gap-1.5 text-center max-w-xl mx-auto">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Planos
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Simplicidade e transparência
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto font-sans">
          {/* Free Plan */}
          <div className="p-6 rounded-2xl bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Básico</h3>
                  <p className="text-[11px] text-slate-400">O básico essencial para iniciar sua recolocação.</p>
                </div>
                <span className="text-xl font-black text-slate-200 dark:text-white light:text-slate-900 font-display shrink-0">Grátis</span>
              </div>
              
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-medium">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent" /> Pipeline Kanban de candidaturas
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent" /> Cadastro estruturado de currículo
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent" /> Match Score de afinidade
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent" /> Treinos com a Recrutadora IA
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3 px-4 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/50 hover:bg-slate-900 text-slate-200 font-semibold text-xs transition-all cursor-pointer shadow-xs"
            >
              Começar agora
            </button>
          </div>

          {/* Premium Plan (Destacado com Borda Azul + Selo "Mais Escolhido") */}
          <div className="p-6 rounded-2xl bg-slate-900/80 dark:bg-slate-900/90 light:bg-white border-2 border-brand-500 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-brand-500/20 scale-[1.02]">
            <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider font-mono shadow-md">
              ★ Mais escolhido
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Premium</h3>
                  <p className="text-[11px] text-brand-400 font-bold">Acelere sua aprovação com IA ilimitada.</p>
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

      {/* ── 8. PERGUNTAS FREQUENTES (FAQ COMPACTO) ── */}
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
                  className="w-full py-3.5 px-4 flex items-center justify-between text-left text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white transition-colors cursor-pointer select-none gap-3"
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

      {/* ── 9. CTA FINAL ÚNICO (IMPACTANTE & COMPACTO) ── */}
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

      {/* ── 10. RODAPÉ INSTITUCIONAL COMPACTO (TOUCH TARGETS OPTIMIZED >= 32px) ── */}
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
              <li><a href="#o-que-e" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">O que é o Vocentro</a></li>
              <li><a href="#como-funciona" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Como funciona</a></li>
              <li><a href="#recursos" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Recursos da Plataforma</a></li>
              <li><a href="#planos" className="hover:text-slate-200 transition-colors py-1.5 px-1 min-h-[32px] inline-flex items-center">Planos & Preços</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Institucional</h3>
            <ul className="space-y-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
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
