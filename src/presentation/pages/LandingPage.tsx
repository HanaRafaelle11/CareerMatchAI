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
      
      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-brand-500/5 dark:bg-brand-500/5 light:bg-brand-500/3 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 light:bg-indigo-500/3 blur-[120px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/95 backdrop-blur-md border-b border-slate-900 dark:border-slate-900 light:border-slate-200 flex items-center justify-between px-6 z-50 transition-colors duration-300 shadow-sm light:shadow-slate-100">
        <VocentroLogo className="h-8 text-white dark:text-white light:text-slate-900" showText={true} />
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#o-que-e" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">O que é</a>
          <a href="#como-funciona" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Como funciona</a>
          <a href="#autenticacao-google" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Entrar com Google</a>
          <a href="#recursos" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Recursos</a>
          <a href="#quem-somos" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Quem somos</a>
          <a href="#planos" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Planos</a>
          <a href="/about.html" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Sobre</a>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-semibold text-slate-300 hover:text-slate-100 dark:text-slate-300 dark:hover:text-slate-100 light:text-slate-600 light:hover:text-slate-900 transition-colors cursor-pointer"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-[14px] transition-all shadow-md cursor-pointer"
          >
            Começar gratuitamente
          </button>
        </div>
      </header>

      {/* ── 1. HERO SECTION (PRIMEIRA DOBRA) ── */}
      <section className="relative min-h-[85vh] pt-28 pb-12 flex items-center px-6 md:px-12 z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6 text-left w-full min-w-0">
            <div className="w-full inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 light:text-brand-600 text-[11px] font-bold tracking-wider uppercase font-mono">
                <Sparkles size={11} className="animate-pulse" />
                Vocentro | Inteligência Artificial para Carreiras
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display w-full block">
              Vocentro
            </h1>

            <h2 className="text-xl sm:text-2xl font-bold text-brand-accent dark:text-brand-accent light:text-brand-600 font-display leading-snug w-full block">
              A plataforma inteligente para acelerar sua carreira.
            </h2>
            
            <div className="w-full max-w-xl">
              <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 text-sm sm:text-base leading-relaxed font-sans font-normal w-full block">
                O Vocentro utiliza Inteligência Artificial para ajudar profissionais a encontrar vagas, otimizar currículos para ATS, preparar entrevistas e acompanhar toda a jornada de candidatura em um único lugar.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck size={16} className="text-brand-accent shrink-0" />
              <span>Autenticação rápida e segura via Conta Google ou E-mail</span>
            </div>
            
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="px-7 py-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 hover:scale-[1.01] cursor-pointer"
              >
                Começar gratuitamente
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => onNavigateToAuth('login')}
                className="px-7 py-4 rounded-[14px] border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/30 dark:bg-slate-900/30 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer shadow-sm"
              >
                Entrar
              </button>
            </div>

            {/* Quick Metrics Bar in Hero */}
            <div className="w-full pt-6 grid grid-cols-3 gap-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 font-sans">
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">👤 2.300+</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-medium">Perfis analisados</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">📄 11.000+</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-medium">Vagas mapeadas</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">🎯 94%</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-medium">Satisfação profissional</span>
              </div>
            </div>
          </div>

          {/* Right Hero - Candidate Illustration (WebP + LCP optimized) */}
          <div className="lg:col-span-6 flex justify-center relative w-full font-sans">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 to-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative max-w-md w-full">
              <img 
                src="/professional_happy_illustration.webp" 
                alt="Profissional Vocentro sorrindo e trabalhando com sucesso" 
                width={600}
                height={600}
                loading="eager"
                // @ts-ignore
                fetchpriority="high"
                className="w-full h-auto object-contain rounded-[24px] shadow-2xl border border-slate-900/60"
              />
              <div className="absolute top-8 -left-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-2 leading-relaxed">
                <span className="text-xl">🏆</span>
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono">Match de Carreira</span>
                  <span className="text-xs font-bold text-brand-accent">98% Compatível</span>
                </div>
              </div>
              <div className="absolute bottom-8 -right-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-2 leading-relaxed">
                <span className="text-xl">🤝</span>
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono">Feedback da Entrevista</span>
                  <span className="text-xs font-bold text-slate-200">Aprovado no Processo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SEÇÃO INSTITUCIONAL: O QUE É O VOCENTRO? ── */}
      <section id="o-que-e" className="py-16 px-6 max-w-7xl mx-auto relative z-10 space-y-10 w-full min-w-0">
        <div className="text-center flex flex-col items-center gap-3 w-full min-w-0 max-w-3xl mx-auto">
          <span className="px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Apresentação Institucional
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display text-center">
            O que é o Vocentro?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans text-center">
            O Vocentro é uma plataforma completa de Inteligência Artificial desenvolvida para apoiar profissionais em todas as fases da jornada de carreira e recolocação. Nossa solução une tecnologia semântica, automação ética e metodologia de recrutamento para que o candidato assuma o controle do seu futuro profissional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto font-sans">
          <div className="p-6 rounded-[20px] bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Building size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Quem somos</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Uma plataforma institucional voltada a capacitar trabalhadores de todas as áreas com ferramentas de inteligência semântica e orientação contínua.
            </p>
          </div>

          <div className="p-6 rounded-[20px] bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">O que a plataforma faz</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Centraliza a busca de vagas, analisa a compatibilidade do perfil (Match Score), otimiza currículos para robôs ATS e simula entrevistas comportamentais.
            </p>
          </div>

          <div className="p-6 rounded-[20px] bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <Target size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Quais problemas resolve</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Elimina o envio massivo de currículos sem resposta, desmistifica os filtros automáticos de RH e prepara o candidato com segurança para entrevistas.
            </p>
          </div>

          <div className="p-6 rounded-[20px] bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-accent flex items-center justify-center">
              <CheckSquare size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Funcionalidades principais</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Mapeamento de vagas, cálculo de Match Score, Otimização de Currículos no método STAR, Treino com Recrutadora IA e Gestão Kanban.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. COMO FUNCIONA (FLUXO NO TOPO) ── */}
      <section id="como-funciona" className="py-16 px-6 max-w-7xl mx-auto relative z-10 space-y-10 w-full min-w-0">
        <div className="text-center flex flex-col items-center gap-3 w-full min-w-0 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Metodologia</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display text-center">
            Como funciona o Vocentro
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans font-medium text-center">
            Um fluxo visual integrado em seis etapas para transformar sua busca de vagas em aprovação profissional.
          </p>
        </div>

        {/* 6-Step Visual Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              step: '01',
              title: 'Cadastrar',
              desc: 'Crie sua conta no Vocentro de forma rápida e segura utilizando sua Conta Google ou e-mail.',
              icon: <UserCheck className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '02',
              title: 'Enviar currículo',
              desc: 'Suba seu arquivo original em PDF para que o Vocentro leia e estruture seu perfil de competências.',
              icon: <FileText className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '03',
              title: 'Encontrar vagas',
              desc: 'Mapeie oportunidades de trabalho alinhadas ao seu objetivo em múltiplos portais e empresas.',
              icon: <Search className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '04',
              title: 'Receber análises',
              desc: 'Visualize seu Match Score percentual de afinidade, pontos fortes e lacunas técnicas para a vaga.',
              icon: <Trophy className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '05',
              title: 'Preparar entrevistas',
              desc: 'Simule entrevistas reais no método STAR com a Recrutadora IA e receba feedback em tempo real.',
              icon: <MessageSquare className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '06',
              title: 'Acompanhar candidaturas',
              desc: 'Gerencie todo o seu pipeline de processos seletivos em um painel Kanban intuitivo.',
              icon: <CheckSquare className="w-5 h-5 text-brand-accent" />
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-[20px] bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-700 light:text-slate-300 font-mono">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. SEÇÃO: ENTRAR COM GOOGLE (OAUTH TRANSPARENCY) ── */}
      <section id="autenticacao-google" className="py-16 px-6 max-w-5xl mx-auto relative z-10">
        <div className="p-8 sm:p-12 rounded-[24px] bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-brand-500/20 dark:border-brand-500/20 light:border-slate-200 space-y-6 shadow-xl backdrop-blur-md font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-500/10 text-brand-accent border border-brand-500/20">
                <Lock size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent font-mono block">Segurança & Autenticação</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">
                  Entrar com o Google no Vocentro
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
              ✓ OAuth 2.0 Verificado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck size={16} className="text-brand-accent" />
                Apenas para Autenticação Rápida
              </h3>
              <p className="text-slate-400">
                A integração com a **Conta Google (Entrar com o Google)** tem a finalidade exclusiva de permitir que você crie sua conta ou faça login no Vocentro em segundos, sem a necessidade de memorizar senhas adicionais.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <EyeOff size={16} className="text-brand-accent" />
                Privacidade & Escopo Limitado
              </h3>
              <p className="text-slate-400">
                O Vocentro **não acessa, não lê, não altera e não possui permissão** para visualizar seus e-mails do Gmail, contatos, arquivos do Google Drive ou dados privados. Utilizamos apenas seu nome, e-mail e foto pública de perfil fornecidos no fluxo oficial do Google.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. RECURSOS DA PLATAFORMA (CONDENSADO - 6 CARDS) ── */}
      <section id="recursos" className="py-16 px-6 max-w-7xl mx-auto relative z-10 space-y-10 w-full min-w-0">
        <div className="text-center flex flex-col items-center gap-3 w-full min-w-0 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Funcionalidades</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display text-center">
            Recursos da Plataforma
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans font-medium text-center">
            As principais ferramentas de inteligência desenhadas para acelerar seu desenvolvimento de carreira.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto font-sans">
          {[
            {
              title: 'Busca inteligente de vagas',
              desc: 'Mapeamento automatizado e centralizado de oportunidades em múltiplos portais e empresas de contratação.'
            },
            {
              title: 'Match entre currículo e vaga',
              desc: 'Análise semântica de afinidade com nota percentual de compatibilidade e diagnóstico claro de lacunas.'
            },
            {
              title: 'Otimização ATS (Método STAR)',
              desc: 'Reescrita estratégica de experiências profissionais com foco em robôs de triagem de RH e palavras-chave.'
            },
            {
              title: 'Coach de entrevistas em tempo real',
              desc: 'Simulador interativo por chat ou voz com recrutadora de IA para treino de respostas e postura.'
            },
            {
              title: 'Estratégias de candidatura',
              desc: 'Planejamento de metas de recolocação, cartas de apresentação personalizadas e direcionamento diário.'
            },
            {
              title: 'Dashboard Kanban de evolução',
              desc: 'Visão Kanban intuitiva de todas as fases da sua candidatura, do envio inicial até a proposta final.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex items-start gap-3.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. SEÇÃO INSTITUCIONAL: QUEM SOMOS, PRIVACIDADE & SEGURANÇA ── */}
      <section id="quem-somos" className="py-16 px-6 max-w-5xl mx-auto relative z-10">
        <div className="p-8 sm:p-12 rounded-[24px] bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 text-center space-y-6 shadow-xl backdrop-blur-md font-sans">
          <span className="px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Quem somos & Compromisso Institucional
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 font-display">
            Quem somos
          </h2>
          <p className="text-sm sm:text-base text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed max-w-3xl mx-auto">
            O Vocentro é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-4 border-t border-slate-800/80">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">Nossa Missão</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empoderar trabalhadores de todas as áreas com inteligência de dados e automação ética para alcançar sua recolocação ideal.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">Nossa Visão</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ser o ecossistema de referência em transparência, eficiência e preparação de carreira no mercado de trabalho.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">Privacidade & LGPD</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seus dados pertencem 100% a você. Criptografia ponta a ponta, total conformidade com a LGPD e zero venda de informações a terceiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PLANOS & PREÇOS ── */}
      <section id="planos" className="py-16 px-6 max-w-7xl mx-auto relative z-10 space-y-10">
        <div className="text-center space-y-3 w-full max-w-xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Planos</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display text-center">Simplicidade e transparência</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto font-sans">
          {/* Free Plan */}
          <div className="p-8 rounded-[20px] bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Básico</h3>
                  <p className="text-xs text-slate-400">O básico essencial para iniciar sua recolocação.</p>
                </div>
                <span className="text-2xl font-black text-slate-200 dark:text-white light:text-slate-900 font-display shrink-0">Grátis</span>
              </div>
              
              <ul className="space-y-3 text-xs text-slate-350 dark:text-slate-350 light:text-slate-700 leading-relaxed font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Pipeline Kanban de candidaturas
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Cadastro estruturado de currículo
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Match Score de afinidade
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Treinos com a Recrutadora IA
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3.5 px-4 rounded-[14px] border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-100 hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 font-semibold text-xs transition-all cursor-pointer shadow-sm"
            >
              Começar agora
            </button>
          </div>

          {/* Premium Plan */}
          <div className="p-8 rounded-[20px] bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-brand-accent/30 dark:border-brand-accent/20 light:border-brand-accent/30 flex flex-col justify-between space-y-8 relative shadow-lg shadow-brand-500/5">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-brand-accent text-slate-950 text-[9px] font-bold uppercase tracking-wider font-mono">
              Recomendado
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Premium</h3>
                  <p className="text-xs text-brand-accent dark:text-brand-accent light:text-green-700 font-medium">Acelere sua aprovação com IA ilimitada.</p>
                </div>
                <div className="text-right shrink-0 font-display">
                  <span className="text-2xl font-black text-slate-200 dark:text-white light:text-slate-900">R$ 29</span>
                  <span className="text-[10px] text-slate-400 block font-sans font-semibold">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 leading-relaxed font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Simulações ilimitadas com Recrutadora IA
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Otimizador ATS ilimitado no método STAR
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Ingestão automática de vagas parceiras
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Cartas de apresentação personalizadas ilimitadas
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3.5 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-md cursor-pointer font-medium"
            >
              Aderir ao Premium
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. PERGUNTAS FREQUENTES (FAQ) ── */}
      <section id="faq" className="py-16 px-6 max-w-3xl mx-auto relative z-10 space-y-10 w-full min-w-0">
        <div className="text-center space-y-3 w-full max-w-2xl mx-auto font-sans">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Dúvidas</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display text-center">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-3 w-full min-w-0">
          {faqData.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-slate-900 dark:border-slate-900 light:border-slate-200 rounded-[14px] bg-slate-900/10 dark:bg-slate-900/10 light:bg-white overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4.5 px-5 flex items-center justify-between text-left text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer select-none gap-3"
                >
                  <span className="flex items-center gap-3 font-sans">
                    <HelpCircle size={14} className="text-brand-accent shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-accent' : ''}`} 
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed border-t border-slate-950/30 dark:border-slate-950/30 light:border-slate-100 font-sans font-normal">
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

      {/* ── 9. CTA FINAL ÚNICO ── */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto relative z-10 space-y-8 font-sans leading-relaxed w-full min-w-0">
        <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="space-y-4 w-full max-w-2xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display text-center">
            Sua próxima contratação começa hoje.
          </h2>
          <div className="w-full max-w-xl mx-auto">
            <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 text-sm sm:text-base leading-relaxed font-semibold text-center">
              Você não precisa enviar centenas de currículos genéricos. Precisa enviar o currículo certo, ajustado para a vaga certa, no momento certo. O Vocentro faz esse trabalho com você.
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigateToAuth('signup')}
          className="px-8 py-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all shadow-xl shadow-brand-500/25 hover:scale-[1.01] inline-flex items-center gap-2.5 cursor-pointer"
        >
          Começar gratuitamente
          <ArrowRight size={16} />
        </button>
      </section>

      {/* ── 10. RODAPÉ INSTITUCIONAL COMPLETO ── */}
      <footer className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white backdrop-blur-md py-16 px-8 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <VocentroLogo className="h-10 text-white dark:text-white light:text-slate-900" showText={true} />
            <div className="w-full max-w-sm">
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans font-normal">
                O Vocentro é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4 font-mono">Produto</h3>
            <ul className="space-y-2 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold font-sans leading-relaxed">
              <li><a href="#o-que-e" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">O que é o Vocentro</a></li>
              <li><a href="#como-funciona" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">Como funciona</a></li>
              <li><a href="#recursos" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">Recursos da Plataforma</a></li>
              <li><a href="#planos" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">Planos & Preços</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4 font-mono">Institucional</h3>
            <ul className="space-y-2 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold font-sans leading-relaxed">
              <li><a href="/about.html" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">Sobre o Vocentro</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">Política de Privacidade</a></li>
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors block">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4 font-mono">Contato & Suporte</h3>
            <ul className="space-y-2 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold font-sans leading-relaxed">
              <li>
                <a href="mailto:contato@vocentro.com.br" className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5">
                  <Mail size={12} className="text-brand-accent" />
                  contato@vocentro.com.br
                </a>
              </li>
              <li>
                <a href="mailto:suporte@vocentro.com.br" className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5">
                  <Mail size={12} className="text-brand-accent" />
                  suporte@vocentro.com.br
                </a>
              </li>
            </ul>
            <p className="text-[10px] text-slate-500 mt-2">Atendimento e suporte institucional</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900 dark:border-slate-900 light:border-slate-100 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-600 gap-4 font-sans leading-relaxed font-normal">
          <span className="shrink-0">© 2026 Vocentro. Todos os direitos reservados.</span>
          <span className="text-center sm:text-right">Plataforma inteligente para desenvolvimento profissional e gestão de candidaturas de carreira.</span>
        </div>
      </footer>
    </div>
  );
}
