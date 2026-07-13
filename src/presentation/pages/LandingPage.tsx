import { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { TalentaLogo } from '../components/ds/MyCareerIcons';

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
      q: 'Como funciona?',
      a: 'A Talenta funciona como um copiloto inteligente de carreira. Ao importar seu currículo, nossa inteligência artificial mapeia suas competências, identifica lacunas, otimiza seus materiais de candidatura para cada vaga específica e simula entrevistas em tempo real para garantir sua aprovação.'
    },
    {
      q: 'A IA altera meu currículo?',
      a: 'Não diretamente sem sua autorização. A IA analisa os requisitos da vaga desejada e sugere adaptações estratégicas na sua redação, palavras-chave e destakes de conquistas. Você revisa todas as propostas e tem controle absoluto sobre a versão final do seu currículo.'
    },
    {
      q: 'Posso importar vagas?',
      a: 'Sim! Você pode cadastrar qualquer vaga do mercado na plataforma inserindo o link ou descrição. A IA calculará instantaneamente o seu Score de Match e criará um plano de preparação focado para aquela oportunidade.'
    },
    {
      q: 'É gratuito?',
      a: 'Sim! A Talenta oferece um plano gratuito vitalício com acesso ao painel de acompanhamento, busca básica de vagas, otimizações iniciais de currículo e interações limitadas com o Coach IA. Você pode atualizar para o plano Premium a qualquer momento para obter recursos avançados e ilimitados.'
    },
    {
      q: 'Como funciona o Premium?',
      a: 'O plano Premium desbloqueia simulações ilimitadas de entrevista por voz e chat com feedbacks analíticos detalhados, otimizações avançadas de currículo baseadas em ATS (sistemas de rastreamento de candidatos), cartas de apresentação inteligentes ilimitadas e telemetria profunda de match de vagas.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-brand-500/30 selection:text-white">
      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/90 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between px-6 z-50 transition-colors">
        <TalentaLogo className="h-8" showText={true} />
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#como-funciona" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Como Funciona</a>
          <a href="#coach-ia" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Coach IA</a>
          <a href="#comparacao" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Comparativo</a>
          <a href="#beneficios" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Benefícios</a>
          <a href="#planos" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Planos</a>
          <a href="#faq" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer"
          >
            Começar Grátis
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] pt-20 pb-8 flex items-center px-6 md:px-12 z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase"
            >
              <Sparkles size={10} className="animate-pulse" />
              Sua jornada profissional guiada por IA
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6.5xl font-bold tracking-tight text-white leading-tight font-display"
            >
              Pare de enviar <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">currículos no escuro</span>.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl"
            >
              A Talenta mostra exatamente quais vagas combinam com você, melhora seu currículo e prepara você para conquistar a próxima oportunidade.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-[1.02] cursor-pointer"
              >
                Começar gratuitamente
                <ArrowRight size={16} />
              </button>
              <a 
                href="#como-funciona"
                className="px-6 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                Ver demonstração
              </a>
            </motion.div>
          </div>

          {/* Right Hero Mockup (Product Story Flow) */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-md bg-slate-900/40 border border-slate-850 rounded-3xl p-5 shadow-2xl relative backdrop-blur-sm space-y-4"
            >
              {/* Fake Window Controls */}
              <div className="flex items-center gap-1.5 border-b border-slate-850/50 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                <span className="text-[10px] text-slate-650 font-mono ml-4 select-none">talenta.ai/jornada</span>
              </div>

              {/* Visual Story Flow */}
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Upload do Currículo', val: 'PDF importado com sucesso', status: 'done', delay: 0.3 },
                  { label: 'Perfil Mapeado', val: '14 competências identificadas', status: 'done', delay: 0.6 },
                  { label: 'Compatibilidade de Vaga', val: '92% Match encontrado', status: 'highlight', delay: 0.9 },
                  { label: 'Currículo Otimizado', val: 'Palavras-chave adaptadas', status: 'done', delay: 1.2 },
                  { label: 'Treino de Entrevista', val: 'Feedback do Coach IA gerado', status: 'active', delay: 1.5 },
                  { label: 'Candidatura Aprovada!', val: 'Conexão direta estabelecida', status: 'success', delay: 1.8 }
                ].map((step, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay, duration: 0.5 }}
                    key={idx} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-850/40 ${
                      step.status === 'success' 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : step.status === 'active'
                        ? 'bg-brand-950/20 border-brand-500/30'
                        : step.status === 'highlight'
                        ? 'bg-indigo-950/20 border-indigo-500/30'
                        : 'bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                        step.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : step.status === 'active'
                          ? 'bg-brand-500/10 text-brand-400'
                          : step.status === 'highlight'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-slate-850 text-slate-400'
                      }`}>
                        {step.status === 'active' ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                        ) : idx + 1}
                      </div>
                      <span className="font-semibold text-slate-200">{step.label}</span>
                    </div>
                    <span className={`text-[10px] ${
                      step.status === 'success'
                        ? 'text-emerald-400 font-bold'
                        : step.status === 'active'
                        ? 'text-brand-400 font-bold'
                        : step.status === 'highlight'
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-450'
                    }`}>
                      {step.val}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Highlight Bar */}
      <section className="bg-slate-900/20 border-y border-slate-850/40 py-6 relative z-10 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tudo em um só lugar</span>
          <div className="grid grid-cols-2 md:flex items-center gap-6 md:gap-8 lg:gap-12">
            {[
              'Descubra vagas',
              'Prepare seu currículo',
              'Treine entrevistas',
              'Organize candidaturas'
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-2 justify-center md:justify-start">
                <CheckCircle2 size={14} className="text-brand-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-10 px-6 max-w-7xl mx-auto relative z-10 text-center space-y-8">
        <div className="space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Fluxo Inteligente</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">Como a Talenta te conduz ao emprego ideal</p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative max-w-5xl mx-auto">
          {[
            {
              step: '1',
              title: 'Importe seu currículo',
              desc: 'Suba seu currículo em PDF. Nossa IA lerá e interpretará seu histórico técnico em segundos.',
              icon: <FileText className="w-5 h-5 text-brand-400" />
            },
            {
              step: '2',
              title: 'IA entende seu perfil',
              desc: 'A IA mapeia suas habilidades duras, interpessoais e pontos fortes de carreira.',
              icon: <Activity className="w-5 h-5 text-indigo-400" />
            },
            {
              step: '3',
              title: 'Receba vagas',
              desc: 'Tenha acesso a uma curadoria diária de vagas recomendadas com base em real afinidade técnica.',
              icon: <Search className="w-5 h-5 text-brand-400" />
            },
            {
              step: '4',
              title: 'Prepare-se',
              desc: 'Treine com simulações personalizadas geradas especificamente para a vaga pretendida.',
              icon: <MessageSquare className="w-5 h-5 text-indigo-400" />
            },
            {
              step: '5',
              title: 'Conquiste a vaga',
              desc: 'Acompanhe todo o processo no Kanban e conquiste sua próxima vaga com total segurança.',
              icon: <Trophy className="w-5 h-5 text-brand-400" />
            }
          ].map((item, idx) => (
            <div key={idx} className="relative flex flex-col items-center space-y-3 p-3">
              {/* Step indicator circle */}
              <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center relative shadow-lg">
                {item.icon}
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-slate-950 border border-slate-850 text-slate-400 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-200">{item.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </div>

              {/* Connecting line for desktop */}
              {idx < 4 && (
                <div className="hidden md:block absolute top-9 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-[1px] bg-gradient-to-r from-slate-800 to-slate-900" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Coach IA Section (MOVED UP) */}
      <section id="coach-ia" className="py-10 px-6 max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-5 text-left">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Preparação Absoluta</h2>
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight font-display">Conheça seu Coach IA de carreira</h3>
          <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
            Esqueça o nervosismo das entrevistas. Nosso Coach IA gera simulações de perguntas e avalia suas respostas para fornecer insights práticos em tempo real.
          </p>
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] text-brand-400 font-bold">1</span>
              <span className="text-slate-300 font-medium">Treinamento direcionado por vaga</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] text-brand-400 font-bold">2</span>
              <span className="text-slate-300 font-medium">Feedback gramatical e de postura técnica</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] text-brand-400 font-bold">3</span>
              <span className="text-slate-300 font-medium">Recomendações de estudo personalizadas</span>
            </div>
          </div>
        </div>

        {/* Chat Interface Mockup */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-lg bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-850/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
                <span className="text-xs font-bold text-slate-200">Sessão Ativa: Preparação Tech</span>
              </div>
              <span className="text-[10px] font-mono text-slate-550">Talenta Engine v2.6</span>
            </div>

            <div className="space-y-4 min-h-[220px] flex flex-col justify-end text-xs leading-relaxed">
              {/* User Bubble */}
              <div className="bg-slate-950/80 border border-slate-850/45 rounded-xl p-3.5 max-w-[85%] text-slate-300 space-y-1">
                <div className="font-bold text-[9px] text-slate-400 uppercase tracking-wider">Você</div>
                <p>Como posso aumentar meu match para a vaga de Desenvolvedor React Sênior na Stripe?</p>
              </div>

              {/* Coach IA Bubble */}
              <div className="bg-indigo-900/10 border border-indigo-900/20 rounded-xl p-3.5 max-w-[90%] text-indigo-350 ml-auto space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[9px] text-indigo-400 uppercase tracking-wider">
                  <Sparkles size={10} />
                  Talenta Coach
                </div>
                <p className="mb-2 text-slate-200">Analisando seu currículo e a vaga, identifiquei duas ações de alto impacto:</p>
                <ul className="space-y-1.5 list-disc pl-3.5 text-slate-300 text-[11px]">
                  <li>
                    <strong className="text-indigo-200">Adicione Zustand ou Redux:</strong> A vaga exige controle de estado complexo, e seu currículo foca apenas em Context API.
                  </li>
                  <li>
                    <strong className="text-indigo-200">Reescreva a Headline:</strong> Mude de "Frontend Developer" para "Engenheiro Frontend Especialista em React e Performance".
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After Section (NEW) */}
      <section className="py-10 px-6 max-w-5xl mx-auto relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Resultados Reais</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">A mudança na prática</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Before */}
          <div className="bg-red-950/5 border border-red-500/15 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Busca de Emprego Comum</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                <span className="text-slate-400">Currículos Enviados</span>
                <span className="font-bold text-red-300">100 aplicações</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                <span className="text-slate-400">Respostas Recebidas</span>
                <span className="font-bold text-red-300">2 retornos</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                <span className="text-slate-400">Tempo de Procura</span>
                <span className="font-bold text-red-300">Meses sem direção</span>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="bg-emerald-950/5 border border-emerald-500/15 p-6 rounded-2xl space-y-4 shadow-lg shadow-emerald-500/2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Busca de Emprego com a Talenta</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                <span className="text-slate-400">Candidaturas Direcionadas</span>
                <span className="font-bold text-emerald-300">18 vagas compatíveis</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                <span className="text-slate-400">Entrevistas Agendadas</span>
                <span className="font-bold text-emerald-300">5 processos seletivos</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                <span className="text-slate-400">Resultado Final</span>
                <span className="font-bold text-emerald-400">1 contratação rápida</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section (NEW) */}
      <section id="comparacao" className="py-10 px-6 max-w-5xl mx-auto relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Comparativo</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">Chega de perder tempo</p>
        </div>

        <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-900/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/30 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                <th className="p-4 sm:p-5">Experiência</th>
                <th className="p-4 sm:p-5 text-slate-400">Método Tradicional</th>
                <th className="p-4 sm:p-5 text-brand-400">Com a Talenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-slate-300">
              <tr>
                <td className="p-4 sm:p-5 font-bold text-slate-200">Currículos</td>
                <td className="p-4 sm:p-5">Currículos genéricos e sem foco técnico</td>
                <td className="p-4 sm:p-5 font-semibold text-white">Currículos personalizados pela IA para cada vaga</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-slate-200">Escolha de Vagas</td>
                <td className="p-4 sm:p-5">Aplica às cegas para qualquer vaga disponível</td>
                <td className="p-4 sm:p-5 font-semibold text-white">Prioriza vagas com maior compatibilidade semântica</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-slate-200">Entrevistas</td>
                <td className="p-4 sm:p-5">Entra nas reuniões sem preparação prévia</td>
                <td className="p-4 sm:p-5 font-semibold text-white">Treina respostas simuladas com Coach IA</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-slate-200">Organização</td>
                <td className="p-4 sm:p-5">Usa planilhas confusas ou blocos de notas</td>
                <td className="p-4 sm:p-5 font-semibold text-white">Tudo organizado em um único Kanban inteligente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Por Que Escolher a Talenta Section (Benefits Grid with Reduced Copy) */}
      <section id="beneficios" className="py-10 px-6 max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Vantagens Reais</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">A mudança que você precisa no seu processo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Candidaturas inteligentes.',
              desc: 'Descubra apenas vagas com alta compatibilidade.'
            },
            {
              title: 'Currículos direcionados.',
              desc: 'Adapte seu perfil para cada vaga em segundos.'
            },
            {
              title: 'Descubra o que falta para ser aprovado.',
              desc: 'Identifique gaps técnicos antes do recrutador.'
            },
            {
              title: 'Simulação realista.',
              desc: 'Treine com perguntas reais geradas pela IA.'
            },
            {
              title: 'Organização total.',
              desc: 'Acompanhe seus processos em um kanban automatizado.'
            },
            {
              title: 'Recomendações ativas.',
              desc: 'Saiba quando fazer o follow-up ou se certificar.'
            }
          ].map((benefit, idx) => (
            <motion.div 
              whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.2)' }}
              key={idx} 
              className="p-6 rounded-2xl bg-slate-900/30 border border-slate-850/60 backdrop-blur-sm flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                <Check size={16} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-200">{benefit.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tudo que você precisa (Grid com Cards de Benefícios Visuais) */}
      <section className="py-10 px-6 max-w-7xl mx-auto relative z-10 space-y-8 text-center">
        <div className="space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Módulos Completos</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">Tudo que você precisa em uma única plataforma</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto text-left">
          {[
            { name: '📄 Currículo Inteligente', desc: 'A IA adapta seu currículo de forma personalizada para cada vaga.' },
            { name: '🎯 Match Inteligente', desc: 'Veja seu percentual de compatibilidade real antes de se candidatar.' },
            { name: '🎙 Simulador', desc: 'Treine entrevistas difíceis por voz e receba feedbacks rápidos.' },
            { name: '📊 Jornada', desc: 'Nunca mais perca o andamento de uma candidatura ativa.' }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900/20 border border-slate-850/40 hover:border-slate-800 transition-all space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{item.name}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exemplos de Resultados (No fake numbers) */}
      <section className="py-10 px-6 bg-slate-900/10 border-y border-slate-850/30 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { title: 'Análise instantânea do currículo', desc: 'Mapeamento automático de habilidades e gaps em segundos.' },
            { title: 'Feedback personalizado para cada vaga', desc: 'Orientações focadas em aumentar seu match real.' },
            { title: 'Organização completa da busca', desc: 'Painel Kanban para monitorar contatos e respostas.' }
          ].map((stat, idx) => (
            <div key={idx} className="space-y-2 p-3">
              <span className="text-sm font-bold uppercase tracking-wider text-brand-400 font-display block">
                {stat.title}
              </span>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sua Privacidade em Primeiro Lugar (NEW) */}
      <section className="py-10 px-6 max-w-4xl mx-auto relative z-10 text-center space-y-6">
        <div className="p-8 rounded-2xl bg-slate-900/20 border border-slate-850/50 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/15">
            <EyeOff size={24} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Sua privacidade em primeiro lugar</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xl mx-auto">
              Seus dados profissionais e currículos são criptografados e tratados de forma estritamente confidencial. Você possui controle absoluto e pode remover todas as suas informações da nossa base com um único clique. Nenhuma informação é compartilhada com parceiros externos ou recrutadores sem seu consentimento prévio.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-brand-400" /> Criptografia de Ponta a Ponta</span>
            <span className="flex items-center gap-1.5"><UserCheck size={12} className="text-brand-400" /> LGPD/GDPR Conforme</span>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-10 px-6 max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Sucesso Compartilhado</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">Histórias de quem usou a Talenta</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              text: "Estava há 3 meses aplicando sem retorno. A IA me sugeriu incluir termos técnicos de Docker e Cloud que eu dominava, mas não detalhava. Fui chamado para 3 entrevistas na mesma semana.",
              name: "Juliana Santos",
              role: "Engenheira DevOps",
              company: "CloudCore"
            },
            {
              text: "O simulador de entrevistas do Coach IA foi o diferencial. Treinei as respostas mais difíceis da vaga de Engenheiro Frontend e entrei na empresa com muita segurança e controle.",
              name: "Thiago Lima",
              role: "Frontend Developer",
              company: "VeloPay"
            },
            {
              text: "A análise de match semântico me poupou muito tempo. Parei de aplicar para centenas de vagas e foquei nas oportunidades de alta compatibilidade recomendadas pela IA. Deu certo!",
              name: "Mariana Souza",
              role: "Product Manager",
              company: "NextSaaS"
            }
          ].map((dep, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900/30 border border-slate-850/60 flex flex-col justify-between space-y-6">
              <p className="text-xs text-slate-300 italic leading-relaxed">"{dep.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs">
                  {dep.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{dep.name}</h4>
                  <span className="text-[10px] text-slate-500">{dep.role} • {dep.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-10 px-6 max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Transparência</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">Planos simples para suas necessidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-2xl bg-slate-900/20 border border-slate-850/50 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100">Plano Gratuito</h3>
                  <p className="text-xs text-slate-400">O básico essencial de recolocação.</p>
                </div>
                <span className="text-2xl font-black text-slate-200 font-display shrink-0 whitespace-nowrap">Grátis</span>
              </div>
              
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-slate-400" /> Dashboard de candidaturas
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-slate-400" /> Cadastro básico de currículo
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-slate-400" /> Score de Match semântico básico
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-slate-400" /> Acesso limitado ao Coach IA
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              Começar agora
            </button>
          </div>

          {/* Premium Plan */}
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-brand-500/30 flex flex-col justify-between space-y-8 relative shadow-lg shadow-brand-500/5">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[9px] font-bold uppercase tracking-wider">
              Recomendado
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100">Plano Premium</h3>
                  <p className="text-xs text-brand-300">Ferramentas avançadas para acelerar o processo.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-slate-200 font-display whitespace-nowrap">R$ 29</span>
                  <span className="text-[10px] text-slate-400 block">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-400 shrink-0" /> Passe mais confiança nas entrevistas com simulações ilimitadas.
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-400 shrink-0" /> Receba orientação personalizada para cada candidatura.
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-400 shrink-0" /> Análises e otimizações ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-brand-400 shrink-0" /> Integração profunda e relatórios semanais
                </li>
              </ul>
            </div>

            <button 
              onClick={() => onNavigateToAuth('signup')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-500/10 cursor-pointer"
            >
              Assinar Premium
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-10 px-6 max-w-3xl mx-auto relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Dúvidas</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">Perguntas Frequentes</p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-slate-850/60 rounded-xl bg-slate-900/10 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4.5 px-5 flex items-center justify-between text-left text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer select-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={14} className="text-brand-400 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-400' : ''}`} 
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
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-850/30">
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

      {/* CTA Final */}
      <section className="py-12 px-6 text-center max-w-3xl mx-auto relative z-10 space-y-6">
        <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-display">
            Sua próxima oportunidade <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">começa hoje</span>.
          </h2>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400 font-bold text-sm select-none">
            Você já tem o talento. A Talenta mostra o caminho.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto pt-2">
            Pare de enviar currículos no escuro. Descubra exatamente como otimizar seus materiais e treinar com IA para conquistar a vaga certa.
          </p>
        </div>

        <button 
          onClick={() => onNavigateToAuth('signup')}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-brand-500/25 hover:scale-[1.02] inline-flex items-center gap-2.5 cursor-pointer"
        >
          Começar gratuitamente
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-12 px-6 relative z-10 transition-colors">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <TalentaLogo className="h-8" showText={true} />
            <p className="text-[10px] text-slate-550 leading-relaxed">
              Transformando talento em oportunidades reais através de Inteligência Artificial avançada.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4">Produto</h4>
            <ul className="space-y-2 text-[10px] text-slate-550">
              <li><a href="#como-funciona" className="hover:text-slate-300">Como funciona</a></li>
              <li><a href="#comparacao" className="hover:text-slate-300">Comparativo</a></li>
              <li><a href="#beneficios" className="hover:text-slate-300">Benefícios</a></li>
              <li><a href="#planos" className="hover:text-slate-300">Preços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 mb-4">Legal</h4>
            <ul className="space-y-2 text-[10px] text-slate-550">
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">Termos de Uso</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">Privacidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4">Contato</h4>
            <p className="text-[10px] text-slate-550">suporte@talenta.ai</p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-slate-550 hover:text-slate-300 transition-colors"><Layers size={14} /></a>
              <a href="#" className="text-slate-550 hover:text-slate-300 transition-colors"><Zap size={14} /></a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-900/50 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-[9.5px] text-slate-550 gap-4">
          <span>© 2026 Talenta AI. Todos os direitos reservados.</span>
          <span className="text-slate-550">Transformando talento em oportunidades para profissionais de todas as áreas.</span>
        </div>
      </footer>
    </div>
  );
}
