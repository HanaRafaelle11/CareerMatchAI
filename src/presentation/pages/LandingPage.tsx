import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  MessageSquare, 
  Activity, 
  Trophy, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Check,
  EyeOff,
  UserCheck,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'signup') => void;
}

export function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Interactive Product Tour State
  const [tourStep, setTourStep] = useState(0);
  const [isTourPaused, setIsTourPaused] = useState(false);
  const autoplayTimer = useRef<any>(null);

  // Autoplay for the interactive tour
  useEffect(() => {
    if (!isTourPaused) {
      autoplayTimer.current = setInterval(() => {
        setTourStep((prev) => (prev + 1) % 5);
      }, 4500);
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [isTourPaused]);

  const selectTourStep = (index: number) => {
    setTourStep(index);
    setIsTourPaused(true); // Pause autoplay once the user interacts
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const getStepVisual = (step: string) => {
    switch (step) {
      case '01':
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-[9px] font-mono leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">📄</span>
              <span className="text-slate-300 truncate max-w-[100px]">curriculo_2026.pdf</span>
            </div>
            <span className="text-brand-accent font-bold">Lido ✓</span>
          </div>
        );
      case '02':
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5 text-[8px] font-mono leading-relaxed">
            <div className="flex items-center justify-between text-slate-500">
              <span>Link da Vaga</span>
              <span>Greenhouse API</span>
            </div>
            <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-350 truncate">
              https://jobs.stripe.com/pm
            </div>
          </div>
        );
      case '03':
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2 text-[9px] font-mono leading-relaxed">
            <div className="flex justify-between items-center text-slate-300">
              <span>Match Semântico</span>
              <span className="text-brand-accent font-black">92%</span>
            </div>
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent" style={{ width: '92%' }} />
            </div>
          </div>
        );
      case '04':
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1 text-[8px] font-mono leading-relaxed">
            <div className="text-red-400/80 line-through">"Fiz interfaces web"</div>
            <div className="text-brand-accent font-semibold">"Liderei a engenharia de UI..."</div>
          </div>
        );
      case '05':
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5 text-[8px] leading-relaxed">
            <div className="font-bold text-slate-300">Prezado Gestor,</div>
            <p className="text-slate-500 leading-tight truncate">Gostaria de manifestar meu interesse na vaga...</p>
          </div>
        );
      case '06':
        return (
          <div className="mt-4 p-2 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5 text-[8px] leading-relaxed">
            <div className="text-slate-400 bg-slate-900 p-1.5 rounded-lg max-w-[90%] truncate">
              "Fale sobre um conflito técnico..."
            </div>
            <div className="text-brand-accent bg-brand-accent/5 border border-brand-accent/10 p-1.5 rounded-lg max-w-[90%] ml-auto text-right truncate">
              "No projeto X, alinhamos as APIs..."
            </div>
          </div>
        );
      case '07':
        return (
          <div className="mt-4 grid grid-cols-3 gap-1 text-[7px] font-mono text-center leading-relaxed">
            <div className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-400">Match (3)</div>
            <div className="p-1 rounded bg-brand-accent/5 border border-brand-accent/20 text-brand-accent font-semibold">Entrevista (1)</div>
            <div className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-400">Oferta (0)</div>
          </div>
        );
      case '08':
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-[9px] leading-relaxed">
            <span className="text-slate-400 font-mono">Sua Evolução</span>
            <span className="text-brand-accent font-bold animate-pulse">Lvl 4 (+350 XP)</span>
          </div>
        );
      default:
        return null;
    }
  };

  const faqData = [
    {
      q: 'Meus dados ficam seguros?',
      a: 'Sim, totalmente. Seus dados profissionais, currículos e histórico de simulações são criptografados de ponta a ponta e armazenados de acordo com as diretrizes da LGPD/GDPR. Você tem total controle sobre suas informações e pode removê-las permanentemente da nossa base a qualquer momento com apenas um clique nas configurações.'
    },
    {
      q: 'A IA realmente melhora meu currículo?',
      a: 'Sim. Nosso motor semântico analisa detalhadamente a descrição e os requisitos da vaga desejada, identificando termos técnicos relevantes (keywords) e sugerindo adaptações no formato STAR (Situação, Tarefa, Ação, Resultado). Isso aumenta expressivamente sua nota nos sistemas automáticos de triagem de candidatos (ATS) sem falsificar nenhuma informação.'
    },
    {
      q: 'Posso cancelar quando quiser?',
      a: 'Sem burocracia. O plano Premium é cobrado mensalmente e pode ser cancelado a qualquer momento com um único clique em seu painel de faturamento. Não há contratos de fidelidade ou taxas ocultas de cancelamento.'
    },
    {
      q: 'O sistema funciona para qualquer área profissional?',
      a: 'Sim. Embora seja amplamente otimizada para carreiras de tecnologia, marketing, design, finanças e administração, a IA utiliza modelos linguísticos de ampla cobertura semântica que conseguem interpretar, cruzar dados e sugerir melhorias de alta precisão para qualquer setor do mercado de trabalho.'
    },
    {
      q: 'Como funciona o Match de Vagas?',
      a: 'Utilizamos inteligência de correspondência avançada baseada em IA generativa (Google Gemini) para realizar uma análise de afinidade semântica tridimensional: (1) Requisitos Técnicos Hard Skills, (2) Competências Interpessoais Soft Skills e (3) Nível de Senioridade e Impacto. Com isso, indicamos uma nota percentual precisa e uma lista exata de gaps de competências necessários para a aprovação.'
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
          <a href="#como-funciona" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">A Jornada</a>
          <a href="#demonstracao" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Demonstração</a>
          <a href="#comparativo" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Antes vs Depois</a>
          <a href="#recursos" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Como Funciona</a>
          <a href="#planos" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Planos</a>
          <a href="#faq" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">FAQ</a>
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
            Começar Grátis
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] pt-28 pb-12 flex items-center px-6 md:px-12 z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 light:text-brand-600 text-[10px] font-bold tracking-wider uppercase font-mono"
            >
              <Sparkles size={10} className="animate-pulse" />
              Sua carreira, você no centro.
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6.5xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display"
            >
              Pare de enviar<br />
              currículos no escuro.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-slate-300 dark:text-slate-300 light:text-slate-655 text-sm sm:text-base leading-relaxed max-w-xl font-sans font-medium"
            >
              Descubra quais vagas realmente combinam com seu perfil, adapte seu currículo com IA e treine entrevistas antes de se candidatar. Isso aumenta muito a percepção de seu valor.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="px-6 py-3.5 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 hover:scale-[1.01] cursor-pointer animate-fade-in"
              >
                Começar gratuitamente
                <ArrowRight size={16} />
              </button>
              <a 
                href="#demonstracao"
                className="px-6 py-3.5 rounded-[14px] border border-slate-880 dark:border-slate-800 light:border-slate-200 bg-slate-900/30 dark:bg-slate-900/30 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer shadow-sm"
              >
                Ver demonstração
              </a>
            </motion.div>

            {/* Quick Metrics Bar in Hero */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 font-sans"
            >
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">👤 2.300+</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600 leading-relaxed font-medium">Perfis analisados</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">📄 11.000+</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600 leading-relaxed font-medium">Vagas mapeadas</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">🎯 94%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600 leading-relaxed font-medium">Satisfação profissional</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero - CONFIDENT CANDIDATE ILLUSTRATION */}
          <div className="lg:col-span-6 flex justify-center relative w-full font-sans">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 to-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative max-w-md w-full"
            >
              <img 
                src="/professional_happy_illustration.png" 
                alt="Profissional Vocentro sorrindo e trabalhando com sucesso" 
                className="w-full h-auto object-contain rounded-[24px] shadow-2xl border border-slate-900/60"
              />
              {/* Floating badges for visual sophistication */}
              <div className="absolute top-10 -left-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce-slow leading-relaxed">
                <span className="text-xl">🏆</span>
                <div>
                  <span className="text-[9px] text-slate-450 block font-mono">Match de Carreira</span>
                  <span className="text-xs font-bold text-brand-accent">98% Compatível</span>
                </div>
              </div>
              <div className="absolute bottom-12 -right-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce-slow leading-relaxed" style={{ animationDelay: '1.5s' }}>
                <span className="text-xl">🤝</span>
                <div>
                  <span className="text-[9px] text-slate-455 block font-mono">Feedback da Entrevista</span>
                  <span className="text-xs font-bold text-slate-200">Aprovado no Processo</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Tour Showcase Section */}
      <section id="demonstracao" className="py-20 px-6 max-w-5xl mx-auto relative z-10 space-y-10">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Veja em Ação</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            A plataforma desenhada para você
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans">
            Entenda como a nossa tecnologia opera sob sua direção em cada etapa da recolocação e aprimoramento profissional.
          </p>
        </div>

        <div className="w-full max-w-3xl mx-auto bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 rounded-[22px] p-6 shadow-2xl backdrop-blur-sm space-y-5">
          {/* Fake Window Controls */}
          <div className="flex items-center justify-between border-b border-slate-850/50 dark:border-slate-850/50 light:border-slate-200 pb-3 font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono ml-4 select-none">vocentro.com/demonstracao</span>
            </div>
            <div className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent dark:text-brand-accent light:text-green-700 text-[9px] font-bold uppercase tracking-wider animate-pulse font-mono">
              Tour de Produto
            </div>
          </div>

          {/* Navigation Tabs for Tour Steps */}
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 rounded-xl border border-slate-900 dark:border-slate-900 light:border-slate-200 font-sans">
            {[
              { name: '1. Currículo', icon: FileText },
              { name: '2. Vaga', icon: Search },
              { name: '3. Match', icon: Trophy },
              { name: '4. Otimizar', icon: Sparkles },
              { name: '5. Entrevista', icon: MessageSquare }
            ].map((step, idx) => {
              const Icon = step.icon;
              const isActive = tourStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectTourStep(idx)}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200 text-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-slate-900 light:bg-white text-brand-accent shadow-md border border-slate-800 dark:border-slate-800 light:border-slate-200' 
                      : 'text-slate-500 dark:text-slate-500 light:text-slate-600 hover:text-slate-350 light:hover:text-slate-800'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'animate-bounce text-brand-accent' : ''} />
                  <span className="text-[8px] font-bold tracking-tight whitespace-nowrap">{step.name.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Visual Simulated Mockups */}
          <div className="relative min-h-[260px] bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50/50 rounded-2xl p-5 border border-slate-900 dark:border-slate-900 light:border-slate-200 overflow-hidden flex flex-col justify-center font-sans leading-relaxed">
            <AnimatePresence mode="wait">
              {tourStep === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 dark:border-slate-900 light:border-slate-200 pb-2">
                    <span className="font-bold text-slate-100 dark:text-white light:text-slate-900">Perfil & Currículo</span>
                    <span className="text-[10px] text-slate-500 font-mono">Formatos: PDF, DOCX</span>
                  </div>

                  <div className="border border-dashed border-slate-800 dark:border-slate-850 light:border-slate-200 rounded-xl p-6 text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center mx-auto">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">Arraste e solte seu currículo</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Apenas arquivos originais. Limite de 8MB.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {tourStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 dark:text-white light:text-slate-900">Ingestão Automática de Vagas</span>
                    <span className="text-[10px] text-slate-500 font-mono">Métodos de Captura</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200">
                      <Search size={14} className="text-slate-500" />
                      <span className="text-[10px] text-slate-400 truncate flex-1 leading-relaxed font-medium">
                        https://jobs.lever.co/stripe/senior-frontend-engineer
                      </span>
                      <span className="text-[8px] bg-brand-accent/15 text-brand-accent px-1.5 py-0.5 rounded font-bold uppercase font-mono">
                        Greenhouse
                      </span>
                    </div>

                    <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 p-3 rounded-[14px] space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-900">Vaga: Senior Frontend Developer</span>
                        <span className="text-[8px] bg-brand-500/10 text-brand-500 light:text-brand-655 px-1.5 py-0.5 rounded font-semibold font-mono">Stripe Inc.</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[8px] pt-1">
                        <span className="px-1.5 py-0.5 bg-slate-950/20 text-slate-350 dark:text-slate-350 light:text-slate-700 border border-slate-850 rounded font-medium">React</span>
                        <span className="px-1.5 py-0.5 bg-slate-950/20 text-slate-350 dark:text-slate-350 light:text-slate-700 border border-slate-850 rounded font-medium">TypeScript</span>
                        <span className="px-1.5 py-0.5 bg-slate-950/20 text-slate-350 dark:text-slate-350 light:text-slate-700 border border-slate-850 rounded font-medium">Zustand</span>
                        <span className="px-1.5 py-0.5 bg-slate-950/20 text-slate-350 dark:text-slate-350 light:text-slate-700 border border-slate-850 rounded font-medium">CI/CD</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {tourStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-100 dark:text-white light:text-slate-900">Score de Match Vocentro</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600 font-mono">Análise de Relevância</span>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-2">
                    <div className="col-span-4 flex justify-center relative">
                      <div className="w-20 h-20 rounded-full border-4 border-slate-900 light:border-slate-200 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-4 border-t-brand-accent border-r-brand-accent border-b-transparent border-l-transparent animate-spin-slow" />
                        <div className="absolute w-2 h-2 rounded-full bg-brand-accent animate-ping" />
                        <span className="text-lg font-black text-white dark:text-white light:text-slate-900 z-10 font-display">92%</span>
                      </div>
                    </div>

                    <div className="col-span-8 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Match de Competências</span>
                        <span className="text-brand-accent font-bold">Excelente</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Requisitos Técnicos</span>
                        <span className="text-amber-400 font-bold">Falta "Zustand" no CV</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Nível da Oportunidade</span>
                        <span className="text-brand-500 light:text-brand-600 font-bold">Alta afinidade</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 border border-slate-850 dark:border-slate-850 light:border-slate-200 rounded-xl text-[9px] text-slate-350 light:text-slate-700 leading-relaxed font-sans font-medium">
                    💡 <strong>Você no centro:</strong> Incluir referências à gestão de estados com Zustand elevará a sua compatibilidade para a faixa de destaque absoluto (98% Match).
                  </div>
                </motion.div>
              )}

              {tourStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3.5 text-xs"
                >
                  <h4 className="font-bold text-slate-100 dark:text-white light:text-slate-900">Currículo Estratégico para ATS</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans font-medium">A IA trabalha sob seu comando para reescrever conquistas com foco em impacto.</p>

                  <div className="space-y-2.5 text-[10px]">
                    <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-red-50/30 border border-red-500/20 p-2.5 rounded-lg">
                      <span className="font-bold text-red-400 uppercase text-[8px] tracking-wider block mb-1">Currículo Anterior</span>
                      <p className="text-slate-400 dark:text-slate-400 light:text-slate-700 italic">"Trabalhei como desenvolvedor criando interfaces web com React."</p>
                    </div>

                    <div className="bg-slate-900/60 dark:bg-slate-900 light:bg-green-50/30 border border-brand-accent/20 p-2.5 rounded-lg relative overflow-hidden">
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1 py-0.5 rounded bg-brand-accent/15 text-brand-accent text-[7px] font-bold uppercase">
                        <Sparkles size={8} /> Otimizado com IA
                      </div>
                      <span className="font-bold text-brand-accent text-[8px] tracking-wider block mb-1 font-mono">Depois da Otimização</span>
                      <p className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-medium">
                        "Liderei a engenharia frontend de interfaces responsivas usando <strong className="text-brand-accent font-bold">React e TypeScript</strong>, reduzindo o tempo de renderização em 32% e aplicando <strong className="text-brand-accent font-bold">Zustand</strong> para controle de estado global."
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {tourStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 light:border-slate-200 pb-2">
                    <span className="font-bold text-slate-100 dark:text-white light:text-slate-900">Mentor IA Vocentro</span>
                    <div className="flex items-center gap-1 text-[8px] text-brand-accent font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                      Simulação em tempo real
                    </div>
                  </div>

                  <div className="space-y-3 min-h-[160px] flex flex-col justify-end text-[10px] leading-relaxed">
                    <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 rounded-xl p-2.5 max-w-[85%] text-slate-350">
                      <span className="font-bold text-slate-500 uppercase text-[7px] block font-mono">Mentor Vocentro</span>
                      <p className="text-slate-350 dark:text-slate-350 light:text-slate-800">"Como você otimiza a performance no controle de estado do React?"</p>
                    </div>

                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-2.5 max-w-[90%] text-brand-400 ml-auto text-right">
                      <span className="font-bold text-brand-500 uppercase text-[7px] block font-mono">Você</span>
                      <p className="text-slate-200 dark:text-slate-200 light:text-slate-850">"Utilizo Zustand para evitar re-renderizações e Context apenas em estados estáticos."</p>
                    </div>

                    <div className="p-2 bg-emerald-950/20 border border-brand-accent/20 rounded-xl flex items-center justify-between text-[9px] text-brand-accent font-sans">
                      <span>🎯 Nota: <strong>9.4/10</strong>. Resposta objetiva e focada na arquitetura de seletores.</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pause/Play indicator */}
          <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-400 pt-1 font-sans">
            <span>Clique em qualquer aba para pausar a animação</span>
            {isTourPaused && (
              <button 
                onClick={() => setIsTourPaused(false)}
                className="text-brand-accent hover:underline cursor-pointer"
              >
                Retomar reprodução automática
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Narrative Section - A Jornada Completa */}
      <section id="como-funciona" className="py-20 px-6 max-w-7xl mx-auto relative z-10 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">A Jornada Completa</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Sua evolução passo a passo
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-sans font-medium">
            Não vendemos currículos ou vagas. Oferecemos as ferramentas e a inteligência estratégica que colocam você no controle da sua própria carreira.
          </p>
        </div>

        {/* 8-Step Journey Alternated Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              step: '01',
              title: 'Upload de Perfil',
              desc: 'Suba seu currículo atual. Nossa IA analisa e decodifica instantaneamente suas hard e soft skills, destacando seus diferenciais competitivos.',
              icon: <FileText className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '02',
              title: 'Importe Vagas',
              desc: 'Importe descrições de vagas colando links de portais, PDFs ou integrando diretamente com APIs do sistema Greenhouse.',
              icon: <Search className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '03',
              title: 'Análise de Match',
              desc: 'Receba uma análise detalhando seu score de match semântico, gaps de competências e estimativa de senioridade na vaga.',
              icon: <Trophy className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '04',
              title: 'Otimização ATS',
              desc: 'Ajuste seu currículo sob medida. A IA reescreve experiências com base no método STAR e palavras-chave mais buscadas.',
              icon: <Sparkles className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '05',
              title: 'Carta de Apresentação',
              desc: 'Gere cartas de apresentação inteligentes que cruzam o tom cultural da empresa com as maiores conquistas do seu histórico.',
              icon: <Layers className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '06',
              title: 'Treino de Entrevista',
              desc: 'Simule entrevistas reais da vaga com nosso Mentor IA Vocentro e obtenha feedbacks imediatos de postura e profundidade.',
              icon: <MessageSquare className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '07',
              title: 'CRM Kanban Integrado',
              desc: 'Mantenha-se no controle visual de todo o seu pipeline de vagas, desde o mapeamento inicial até a proposta e oferta final.',
              icon: <Activity className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '08',
              title: 'Evolução Contínua',
              desc: 'Acompanhe seu progresso por meio de telemetria e gráficos analíticos. Você no centro das melhores vagas do mercado.',
              icon: <CheckCircle2 className="w-5 h-5 text-brand-accent" />
            }
          ].map((item, idx) => (
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              key={idx}
              className="p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 shadow-sm transition-all duration-300 relative overflow-hidden group hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-[12px] bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                    <span className="text-lg font-black text-slate-800 dark:text-slate-800 light:text-slate-200 font-mono tracking-tighter select-none">
                      {item.step}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-900 uppercase tracking-wider">{item.title}</h3>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 light:text-slate-655 leading-relaxed font-sans font-medium">{item.desc}</p>
                </div>
              </div>

              {/* Dynamic visual representation to break repetition */}
              {getStepVisual(item.step)}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Before / After Section (ATS Comparison) */}
      <section id="comparativo" className="py-20 px-6 max-w-5xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-brand-500 dark:text-brand-500 light:text-brand-600 uppercase tracking-widest font-mono">Seu currículo é apenas o começo</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Antes vs Depois com Vocentro
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 max-w-md mx-auto leading-relaxed font-sans font-medium">
            Veja a diferença imediata na pontuação ATS de triagem de candidatos após a otimização estrutural.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center max-w-4xl mx-auto">
          {/* Before Column */}
          <div className="md:col-span-5 bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-red-500/20 dark:border-red-500/10 light:border-red-200 p-6 rounded-[20px] space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-905 dark:border-slate-900 light:border-slate-150 pb-3 font-sans">
              <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">Sem Otimização</span>
              <span className="px-2 py-0.5 rounded bg-red-950/20 text-red-455 text-[8px] font-bold uppercase font-mono">41% Match</span>
            </div>

            <div className="flex items-center gap-5 font-sans leading-relaxed">
              <div className="w-16 h-16 rounded-full border-4 border-slate-950 dark:border-slate-950 light:border-slate-100 flex items-center justify-center relative shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-b-transparent border-l-transparent border-r-transparent" />
                <span className="text-base font-black text-red-400 font-display">41%</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-300 dark:text-slate-350 light:text-slate-800 block">Filtros Automáticos</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-600 font-mono">Rejeitado na triagem do ATS</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-[10px] text-slate-450 dark:text-slate-400 light:text-slate-700 font-sans leading-relaxed font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 shrink-0 select-none">❌</span>
                <span>Termos técnicos obrigatórios ausentes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 shrink-0 select-none">❌</span>
                <span>Experiência descrita sem dados de impacto e negócio</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 shrink-0 select-none">❌</span>
                <span>Foco apenas em tarefas, em vez de conquistas</span>
              </li>
            </ul>
          </div>

          {/* Central Arrow */}
          <div className="md:col-span-1 flex justify-center text-slate-500">
            <ArrowRight size={24} className="rotate-90 md:rotate-0 text-brand-accent shrink-0 animate-pulse" />
          </div>

          {/* After Column */}
          <div className="md:col-span-5 bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-brand-accent/30 dark:border-brand-accent/20 light:border-brand-accent/30 p-6 rounded-[20px] space-y-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-accent text-slate-950 text-[7px] font-black uppercase px-2 py-0.5 rounded-bl font-mono">
              Você no centro
            </div>

            <div className="flex justify-between items-center border-b border-slate-850 dark:border-slate-850 light:border-slate-150 pb-3 font-sans">
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Com o Vocentro</span>
              <span className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent text-[8px] font-bold uppercase font-mono">89% Match</span>
            </div>

            <div className="flex items-center gap-5 font-sans leading-relaxed">
              <div className="w-16 h-16 rounded-full border-4 border-slate-950 dark:border-slate-950 light:border-slate-100 flex items-center justify-center relative shrink-0 shadow-lg shadow-brand-accent/5">
                <div className="absolute inset-0 rounded-full border-4 border-brand-accent" />
                <span className="text-base font-black text-brand-accent font-display">89%</span>
              </div>
              <div>
                <span className="text-xs font-bold text-brand-accent dark:text-brand-accent light:text-green-700 block">Destaque na Triagem</span>
                <span className="text-[9px] text-slate-350 dark:text-slate-350 light:text-slate-700">Encaminhado direto ao gestor da vaga</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-[10px] text-slate-300 dark:text-slate-300 light:text-slate-800 font-sans leading-relaxed font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-brand-accent shrink-0 select-none">✓</span>
                <span>Alinhamento semântico de hard skills exigidas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-brand-accent shrink-0 select-none">✓</span>
                <span>Ações estruturadas no método STAR com métricas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-brand-accent shrink-0 select-none">✓</span>
                <span>Vocabulário customizado para a cultura da empresa</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Narrative Section - A IA trabalha para você (Timeline) */}
      <section id="recursos" className="py-20 px-6 max-w-7xl mx-auto relative z-10 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Estratégia Integrada</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            A IA trabalha para você
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed font-sans font-medium">
            Nossos sistemas de inteligência foram projetados de forma narrativa e integrada para impulsionar cada etapa da sua jornada profissional.
          </p>
        </div>

        {/* Narrative Vertical Timeline Path */}
        <div className="relative max-w-3xl mx-auto py-10">
          {/* Vertical Connecting Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] bg-slate-900 dark:bg-slate-900 light:bg-slate-200" />
          
          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'A IA entende seu currículo',
                desc: 'Lê e decodifica seu currículo original, mapeando competências técnicas e comportamentais para criar o perfil.',
                icon: '👤'
              },
              {
                step: '02',
                title: 'Compara com milhares de vagas',
                desc: 'Realiza uma análise semântica tridimensional detalhada comparando sua trajetória com as vagas importadas.',
                icon: '🔍'
              },
              {
                step: '03',
                title: 'Identifica gaps de competência',
                desc: 'Mapeia exatamente quais frameworks, termos técnicos ou ferramentas estão ausentes para aquela vaga específica.',
                icon: '⚠️'
              },
              {
                step: '04',
                title: 'Sugere melhorias estruturais',
                desc: 'Apresenta reescritas de conquistas profissionais baseadas no método STAR para maximizar seu score no ATS.',
                icon: '💡'
              },
              {
                step: '05',
                title: 'Treina suas entrevistas',
                desc: 'Simula processos seletivos reais por voz ou chat conduzidos pelo Mentor IA Vocentro com notas instantâneas.',
                icon: '💬'
              },
              {
                step: '06',
                title: 'Monta seu plano de carreira',
                desc: 'Estrutura metas salariais, objetivos e planos de ação semanais para guiar sua recolocação ativa.',
                icon: '📅'
              },
              {
                step: '07',
                title: 'Acompanha sua evolução',
                desc: 'Mede as taxas de conversão e avanço das suas candidaturas ativas na plataforma, oferecendo telemetria completa.',
                icon: '📈'
              }
            ].map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center font-sans">
                  {/* Timeline dot */}
                  <div className="absolute left-[20px] md:left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border-4 border-brand-accent z-20 shadow-md shadow-brand-accent/20" />
                  
                  {/* Left Spacer (only for alternating layout on desktop) */}
                  <div className={`hidden md:block w-1/2 pr-12 text-right ${isEven ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {isEven && (
                      <div className="space-y-1.5 leading-relaxed font-medium">
                        <span className="text-[10px] font-bold text-brand-accent uppercase font-mono tracking-wider">Etapa {step.step}</span>
                        <h4 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display flex items-center justify-end gap-2">
                          <span>{step.icon}</span>
                          <span>{step.title}</span>
                        </h4>
                        <p className="text-xs text-slate-450 dark:text-slate-400 light:text-slate-600 font-sans font-normal">{step.desc}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Content */}
                  <div className={`w-full md:w-1/2 pl-12 md:pl-12 text-left ${!isEven ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                    <div className={`space-y-1.5 leading-relaxed font-medium ${isEven ? 'md:hidden' : ''}`}>
                      <span className="text-[10px] font-bold text-brand-accent uppercase font-mono tracking-wider">Etapa {step.step}</span>
                      <h4 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 font-display flex items-center gap-2">
                        <span>{step.icon}</span>
                        <span>{step.title}</span>
                      </h4>
                      <p className="text-xs text-slate-450 dark:text-slate-400 light:text-slate-600 font-sans font-normal">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Metrics Dashboard */}
      <section className="py-16 px-6 max-w-5xl mx-auto relative z-10 space-y-10 text-center">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Métricas de Sucesso</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">Resultados Comprovados</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto text-center font-sans leading-relaxed">
          {[
            { metric: '2.300+', label: 'Perfis Analisados', detail: 'IA de alta precisão semântica', emoji: '👤' },
            { metric: '11.000+', label: 'Vagas Processadas', detail: 'Mapeamento contínuo de mercado', emoji: '📄' },
            { metric: '8.400+', label: 'Simulações Concluídas', detail: 'Entrevistas STAR com Mentor IA', emoji: '🎯' },
            { metric: '94%', label: 'Taxa de Satisfação', detail: 'Profissionais em evolução ativa', emoji: '⭐' }
          ].map((stat, idx) => (
            <div key={idx} className="p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 transition-all shadow-sm">
              <span className="text-3xl block mb-2">{stat.emoji}</span>
              <div className="text-2xl font-black text-white dark:text-white light:text-slate-900 font-display mt-2">{stat.metric}</div>
              <div className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-800 mt-1">{stat.label}</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-550 mt-0.5 leading-relaxed font-normal">{stat.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy highlights */}
      <section className="py-12 px-6 max-w-4xl mx-auto relative z-10 text-center">
        <div className="p-8 rounded-[20px] bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 max-w-3xl mx-auto space-y-5 shadow-sm font-sans leading-relaxed">
          <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/15">
            <EyeOff size={24} className="text-brand-accent" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 uppercase tracking-wider">Privacidade absoluta do candidato</h3>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-655 text-xs leading-relaxed max-w-xl mx-auto font-normal">
              Seus dados de currículo, feedbacks do Mentor IA e vagas mapeadas pertencem estritamente a você. Não compartilhamos nenhuma informação com recrutadores externos sem sua aprovação explícita. Todo processamento de dados atende às regulamentações da LGPD.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-brand-accent" /> Criptografia de Dados (SSL)</span>
            <span className="flex items-center gap-1.5"><UserCheck size={12} className="text-brand-accent" /> Sem Cookies de Terceiros</span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-6 max-w-7xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Planos</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">Simplicidade e transparência</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto font-sans">
          {/* Free Plan */}
          <div className="p-8 rounded-[20px] bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900 font-display">Plano Básico</h3>
                  <p className="text-xs text-slate-400">O básico essencial de recolocação.</p>
                </div>
                <span className="text-2xl font-black text-slate-200 dark:text-white light:text-slate-900 font-display shrink-0">Grátis</span>
              </div>
              
              <ul className="space-y-3 text-xs text-slate-350 dark:text-slate-350 light:text-slate-700 leading-relaxed font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Kanban Pipeline de candidaturas
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Cadastro básico de currículo
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Match Score simplificado
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent" /> Acesso limitado ao Mentor IA
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
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 light:text-slate-500 block font-sans font-semibold">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 leading-relaxed font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Simulações ilimitadas com Mentor IA
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Otimizador ATS ilimitado de currículo
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={12} className="text-brand-accent shrink-0 font-bold" /> Ingestão de vagas automática via Greenhouse
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

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-3 font-sans">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Dúvidas</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">Perguntas Frequentes</p>
        </div>

        <div className="space-y-3">
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
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-450 dark:text-slate-400 light:text-slate-655 leading-relaxed border-t border-slate-950/30 dark:border-slate-950/30 light:border-slate-100 font-sans font-normal">
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

      {/* Strong Final CTA */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto relative z-10 space-y-8 font-sans leading-relaxed">
        <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display">
            Sua próxima contratação começa hoje.
          </h2>
          <p className="text-slate-350 dark:text-slate-300 light:text-slate-700 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-semibold">
            Você não precisa enviar centenas de currículos. Precisa enviar o currículo certo, para a vaga certa, no momento certo. A Vocentro faz esse trabalho com você.
          </p>
        </div>

        <button 
          onClick={() => onNavigateToAuth('signup')}
          className="px-8 py-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all shadow-xl shadow-brand-500/25 hover:scale-[1.01] inline-flex items-center gap-2.5 cursor-pointer"
        >
          Começar gratuitamente
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer Notion/Vercel/Stripe style */}
      <footer className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white backdrop-blur-md py-16 px-8 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <VocentroLogo className="h-10 text-white dark:text-white light:text-slate-900" showText={true} />
            <p className="text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-655 leading-relaxed max-w-sm font-sans font-normal">
              A Vocentro é a central de evolução profissional que coloca você no centro das melhores vagas do mercado de tecnologia e negócios através de match semântico e mentoria baseada em inteligência artificial.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4 font-mono">Produto</h4>
            <ul className="space-y-2 text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-655 font-semibold font-sans leading-relaxed">
              <li><a href="#como-funciona" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors">A Jornada</a></li>
              <li><a href="#demonstracao" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors">Veja em Ação</a></li>
              <li><a href="#comparativo" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors">Antes vs Depois</a></li>
              <li><a href="#planos" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors">Planos & Preços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4 font-mono">Segurança</h4>
            <ul className="space-y-2 text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-655 font-semibold font-sans leading-relaxed">
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors">Termos de Uso</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors">Privacidade</a></li>
              <li><span className="text-slate-500/80 cursor-default">Termos de Cookies</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4 font-mono">Fale Conosco</h4>
            <a href="mailto:suporte@vocentro.com" className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-655 font-semibold font-sans leading-relaxed hover:text-slate-200 transition-colors flex items-center gap-1.5">
              <Mail size={12} className="text-brand-accent" />
              suporte@vocentro.com
            </a>
            <div className="flex gap-4 mt-6">
              {/* GitHub */}
              <a href="#" aria-label="Github" className="text-slate-500 dark:text-slate-500 light:text-slate-655 hover:text-brand-accent transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="text-slate-500 dark:text-slate-500 light:text-slate-655 hover:text-brand-accent transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              {/* Twitter / X */}
              <a href="#" aria-label="Twitter/X" className="text-slate-500 dark:text-slate-500 light:text-slate-655 hover:text-brand-accent transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-900 dark:border-slate-900 light:border-slate-100 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-600 gap-4 font-sans leading-relaxed font-normal">
          <span>© 2026 Vocentro. Todos os direitos reservados.</span>
          <span>Tecnologia avançada em prol da evolução de carreiras e da igualdade de oportunidades.</span>
        </div>
      </footer>
    </div>
  );
}
