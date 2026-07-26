import { useState } from 'react';
import { 
  FileText, 
  Search, 
  MessagesSquare, 
  Trophy, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  Sparkles,
  Check,
  UserCheck,
  Mail,
  CheckSquare,
  Target,
  ScanSearch,
  BriefcaseBusiness,
  Crown
} from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';
import { HeroProductMockup } from '../components/HeroProductMockup';
import { 
  FeatureIcon, 
  StepIcon, 
  SecurityIcon 
} from '../components/ds/VdsIcons';

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
      a: 'Sim, totalmente. Seus dados profissionais, currículos e histórico de simulações são criptografados de ponta a ponta e armazenados de acordo com as diretrizes da LGPD/GDPR.'
    },
    {
      q: 'Por que o Vocentro utiliza o login do Google?',
      a: 'O login com o Google no Vocentro serve única e exclusivamente para autenticação rápida e segura do usuário. O Vocentro não lê nem possui acesso a e-mails do Gmail ou arquivos do Drive.'
    },
    {
      q: 'A Inteligência Artificial realmente melhora meu currículo?',
      a: 'Sim. Nosso motor semântico analisa a descrição da vaga desejada, identificando termos técnicos relevantes e sugerindo adaptações no padrão STAR (Situação, Tarefa, Ação, Resultado) para aprovação em robôs de RH (ATS).'
    },
    {
      q: 'Posso cancelar o plano Premium quando quiser?',
      a: 'Sim. O plano Premium pode ser cancelado a qualquer momento com apenas um clique em seu painel de faturamento, sem contratos de fidelidade.'
    },
    {
      q: 'Como funciona o Match de Vagas?',
      a: 'Realizamos uma análise de afinidade semântica tridimensional comparando requisitos técnicos, competências comportamentais e senioridade, indicando um Match Score percentual de compatibilidade.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-800 font-sans relative selection:bg-brand-500/30 selection:text-white transition-colors duration-300">
      
      {/* ── HEADER / NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/95 backdrop-blur-md border-b border-slate-900 dark:border-slate-900 light:border-slate-200 flex items-center justify-between px-6 z-50">
        <VocentroLogo className="h-7 text-white dark:text-white light:text-slate-900" showText={true} />
        
        <nav className="hidden md:flex items-center gap-4" aria-label="Navegação Principal">
          <a href="#beneficios" className="text-xs font-semibold text-slate-200 hover:text-white transition-colors py-1.5 px-2 min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-md">Benefícios</a>
          <a href="#como-funciona" className="text-xs font-semibold text-slate-200 hover:text-white transition-colors py-1.5 px-2 min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-md">Como funciona</a>
          <a href="#recursos" className="text-xs font-semibold text-slate-200 hover:text-white transition-colors py-1.5 px-2 min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-md">Recursos</a>
          <a href="#planos" className="text-xs font-semibold text-slate-200 hover:text-white transition-colors py-1.5 px-2 min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-md">Planos</a>
          <a href="#faq" className="text-xs font-semibold text-slate-200 hover:text-white transition-colors py-1.5 px-2 min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-md">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer px-3 py-1.5 min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-lg"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-sm cursor-pointer min-h-[36px] inline-flex items-center focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            Começar gratuitamente
          </button>
        </div>
      </header>

      {/* ── MAIN LANDMARK FOR ACCESSIBILITY ── */}
      <main id="main-content" className="w-full">

        {/* ── 1. HERO SECTION ── */}
        <section className="pt-20 pb-8 px-6 max-w-7xl mx-auto z-10 w-full font-sans">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-5 flex flex-col items-start gap-4 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-bold uppercase font-mono">
                <Sparkles size={11} /> Vocentro | Inteligência Artificial para Carreiras
              </span>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-display">
                Vocentro
              </h1>

              <h2 className="text-base sm:text-lg font-bold text-brand-300 font-display leading-snug">
                Encontre vagas compatíveis, aumente seu Match Score e prepare-se para entrevistas com IA.
              </h2>
              
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
                O Vocentro é uma plataforma de carreira que utiliza IA para ajudar profissionais a encontrar vagas, otimizar currículos para robôs ATS, simular entrevistas e acompanhar candidaturas em um só lugar.
              </p>

              {/* CTA Principal */}
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button 
                  onClick={() => onNavigateToAuth('signup')}
                  className="h-12 px-7 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 cursor-pointer min-h-[44px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  Começar gratuitamente
                  <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => onNavigateToAuth('login')}
                  className="h-12 px-5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  Entrar
                </button>
              </div>

              {/* Indicadores Técnicos Comprovados */}
              <div className="w-full pt-3 border-t border-slate-900 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-brand-300 font-mono text-[11px] font-bold">
                  <BriefcaseBusiness size={13} className="text-brand-400" /> 21 conectores de vagas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-[11px] font-bold">
                  <Check size={13} className="text-emerald-400" /> 17 provedores ativos
                </span>
              </div>
            </div>

            {/* Right Hero - Product Mockup LCP */}
            <div className="lg:col-span-7 flex justify-center w-full">
              <HeroProductMockup onSimulateClick={() => onNavigateToAuth('signup')} />
            </div>

          </div>
        </section>

        {/* ── 2. BENEFÍCIOS (SOBRE O VOCENTRO) ── */}
        <section id="beneficios" className="py-8 px-6 max-w-5xl mx-auto z-10 w-full font-sans">
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col items-center gap-1 text-center max-w-2xl mx-auto">
              <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-bold uppercase font-mono">
                Benefícios & Institucional
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                Sobre o Vocentro
              </h2>
            </div>

            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 max-w-4xl mx-auto font-normal">
              <p>
                O <strong>Vocentro</strong> é uma plataforma de desenvolvimento profissional e apoio à carreira projetada para otimizar e estruturar toda a jornada de busca por oportunidades de trabalho. Utilizando tecnologia de Inteligência Artificial semântica, o Vocentro atua como uma central inteligente de gestão de candidaturas para trabalhadores e profissionais de diferentes áreas de atuação.
              </p>
              <p>
                A aplicação permite que o candidato cadastre seu perfil e faça upload do seu currículo profissional em formato PDF. A partir dessas informações, o motor de IA analisa a compatibilidade entre as experiências do usuário e os requisitos das vagas cadastradas, calculando um <strong>Match Score</strong> percentual de afinidade e identificando pontos fortes e lacunas técnicas.
              </p>
              <p>
                O Vocentro oferece também otimização de currículo para sistemas de triagem automáticos de RH (ATS) no método STAR (Situação, Tarefa, Ação, Resultado), simulador interativo de entrevistas conduzido pela Recrutadora IA e painel Kanban para acompanhamento de candidaturas ativas.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-3">
                <SecurityIcon size={18} />
                <div className="space-y-0.5">
                  <strong className="text-white block">Ferramenta de Apoio ao Candidato:</strong>
                  <p>
                    O Vocentro opera exclusivamente como ferramenta consultiva de orientação. O Vocentro <strong>não</strong> publica vagas automaticamente em portais externos e <strong>não</strong> envia currículos a empresas sem a ação explícita do usuário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. COMO FUNCIONA ── */}
        <section id="como-funciona" className="py-8 px-6 max-w-7xl mx-auto z-10 w-full">
          <div className="flex flex-col items-center gap-1 text-center max-w-2xl mx-auto mb-6">
            <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-bold uppercase font-mono">
              Metodologia
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Como funciona o Vocentro
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-lg">
              Um fluxo visual integrado em seis etapas para transformar sua busca de vagas em aprovação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-6xl mx-auto font-sans">
            {[
              { step: '01', title: 'Cadastrar', desc: 'Crie sua conta no Vocentro de forma rápida utilizando sua Conta Google ou e-mail.', icon: UserCheck },
              { step: '02', title: 'Enviar currículo', desc: 'Suba seu arquivo original em PDF para estruturação do seu perfil de competências.', icon: FileText },
              { step: '03', title: 'Encontrar vagas', desc: 'Mapeie oportunidades de trabalho alinhadas ao seu objetivo em múltiplos portais.', icon: Search },
              { step: '04', title: 'Receber análises', desc: 'Visualize seu Match Score percentual de afinidade e diagnóstico de lacunas técnicas.', icon: Trophy },
              { step: '05', title: 'Preparar entrevistas', desc: 'Simule entrevistas reais no método STAR com a Recrutadora IA e receba feedback em tempo real.', icon: MessagesSquare },
              { step: '06', title: 'Acompanhar candidaturas', desc: 'Gerencie todo o seu pipeline de processos seletivos em um painel Kanban intuitivo.', icon: CheckSquare }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <StepIcon icon={item.icon} size={18} />
                    <span className="text-base font-black text-slate-400 font-mono">{item.step}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white font-display mb-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. RECURSOS DA PLATAFORMA ── */}
        <section id="recursos" className="py-8 px-6 max-w-7xl mx-auto z-10 w-full">
          <div className="flex flex-col items-center gap-1 text-center max-w-2xl mx-auto mb-6">
            <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-bold uppercase font-mono">
              Recursos Essenciais
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Recursos da Plataforma
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-lg">
              As quatro ferramentas de Inteligência Artificial focadas na sua aceleração profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-6xl mx-auto font-sans">
            {[
              { title: 'Busca Inteligente de Vagas', desc: 'Mapeamento automatizado de oportunidades alinhadas ao seu perfil em múltiplos portais.', icon: Search },
              { title: 'Match Score Semântico', desc: 'Análise semântica de afinidade com nota percentual de compatibilidade e diagnóstico de lacunas.', icon: Target },
              { title: 'Otimização ATS (Método STAR)', desc: 'Reescrita estratégica de experiências com foco em aprovação por robôs de triagem de RH.', icon: ScanSearch },
              { title: 'Simulador de Entrevistas com IA', desc: 'Treine perguntas reais do seu cargo por chat com a Recrutadora IA e receba feedback imediato.', icon: MessagesSquare }
            ].map((feature, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between shadow-xs space-y-2.5">
                <FeatureIcon icon={feature.icon} size={20} />
                <div>
                  <h3 className="text-xs font-bold text-white font-display mb-1">{feature.title}</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. PLANOS & PREÇOS ── */}
        <section id="planos" className="py-8 px-6 max-w-5xl mx-auto z-10 space-y-6 w-full">
          <div className="flex flex-col items-center gap-1 text-center max-w-2xl mx-auto font-sans">
            <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-bold uppercase font-mono">
              Planos
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Planos para cada momento de carreira
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto font-sans">
            {/* Plano Gratuito */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Plano Gratuito</h3>
                    <p className="text-[11px] text-slate-300">Para iniciar sua busca e testar a plataforma</p>
                  </div>
                  <span className="text-2xl font-black text-white font-display">R$ 0</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed font-medium">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Cadastro de perfil profissional</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Leitura e parsing de currículo PDF</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Busca básica de vagas e Match Score</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> 1 simulação de entrevista com Recrutadora IA</li>
                </ul>
              </div>

              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-900 text-slate-200 font-bold text-xs transition-colors cursor-pointer min-h-[40px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                Criar Conta Grátis
              </button>
            </div>

            {/* Plano Premium */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border-2 border-brand-500 shadow-xl shadow-brand-500/10 flex flex-col justify-between space-y-4 relative">
              <div className="absolute -top-3 left-5 bg-brand-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 shadow-md">
                <Crown size={10} /> Mais escolhido
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Plano Premium</h3>
                    <p className="text-[11px] text-brand-300 font-semibold">Aceleração completa com IA ilimitada</p>
                  </div>
                  <div className="text-right shrink-0 font-display">
                    <span className="text-2xl font-black text-white">R$ 29</span>
                    <span className="text-[9px] text-slate-300 block font-sans font-semibold">/mês</span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-100 leading-relaxed font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Simulações ilimitadas com Recrutadora IA</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Otimizador ATS ilimitado no método STAR</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Ingestão automática de vagas parceiras</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0 font-bold" /> Cartas de apresentação personalizadas ilimitadas</li>
                </ul>
              </div>

              <button 
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer min-h-[40px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                Aderir ao Premium
              </button>
            </div>
          </div>
        </section>

        {/* ── 6. FAQ (PERGUNTAS FREQUENTES) ── */}
        <section id="faq" className="py-8 px-6 max-w-3xl mx-auto z-10 space-y-5 w-full">
          <div className="flex flex-col items-center gap-1 text-center max-w-2xl mx-auto font-sans">
            <span className="px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-bold uppercase font-mono">
              Dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-2 w-full">
            {faqData.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full py-3.5 px-4 flex items-center justify-between text-left text-xs font-bold text-slate-100 hover:text-white transition-colors cursor-pointer select-none gap-3 min-h-[40px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <span className="flex items-center gap-2 font-sans">
                      <HelpCircle size={14} className="text-brand-300 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-300' : ''}`} 
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-[11px] text-slate-200 leading-relaxed border-t border-slate-800/60 font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* ── 7. FOOTER (RODAPÉ INSTITUCIONAL) ── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-2">
            <VocentroLogo className="h-7 text-white" showText={true} />
            <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-xs">
              O Vocentro é uma plataforma de desenvolvimento profissional e apoio à carreira com inteligência artificial.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Links Institucionais</h3>
            <ul className="space-y-1 text-xs text-slate-300 font-medium font-sans">
              <li><a href="/google-auth" className="hover:text-white transition-colors py-1 min-h-[32px] inline-flex items-center">Autenticação Google</a></li>
              <li><a href="/about.html" className="hover:text-white transition-colors py-1 min-h-[32px] inline-flex items-center">Sobre o Vocentro</a></li>
              <li><a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors py-1 min-h-[32px] inline-flex items-center">Política de Privacidade</a></li>
              <li><a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors py-1 min-h-[32px] inline-flex items-center">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Contato & Suporte</h3>
            <ul className="space-y-1 text-xs text-slate-300 font-medium font-sans">
              <li>
                <a href="mailto:suporte@vocentro.com.br" className="hover:text-white transition-colors py-1 min-h-[32px] inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-brand-300" />
                  suporte@vocentro.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2 font-sans">
          <span>© 2026 Vocentro. Todos os direitos reservados.</span>
          <span>Plataforma inteligente para desenvolvimento profissional.</span>
        </div>
      </footer>

    </div>
  );
}
