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
  Zap,
  EyeOff,
  UserCheck,
  ShieldCheck,
  ArrowUpRight,
  Database,
  TrendingUp
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
          <a href="#demonstracao" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Como Funciona</a>
          <a href="#comparativo" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Antes vs Depois</a>
          <a href="#recursos" className="text-xs font-semibold text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors">Diferenciais</a>
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
      <section id="demonstracao" className="relative min-h-[90vh] pt-28 pb-12 flex items-center px-6 md:px-12 z-10 max-w-7xl mx-auto">
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
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display"
            >
              Sua carreira.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-brand-500 to-indigo-500">Você no centro</span>.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-slate-300 dark:text-slate-300 light:text-slate-655 text-sm sm:text-base leading-relaxed max-w-xl"
            >
              Uma plataforma inteligente que entende seu perfil, organiza sua estratégia profissional e conecta você às melhores oportunidades com ajuda de IA.
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
                href="#como-funciona"
                className="px-6 py-3.5 rounded-[14px] border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/30 dark:bg-slate-900/30 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer shadow-sm"
              >
                Ver demonstração
              </a>
            </motion.div>

            {/* Quick Metrics Bar in Hero */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200"
            >
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">2.300+</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600">Perfis analisados</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">11.000+</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600">Vagas mapeadas</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-display">94%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600">Satisfação de evolução</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero - INTERACTIVE TOUR SHOWCASE */}
          <div className="lg:col-span-6 flex justify-center relative w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="w-full max-w-lg bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 rounded-[22px] p-5 shadow-2xl relative backdrop-blur-sm space-y-4">
              
              {/* Fake Window Controls */}
              <div className="flex items-center justify-between border-b border-slate-850/50 dark:border-slate-850/50 light:border-slate-200 pb-3">
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
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 rounded-xl border border-slate-900 dark:border-slate-900 light:border-slate-200">
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
                      className={`flex flex-col items-center py-1.5 px-1 rounded-lg transition-all duration-205 text-center gap-1 cursor-pointer ${
                        isActive 
                          ? 'bg-slate-905 dark:bg-slate-900 light:bg-white text-brand-accent shadow-md border border-slate-800 dark:border-slate-800 light:border-slate-200' 
                          : 'text-slate-500 dark:text-slate-500 light:text-slate-600 hover:text-slate-350 light:hover:text-slate-800'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'animate-bounce text-brand-accent' : ''} />
                      <span className="text-[8px] font-bold tracking-tight whitespace-nowrap font-sans">{step.name.split('. ')[1]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Visual Simulated Mockups */}
              <div className="relative min-h-[260px] bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50/50 rounded-2xl p-4 border border-slate-900 dark:border-slate-900 light:border-slate-200 overflow-hidden flex flex-col justify-center">
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
                      <div className="text-center space-y-2 py-4">
                        <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto border border-brand-accent/25 animate-pulse">
                          <FileText size={24} />
                        </div>
                        <h4 className="font-bold text-slate-100 dark:text-white light:text-slate-900">Arraste seu currículo antigo</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-[280px] mx-auto">Nossos algoritmos estruturarão suas competências e experiências de forma imediata.</p>
                      </div>

                      <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 p-3 rounded-[14px] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-[10px] font-mono">
                            PDF
                          </div>
                          <div>
                            <span className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 block">curriculo_antigo.pdf</span>
                            <span className="text-[8px] text-slate-500">242 KB • Processado com IA</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-brand-accent" />
                          <span className="text-[9px] font-bold text-brand-accent">Sucesso</span>
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
                      className="space-y-3 text-xs"
                    >
                      <h4 className="font-bold text-slate-100 dark:text-white light:text-slate-900">Importe Vagas de Qualquer Fonte</h4>
                      <p className="text-[10px] text-slate-450 light:text-slate-600 leading-relaxed">Insira links de vagas da internet ou conecte com Greenhouse API para mapear a oportunidade no centro do radar.</p>
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 rounded-[10px] px-3 py-2 text-[10px] text-slate-300 light:text-slate-700 font-mono select-all overflow-hidden whitespace-nowrap">
                            https://greenhouse.io/stripe/jobs/senior-react-dev
                          </div>
                          <span className="px-3 py-2 rounded-[10px] bg-brand-500/15 border border-brand-500/30 text-brand-500 light:text-brand-600 text-[10px] font-bold uppercase font-mono">
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
                        {/* Circular Progress dial simulation */}
                        <div className="col-span-4 flex justify-center relative">
                          <div className="w-20 h-20 rounded-full border-4 border-slate-900 light:border-slate-200 flex items-center justify-center relative">
                            {/* Inner circle fill simulation with Vocentro accent green */}
                            <div className="absolute inset-0 rounded-full border-4 border-t-brand-accent border-r-brand-accent border-b-transparent border-l-transparent animate-spin-slow" />
                            {/* Center point of Vocentro brand */}
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

                      <div className="p-2.5 bg-brand-card dark:bg-brand-card light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl text-[9px] text-slate-300 light:text-slate-700 leading-relaxed">
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
                      <p className="text-[10px] text-slate-455 light:text-slate-655 leading-relaxed">A IA trabalha sob seu comando para reescrever conquistas com foco em impacto.</p>

                      <div className="space-y-2.5 text-[10px]">
                        <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-red-50/30 border border-red-500/20 p-2.5 rounded-lg">
                          <span className="font-bold text-red-400 uppercase text-[8px] tracking-wider block mb-1">Currículo Anterior</span>
                          <p className="text-slate-350 dark:text-slate-350 light:text-slate-700 italic">"Trabalhei como desenvolvedor criando interfaces web com React."</p>
                        </div>

                        <div className="bg-slate-905 dark:bg-slate-900 light:bg-green-50/30 border border-brand-accent/20 p-2.5 rounded-lg relative overflow-hidden">
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-1 py-0.5 rounded bg-brand-accent/15 text-brand-accent text-[7px] font-bold uppercase">
                            <Sparkles size={8} /> Otimizado com IA
                          </div>
                          <span className="font-bold text-brand-accent text-[8px] tracking-wider block mb-1">Depois da Otimização</span>
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
                        {/* Prompt bubble */}
                        <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 rounded-xl p-2.5 max-w-[85%] text-slate-350">
                          <span className="font-bold text-slate-400 uppercase text-[7px] block">Mentor Vocentro</span>
                          <p className="text-slate-250 dark:text-slate-250 light:text-slate-800">"Como você otimiza a performance no controle de estado do React?"</p>
                        </div>

                        {/* Answer bubble */}
                        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-2.5 max-w-[90%] text-brand-400 ml-auto text-right">
                          <span className="font-bold text-brand-500 uppercase text-[7px] block">Você</span>
                          <p className="text-slate-200 dark:text-slate-200 light:text-slate-850">"Utilizo Zustand para evitar re-renderizações e Context apenas em estados estáticos."</p>
                        </div>

                        {/* Coach feedback */}
                        <div className="p-2 bg-emerald-950/20 border border-brand-accent/20 rounded-xl flex items-center justify-between text-[9px] text-brand-accent">
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
          </div>
        </div>
      </section>

      {/* Narrative Section - Você no Centro */}
      <section id="como-funciona" className="py-20 px-6 max-w-7xl mx-auto relative z-10 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Você no centro</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            A jornada completa da sua evolução profissional
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
            Não vendemos currículos ou vagas. Oferecemos as ferramentas e a inteligência estratégica que colocam você no controle da sua própria carreira.
          </p>
        </div>

        {/* 8-Step Journey */}
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
              title: 'Importe Oportunidades',
              desc: 'Importe descrições de vagas colando links de portais, PDFs ou integrando diretamente com APIs do sistema Greenhouse.',
              icon: <Search className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '03',
              title: 'Análise de Match',
              desc: 'Receba uma análise tridimensional detalhando seu score de match semântico, gaps de competências e estimativa de senioridade.',
              icon: <Trophy className="w-5 h-5 text-brand-accent" />
            },
            {
              step: '04',
              title: 'Otimização ATS',
              desc: 'Ajuste seu currículo sob medida. A IA reescreve experiências com base no método STAR e palavras-chave mais buscadas pelos recrutadores.',
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
              title: 'Treino com Mentor IA',
              desc: 'Simule entrevistas reais da vaga com nosso Mentor IA Vocentro e obtenha feedbacks imediatos de postura e profundidade técnica.',
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
              title: 'Evolução de Carreira',
              desc: 'Acompanhe seu progresso por meio de telemetria e gráficos analíticos. Você no centro das melhores vagas do mercado.',
              icon: <CheckCircle2 className="w-5 h-5 text-brand-accent" />
            }
          ].map((item, idx) => (
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              key={idx}
              className="p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 shadow-sm transition-all duration-300 relative overflow-hidden group hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-[12px] bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
                  {item.icon}
                </div>
                {/* Dot in circle design concept */}
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  <span className="text-lg font-black text-slate-800 dark:text-slate-800 light:text-slate-200 font-mono tracking-tighter select-none">
                    {item.step}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-900 uppercase tracking-wider">{item.title}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Before / After Section (ATS Comparison) */}
      <section id="comparativo" className="py-20 px-6 max-w-5xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-brand-500 dark:text-brand-500 light:text-brand-600 uppercase tracking-widest font-mono">Seu currículo é apenas o começo</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            Transforme sua carreira em estratégia
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 max-w-md mx-auto leading-relaxed">
            Veja a diferença imediata na pontuação ATS de triagem de candidatos após a otimização com Vocentro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center max-w-4xl mx-auto">
          {/* Before Column */}
          <div className="md:col-span-5 bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-red-500/20 dark:border-red-500/10 light:border-red-200 p-6 rounded-[20px] space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-905 dark:border-slate-900 light:border-slate-150 pb-3">
              <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">Currículo sem Otimização</span>
              <span className="px-2 py-0.5 rounded bg-red-950/20 text-red-455 text-[8px] font-bold uppercase font-mono">41% Match</span>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border-4 border-slate-950 dark:border-slate-950 light:border-slate-100 flex items-center justify-center relative shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-b-transparent border-l-transparent border-r-transparent" />
                <span className="text-base font-black text-red-400 font-display">41%</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-300 dark:text-slate-350 light:text-slate-800 block">Filtros Automáticos</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-600 font-mono">Rejeitado na triagem do ATS</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-700">
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
            <div className="absolute top-0 right-0 bg-brand-accent text-slate-950 text-[7px] font-black uppercase px-2 py-0.5 rounded-bl">
              Você no centro
            </div>

            <div className="flex justify-between items-center border-b border-slate-850 dark:border-slate-850 light:border-slate-150 pb-3">
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">Com o Vocentro</span>
              <span className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent text-[8px] font-bold uppercase font-mono">89% Match</span>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border-4 border-slate-950 dark:border-slate-950 light:border-slate-100 flex items-center justify-center relative shrink-0 shadow-lg shadow-brand-accent/5">
                <div className="absolute inset-0 rounded-full border-4 border-brand-accent" />
                <span className="text-base font-black text-brand-accent font-display">89%</span>
              </div>
              <div>
                <span className="text-xs font-bold text-brand-accent dark:text-brand-accent light:text-green-700 block">Destaque na Triagem</span>
                <span className="text-[9px] text-slate-350 dark:text-slate-350 light:text-slate-700">Encaminhado direto ao gestor da vaga</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-[10px] text-slate-300 dark:text-slate-300 light:text-slate-800">
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

      {/* Advanced Technical Features */}
      <section id="recursos" className="py-20 px-6 max-w-7xl mx-auto relative z-10 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Tecnologia Humana</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">
            A IA trabalha para você
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed">
            Nossos sistemas de inteligência foram projetados para amplificar suas capacidades e te colocar no centro das melhores oportunidades.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
          
          {/* Card 1: Match Engine */}
          <div className="md:col-span-8 p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 transition-colors shadow-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-150 dark:text-slate-100 light:text-slate-900 uppercase tracking-wider">Análise de Relevância de Vagas</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed">
                Utilizamos processamento de linguagem natural (Gemini Structured Outputs) para comparar e alinhar sua trajetória profissional com o core técnico das vagas do mercado, informando gaps de habilidade precisos.
              </p>
            </div>
            <div className="flex gap-4 pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-100 text-[10px] text-slate-500 font-mono">
              <span>● Comparador de Competências</span>
              <span>● Detecção de Requisitos Gaps</span>
            </div>
          </div>

          {/* Card 2: Coach IA */}
          <div className="md:col-span-4 p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 transition-colors shadow-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-150 dark:text-slate-100 light:text-slate-900 uppercase tracking-wider">Mentor IA Vocentro</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed">
                Treine suas respostas para perguntas reais de processos seletivos por voz ou chat e ganhe feedbacks analíticos instantâneos.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-accent uppercase font-mono">
              <span>Iniciar preparação</span>
              <ArrowUpRight size={12} />
            </div>
          </div>

          {/* Card 3: Ingestão de Vagas */}
          <div className="md:col-span-4 p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 transition-colors shadow-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                <Database size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-150 dark:text-slate-100 light:text-slate-900 uppercase tracking-wider">Ingestão via Greenhouse e URL</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed">
                Puxe vagas de qualquer endereço web, PDFs locais ou integre com o Greenhouse ATS de forma automatizada e limpa.
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Tecnologia de Extração Rápida</span>
          </div>

          {/* Card 4: CRM Kanban */}
          <div className="md:col-span-8 p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 transition-colors shadow-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                <Layers size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-150 dark:text-slate-100 light:text-slate-900 uppercase tracking-wider">Pipeline de Estratégia Kanban</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed">
                Organize todas as suas candidaturas ativas de forma simples. Acompanhe contatos, datas de entrevista e fases do processo seletivo em tempo real.
              </p>
            </div>
            <div className="flex gap-4 pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-100 text-[10px] text-slate-500 font-mono">
              <span>● Pipeline Visual</span>
              <span>● Histórico de Candidaturas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Dashboard */}
      <section className="py-16 px-6 max-w-5xl mx-auto relative z-10 space-y-10 text-center">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-brand-accent uppercase tracking-widest font-mono">Crescimento Saudável</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 font-display">Nossos números</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto text-center">
          {[
            { metric: '2.300+', label: 'Perfis Analisados', detail: 'IA de alta precisão semântica', icon: <FileText className="text-brand-accent mx-auto w-5 h-5 mb-1" /> },
            { metric: '11.000+', label: 'Vagas Processadas', detail: 'Conectadas às melhores oportunidades', icon: <Search className="text-brand-accent mx-auto w-5 h-5 mb-1" /> },
            { metric: '8.400+', label: 'Simulações Concluídas', detail: 'Preparação com Mentor IA Vocentro', icon: <MessageSquare className="text-brand-accent mx-auto w-5 h-5 mb-1" /> },
            { metric: '94%', label: 'Taxa de Satisfação', detail: 'Avaliada pelos usuários ativos', icon: <TrendingUp className="text-brand-accent mx-auto w-5 h-5 mb-1" /> }
          ].map((stat, idx) => (
            <div key={idx} className="p-6 rounded-[20px] bg-slate-900/30 dark:bg-slate-900/30 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 hover:border-slate-800 dark:hover:border-slate-700 light:hover:border-slate-300 transition-all shadow-sm">
              {stat.icon}
              <div className="text-2xl font-black text-white dark:text-white light:text-slate-900 font-display mt-2">{stat.metric}</div>
              <div className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-800 mt-1">{stat.label}</div>
              <div className="text-[9px] text-slate-550 dark:text-slate-500 mt-0.5">{stat.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy highlights */}
      <section className="py-12 px-6 max-w-4xl mx-auto relative z-10 text-center">
        <div className="p-8 rounded-[20px] bg-slate-900/20 dark:bg-slate-900/20 light:bg-white border border-slate-850 dark:border-slate-850 light:border-slate-200 max-w-3xl mx-auto space-y-5 shadow-sm">
          <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/15">
            <EyeOff size={24} className="text-brand-accent" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900 uppercase tracking-wider">Privacidade absoluta do candidato</h3>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-655 text-xs leading-relaxed max-w-xl mx-auto font-sans">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
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
              
              <ul className="space-y-3 text-xs text-slate-350 dark:text-slate-350 light:text-slate-700">
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
              className="w-full py-3 px-4 rounded-[14px] border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-100 hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 font-semibold text-xs transition-all cursor-pointer shadow-sm font-sans"
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
                  <p className="text-xs text-brand-accent dark:text-brand-accent light:text-green-700">Acelere sua aprovação com IA ilimitada.</p>
                </div>
                <div className="text-right shrink-0 font-display">
                  <span className="text-2xl font-black text-slate-200 dark:text-white light:text-slate-900">R$ 29</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 light:text-slate-500 block">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
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
              className="w-full py-3 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-md cursor-pointer font-sans"
            >
              Aderir ao Premium
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-3">
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
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-400 dark:text-slate-400 light:text-slate-655 leading-relaxed border-t border-slate-950/30 dark:border-slate-950/30 light:border-slate-100 font-sans">
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
      <section className="py-24 px-6 text-center max-w-4xl mx-auto relative z-10 space-y-8">
        <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100 dark:text-white light:text-slate-900 leading-tight font-display">
            Sua próxima conquista <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-indigo-500">começa aqui</span>.
          </h2>
          <p className="text-slate-350 dark:text-slate-300 light:text-slate-700 text-sm sm:text-base leading-relaxed font-semibold">
            Junte-se aos profissionais que utilizam o Vocentro para gerenciar estrategicamente suas carreiras.
          </p>
          <p className="text-slate-500 dark:text-slate-500 light:text-slate-600 text-xs max-w-md mx-auto leading-relaxed">
            Pare de enviar currículos no escuro. Coloque-se no centro das melhores oportunidades do mercado profissional hoje.
          </p>
        </div>

        <button 
          onClick={() => onNavigateToAuth('signup')}
          className="px-8 py-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all shadow-xl shadow-brand-500/25 hover:scale-[1.01] inline-flex items-center gap-2.5 cursor-pointer font-sans"
        >
          Começar gratuitamente
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white backdrop-blur-md py-12 px-6 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <VocentroLogo className="h-8 text-white dark:text-white light:text-slate-900" showText={true} />
            <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600 leading-relaxed max-w-xs font-sans">
              A plataforma que coloca você no centro das melhores oportunidades através de tecnologia e telemetria de carreira baseada em IA.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4">Navegação</h4>
            <ul className="space-y-2 text-[10px] text-slate-550 dark:text-slate-500 light:text-slate-655 font-semibold font-sans">
              <li><a href="#como-funciona" className="hover:text-slate-350 dark:hover:text-slate-200 light:hover:text-slate-900">A Jornada</a></li>
              <li><a href="#demonstracao" className="hover:text-slate-350 dark:hover:text-slate-200 light:hover:text-slate-900">Demonstração</a></li>
              <li><a href="#comparativo" className="hover:text-slate-350 dark:hover:text-slate-200 light:hover:text-slate-900">Antes vs Depois</a></li>
              <li><a href="#planos" className="hover:text-slate-350 dark:hover:text-slate-200 light:hover:text-slate-900">Planos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4">Políticas</h4>
            <ul className="space-y-2 text-[10px] text-slate-550 dark:text-slate-500 light:text-slate-655 font-semibold font-sans">
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 dark:hover:text-slate-200 light:hover:text-slate-900">Termos de Uso</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 dark:hover:text-slate-200 light:hover:text-slate-900">Privacidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-800 mb-4">Contato</h4>
            <p className="text-[10px] text-slate-550 dark:text-slate-500 light:text-slate-655 font-semibold font-sans">suporte@vocentro.com</p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-slate-550 dark:text-slate-500 light:text-slate-655 hover:text-slate-300 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors"><Layers size={14} /></a>
              <a href="#" className="text-slate-550 dark:text-slate-500 light:text-slate-655 hover:text-slate-300 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors"><Zap size={14} /></a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-900 dark:border-slate-900 light:border-slate-100 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-600 gap-4 font-sans">
          <span>© 2026 Vocentro. Todos os direitos reservados.</span>
          <span>Tecnologia em prol da igualdade de oportunidades.</span>
        </div>
      </footer>
    </div>
  );
}
