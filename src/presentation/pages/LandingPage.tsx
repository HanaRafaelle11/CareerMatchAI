import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  MessageSquare, 
  Trophy, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  EyeOff,
  UserCheck,
  ShieldCheck,
  Mail,
  Lock,
  Building,
  Target,
  Zap,
  CheckSquare
} from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';

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
          <a href="#o-que-e" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">O que é</a>
          <a href="#como-funciona" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">Como funciona</a>
          <a href="#autenticacao-google" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">Entrar com Google</a>
          <a href="#recursos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">Recursos</a>
          <a href="#quem-somos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">Quem somos</a>
          <a href="#planos" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">Planos</a>
          <a href="/about.html" className="text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors">Sobre</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer px-2 py-1"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Começar gratuitamente
          </button>
        </div>
      </header>

      {/* ── 1. HERO SECTION (ULTRA-COMPACT FOLD) ── */}
      <section className="relative pt-24 pb-10 px-6 md:px-12 z-10 w-full max-w-7xl mx-auto font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 flex flex-col items-start gap-4 text-left w-full min-w-0">
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
              <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs sm:text-sm leading-relaxed font-normal w-full block">
                O Vocentro utiliza Inteligência Artificial para ajudar profissionais a encontrar vagas, otimizar currículos para ATS, preparar entrevistas e acompanhar toda a jornada de candidatura em um único lugar.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck size={15} className="text-brand-accent shrink-0" />
              <span>Autenticação rápida e segura via Conta Google ou E-mail</span>
            </div>
            
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/10 cursor-pointer"
              >
                Começar gratuitamente
                <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => onNavigateToAuth('login')}
                className="px-6 py-3 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/40 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Entrar
              </button>
            </div>

            {/* Quick Metrics Bar in Hero */}
            <div className="w-full pt-4 grid grid-cols-3 gap-3 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 font-sans mt-1">
              <div>
                <span className="text-base font-bold text-white dark:text-white light:text-slate-900 block font-display">👤 2.300+</span>
                <span className="text-[10px] text-slate-400 font-medium">Perfis analisados</span>
              </div>
              <div>
                <span className="text-base font-bold text-white dark:text-white light:text-slate-900 block font-display">📄 11.000+</span>
                <span className="text-[10px] text-slate-400 font-medium">Vagas mapeadas</span>
              </div>
              <div>
                <span className="text-base font-bold text-white dark:text-white light:text-slate-900 block font-display">🎯 94%</span>
                <span className="text-[10px] text-slate-400 font-medium">Satisfação profissional</span>
              </div>
            </div>
          </div>

          {/* Right Hero - Candidate Illustration (WebP + Premium Frame) */}
          <div className="lg:col-span-6 flex justify-center relative w-full font-sans">
            <div className="relative max-w-sm w-full">
              <img 
                src="/professional_happy_illustration.webp" 
                alt="Profissional Vocentro sorrindo e trabalhando com sucesso" 
                width={512}
                height={512}
                loading="eager"
                // @ts-ignore
                fetchpriority="high"
                className="w-full h-auto object-contain rounded-2xl shadow-xl border border-slate-850 dark:border-slate-850 light:border-slate-200"
              />
              <div className="absolute top-6 -left-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-lg backdrop-blur-md flex items-center gap-2 leading-tight">
                <span className="text-lg">🏆</span>
                <div>
                  <span className="text-[8px] text-slate-400 block font-mono">Match de Carreira</span>
                  <span className="text-xs font-bold text-brand-accent">98% Compatível</span>
                </div>
              </div>
              <div className="absolute bottom-6 -right-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-lg backdrop-blur-md flex items-center gap-2 leading-tight">
                <span className="text-lg">🤝</span>
                <div>
                  <span className="text-[8px] text-slate-400 block font-mono">Feedback da Entrevista</span>
                  <span className="text-xs font-bold text-slate-200">Aprovado no Processo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. O QUE É O VOCENTRO? (INSTITUCIONAL COMPACTO) ── */}
      <section id="o-que-e" className="py-12 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-2 text-center max-w-2xl mx-auto mb-8">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Apresentação Institucional
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            O que é o Vocentro?
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans max-w-lg">
            Uma plataforma completa de Inteligência Artificial desenvolvida para apoiar profissionais em todas as fases da jornada de carreira e recolocação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto font-sans">
          <div className="p-4.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Building size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Quem somos</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Plataforma institucional focada em capacitar trabalhadores com inteligência semântica e orientação contínua.
            </p>
          </div>

          <div className="p-4.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Zap size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">O que a plataforma faz</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Centraliza busca de vagas, analisa compatibilidade (Match Score), otimiza currículos ATS e simula entrevistas.
            </p>
          </div>

          <div className="p-4.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Target size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Quais problemas resolve</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Elimina envios massivos sem resposta, desmistifica robôs de triagem de RH e prepara para entrevistas.
            </p>
          </div>

          <div className="p-4.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <CheckSquare size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Funcionalidades principais</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mapeamento de vagas, cálculo de Match Score, Otimizador STAR, Treino com Recrutadora IA e Gestão Kanban.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. COMO FUNCIONA (FLUXO EM 6 ETAPAS COMPACTAS) ── */}
      <section id="como-funciona" className="py-12 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-2 text-center max-w-2xl mx-auto mb-8">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Metodologia
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Como funciona o Vocentro
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans max-w-lg">
            Um fluxo visual integrado em seis etapas para transformar sua busca de vagas em aprovação.
          </p>
        </div>

        {/* 6-Step Visual Grid (3 cols x 2 rows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto font-sans">
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
              className="p-4.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
                    {item.icon}
                  </div>
                  <span className="text-xl font-black text-slate-700 dark:text-slate-700 light:text-slate-300 font-mono">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display mb-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. SEÇÃO: ENTRAR COM GOOGLE (OAUTH TRANSPARENCY) ── */}
      <section id="autenticacao-google" className="py-12 px-6 max-w-5xl mx-auto relative z-10">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-brand-500/20 dark:border-brand-500/20 light:border-slate-200 space-y-4 shadow-md font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-accent border border-brand-500/20">
                <Lock size={18} />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-accent font-mono block">Segurança & Autenticação</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">
                  Entrar com o Google no Vocentro
                </h2>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
              ✓ OAuth 2.0 Verificado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-1.5">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <UserCheck size={14} className="text-brand-accent" />
                Apenas para Autenticação Rápida
              </h3>
              <p className="text-[11px] text-slate-400">
                A integração com a Conta Google serve unicamente para permitir que você crie sua conta ou faça login no Vocentro em segundos, sem memorizar senhas adicionais.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <EyeOff size={14} className="text-brand-accent" />
                Privacidade & Escopo Limitado
              </h3>
              <p className="text-[11px] text-slate-400">
                O Vocentro não acessa, lê ou altera seus e-mails do Gmail, contatos ou arquivos do Google Drive. Utilizamos apenas seu nome, e-mail e foto pública de perfil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. RECURSOS DA PLATAFORMA (6 CARDS COMPACTOS) ── */}
      <section id="recursos" className="py-12 px-6 max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="flex flex-col items-center gap-2 text-center max-w-2xl mx-auto mb-8">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Funcionalidades
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Recursos da Plataforma
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans max-w-lg">
            Ferramentas de inteligência desenhadas para acelerar seu desenvolvimento de carreira.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto font-sans">
          {[
            {
              title: 'Busca inteligente de vagas',
              desc: 'Mapeamento automatizado e centralizado de oportunidades em múltiplos portais e empresas.'
            },
            {
              title: 'Match entre currículo e vaga',
              desc: 'Análise semântica de afinidade com nota percentual de compatibilidade e diagnóstico claro.'
            },
            {
              title: 'Otimização ATS (Método STAR)',
              desc: 'Reescrita estratégica de experiências com foco em robôs de triagem de RH e palavras-chave.'
            },
            {
              title: 'Coach de entrevistas em tempo real',
              desc: 'Simulador interativo por chat ou voz com recrutadora de IA para treino de respostas.'
            },
            {
              title: 'Estratégias de candidatura',
              desc: 'Planejamento de metas de recolocação, cartas de apresentação e direcionamento diário.'
            },
            {
              title: 'Dashboard Kanban de evolução',
              desc: 'Visão Kanban intuitiva de todas as fases da sua candidatura, do envio inicial à proposta.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="p-4.5 rounded-xl bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 font-display mb-1">
                  {feature.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. QUEM SOMOS, PRIVACIDADE & SEGURANÇA (CARD ÚNICO) ── */}
      <section id="quem-somos" className="py-12 px-6 max-w-5xl mx-auto relative z-10">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 text-center space-y-5 shadow-lg font-sans">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Quem somos & Compromisso Institucional
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">
            Quem somos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl mx-auto">
            O Vocentro é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Nossa Missão</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Empoderar trabalhadores de todas as áreas com inteligência semântica e automação ética.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Nossa Visão</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ser o ecossistema de referência nacional para preparação profissional e transparência em recrutamento.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Privacidade & LGPD</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Seus dados pertencem 100% a você. Criptografia ponta a ponta e zero compartilhamento com terceiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PLANOS & PREÇOS (CARDS COMPACTOS) ── */}
      <section id="planos" className="py-12 px-6 max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="flex flex-col items-center gap-2 text-center max-w-xl mx-auto">
          <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Planos
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Simplicidade e transparência
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto font-sans">
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
              
              <ul className="space-y-2 text-xs text-slate-350 dark:text-slate-350 light:text-slate-700 leading-relaxed font-medium">
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

          {/* Premium Plan */}
          <div className="p-6 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-brand-accent/30 dark:border-brand-accent/20 light:border-brand-accent/30 flex flex-col justify-between space-y-6 relative shadow-md">
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-brand-accent text-slate-950 text-[8px] font-bold uppercase tracking-wider font-mono">
              Recomendado
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Premium</h3>
                  <p className="text-[11px] text-brand-accent font-medium">Acelere sua aprovação com IA ilimitada.</p>
                </div>
                <div className="text-right shrink-0 font-display">
                  <span className="text-xl font-black text-slate-200 dark:text-white light:text-slate-900">R$ 29</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-semibold">/mês</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 leading-relaxed font-medium">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Simulações ilimitadas com Recrutadora IA
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Otimizador ATS ilimitado no método STAR
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Ingestão automática de vagas parceiras
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Cartas de apresentação personalizadas ilimitadas
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              Aderir ao Premium
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. PERGUNTAS FREQUENTES (FAQ COMPACTO) ── */}
      <section id="faq" className="py-12 px-6 max-w-3xl mx-auto relative z-10 space-y-8 w-full min-w-0">
        <div className="flex flex-col items-center gap-2 text-center max-w-2xl mx-auto font-sans">
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

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 pt-1 text-[11px] text-slate-400 leading-relaxed border-t border-slate-950/30 font-sans font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 9. CTA FINAL ÚNICO (IMPACTANTE & COMPACTO) ── */}
      <section className="py-14 px-6 text-center max-w-3xl mx-auto relative z-10 space-y-6 font-sans leading-relaxed w-full min-w-0">
        <div className="space-y-3 w-full max-w-xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display text-center">
            Sua próxima contratação começa hoje.
          </h2>
          <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs sm:text-sm leading-relaxed font-normal text-center">
            Você não precisa enviar centenas de currículos genéricos. Precisa enviar o currículo certo, ajustado para a vaga certa, no momento certo. O Vocentro faz esse trabalho com você.
          </p>
        </div>

        <button 
          onClick={() => onNavigateToAuth('signup')}
          className="px-7 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-lg shadow-brand-500/20 hover:scale-[1.01] inline-flex items-center gap-2 cursor-pointer"
        >
          Começar gratuitamente
          <ArrowRight size={14} />
        </button>
      </section>

      {/* ── 10. RODAPÉ INSTITUCIONAL COMPACTO (~40% MENOR) ── */}
      <footer className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white backdrop-blur-md py-10 px-6 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-3">
            <VocentroLogo className="h-8 text-white dark:text-white light:text-slate-900" showText={true} />
            <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans font-normal max-w-xs">
              O Vocentro é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
            </p>
          </div>

          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Produto</h3>
            <ul className="space-y-1.5 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
              <li><a href="#o-que-e" className="hover:text-slate-200 transition-colors block">O que é o Vocentro</a></li>
              <li><a href="#como-funciona" className="hover:text-slate-200 transition-colors block">Como funciona</a></li>
              <li><a href="#recursos" className="hover:text-slate-200 transition-colors block">Recursos da Plataforma</a></li>
              <li><a href="#planos" className="hover:text-slate-200 transition-colors block">Planos & Preços</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Institucional</h3>
            <ul className="space-y-1.5 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
              <li><a href="/about.html" className="hover:text-slate-200 transition-colors block">Sobre o Vocentro</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors block">Política de Privacidade</a></li>
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors block">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-3 font-mono">Contato & Suporte</h3>
            <ul className="space-y-1.5 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium font-sans leading-relaxed">
              <li>
                <a href="mailto:contato@vocentro.com.br" className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5">
                  <Mail size={11} className="text-brand-accent" />
                  contato@vocentro.com.br
                </a>
              </li>
              <li>
                <a href="mailto:suporte@vocentro.com.br" className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5">
                  <Mail size={11} className="text-brand-accent" />
                  suporte@vocentro.com.br
                </a>
              </li>
            </ul>
            <p className="text-[9px] text-slate-500 mt-1.5">Suporte institucional ao candidato</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900 dark:border-slate-900 light:border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-600 gap-3 font-sans leading-relaxed font-normal">
          <span className="shrink-0">© 2026 Vocentro. Todos os direitos reservados.</span>
          <span className="text-center sm:text-right">Plataforma inteligente para desenvolvimento profissional e gestão de candidaturas de carreira.</span>
        </div>
      </footer>
    </div>
  );
}
