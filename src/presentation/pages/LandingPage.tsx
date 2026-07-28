import { useState } from 'react';
import { 
  Search, 
  ArrowRight,
  Sparkles,
  Check,
  ScanSearch,
  BriefcaseBusiness,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Target,
  Activity
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
      q: 'O Vocentro é gratuito para os candidatos?',
      a: 'Sim! Você pode criar sua conta gratuitamente no Vocentro para analisar seu currículo, buscar vagas e testar a Inteligência Artificial sem necessidade de cartão de crédito.'
    },
    {
      q: 'Por que preciso fazer login com o Google?',
      a: 'O login com o Google no Vocentro serve única e exclusivamente para autenticação rápida e segura do usuário. Ele evita que você precise memorizar senhas adicionais e permite identificar seu perfil de candidato de forma automática.'
    },
    {
      q: 'O Vocentro acessa meu Gmail ou meus arquivos do Google Drive?',
      a: 'NUNCA. O Vocentro solicita apenas os escopos públicos de perfil (seu nome e e-mail). Não lemos nem enviamos e-mails, e não temos nenhum acesso ao seu Google Drive, Agenda, Fotos ou Contatos.'
    },
    {
      q: 'Como funciona o cálculo de Match ATS do currículo?',
      a: 'Nossa inteligência artificial analisa o formato do seu currículo e compara com os requisitos técnicos das vagas, indicando termos-chave do método STAR aprovados por robôs de RH.'
    },
    {
      q: 'Como posso excluir minha conta e meus dados?',
      a: 'Você pode solicitar a exclusão permanente de sua conta e dados a qualquer momento enviando um e-mail para suporte@vocentro.com.br. Todos os seus registros serão removidos definitivamente em até 48h.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://vocentro.com.br/#organization',
        name: 'Vocentro',
        url: 'https://vocentro.com.br',
        logo: 'https://vocentro.com.br/vocentro_logo.svg',
        email: 'suporte@vocentro.com.br',
        description: 'Plataforma de Gestão de Carreira com Inteligência Artificial.'
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://vocentro.com.br/#application',
        name: 'Vocentro',
        operatingSystem: 'Web',
        applicationCategory: 'BusinessApplication',
        description: 'Plataforma para análise de currículo, ATS, organização de candidaturas e preparação para entrevistas utilizando Inteligência Artificial.',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'BRL'
        }
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://vocentro.com.br/#faq',
        mainEntity: faqData.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a
          }
        }))
      }
    ]
  };

  const navigateToRoute = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#020617] dark:bg-[#020617] light:bg-slate-50 text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 font-sans relative selection:bg-blue-500/30 selection:text-white transition-colors duration-200">
      
      {/* Schema JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* ── HEADER / NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#020617]/90 dark:bg-[#020617]/90 light:bg-white/95 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between px-4 sm:px-6 z-50 transition-colors">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <VocentroLogo className="h-7" showText={true} />
        </div>

        <nav className="hidden lg:flex items-center gap-5" aria-label="Navegação Principal">
          <a href="#funcionalidades" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Funcionalidades</a>
          <a href="#fluxo" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Como Funciona</a>
          <a href="#google-login-use" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Login Google</a>
          <a href="#quem-pode" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Quem Pode Usar</a>
          <a href="#sobre" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Sobre</a>
          <a href="#seguranca" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Segurança</a>
          <a href="#planos" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors">Planos</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-bold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors cursor-pointer px-3 py-2"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-600 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Criar conta
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main id="main-content" className="w-full pt-16">

        {/* ── 1. HERO SECTION (Item 1 & 5) ── */}
        <section className="py-16 sm:py-20 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Lado Esquerdo: Textos & Propósito Explicito */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] text-xs font-bold font-mono">
                <Sparkles size={14} />
                <span>Vocentro — Gestão de Carreira com IA</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black font-display tracking-tight text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 leading-[1.2]">
                Ferramenta de gestão de carreira com Inteligência Artificial para análise de currículo, compatibilidade ATS, organização de candidaturas e preparação para entrevistas.
              </h1>

              <h2 className="text-base sm:text-lg text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed font-medium">
                O Vocentro ajuda candidatos a encontrarem vagas compatíveis, melhorarem seus currículos e se prepararem para processos seletivos utilizando Inteligência Artificial.
              </h2>

              {/* Lista de Recursos Principais Acima da Dobra */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {[
                  'Organizar candidaturas',
                  'Analisar currículo',
                  'Comparar currículo com vagas ATS',
                  'Gerar melhorias utilizando IA',
                  'Preparar entrevistas',
                  'Acompanhar processos seletivos'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                    <CheckCircle2 size={15} className="text-[#22C55E] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4 pt-3">
                <button
                  onClick={() => onNavigateToAuth('signup')}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-[#3B82F6] hover:bg-blue-600 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <span>Criar Conta Gratuita</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#fluxo"
                  className="px-6 py-3.5 text-sm font-bold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white bg-[#0F172A] dark:bg-[#0F172A] light:bg-white hover:bg-[#172554] border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Ver Como Funciona</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-sans pt-1">
                🔒 <strong>Uso do Google OAuth:</strong> Utilizado apenas para autenticar sua conta de forma segura com seu nome, e-mail e foto. Não acessamos e-mails ou arquivos privados.
              </p>
            </div>

            {/* Lado Direito: SaaS Product Mockup */}
            <div className="lg:col-span-6">
              <HeroProductMockup onSimulateClick={() => onNavigateToAuth('signup')} />
            </div>

          </div>
        </section>

        {/* ── 2. O QUE VOCÊ PODE FAZER (Item 6 - Cards Grandes) ── */}
        <section id="funcionalidades" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">Recursos Completos</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              O que você pode fazer no Vocentro
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              Tudo o que você precisa para acelerar seu desenvolvimento profissional em um só lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Search, title: 'Encontrar vagas', desc: 'Busca inteligente de oportunidades alinhadas ao seu histórico e senioridade.' },
              { icon: BriefcaseBusiness, title: 'Organizar candidaturas', desc: 'Kanban visual para acompanhar cada etapa dos seus processos seletivos.' },
              { icon: FileText, title: 'Analisar currículo', desc: 'Mapeamento detalhado de competências técnicas e nível de experiência.' },
              { icon: ScanSearch, title: 'Melhorar currículo', desc: 'Reescrita orientada a palavras-chave para robôs de triagem de RH.' },
              { icon: Sparkles, title: 'Simular entrevistas', desc: 'Coach interativo que faz perguntas comportamentais e avalia suas respostas.' },
              { icon: Activity, title: 'Calcular Match ATS', desc: 'Pontuação percentual de afinidade entre seu currículo e a vaga desejada.' },
              { icon: CheckCircle2, title: 'Criar respostas STAR', desc: 'Estruturação de histórias profissionais no método aprovado por recrutadores.' },
              { icon: Target, title: 'Acompanhar progresso', desc: 'Indicadores e metas semanais para você nunca perder uma oportunidade.' }
            ].map((card, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3 hover:border-blue-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center">
                  <card.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">{card.title}</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. FLUXO DA PLATAFORMA (Item 4 - Passo a Passo 1 ao 6) ── */}
        <section id="fluxo" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#22C55E]">Passo a Passo</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Fluxo da plataforma Vocentro
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              Veja como o aplicativo conduz seu desenvolvimento desde o cadastro até a aprovação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
            {[
              { step: '1', title: 'Login com Google', desc: 'Autenticação rápida e segura sem senha.' },
              { step: '2', title: 'Criamos seu perfil', desc: 'Identificação inicial do candidato.' },
              { step: '3', title: 'Você envia o currículo', desc: 'Upload do documento PDF/Word.' },
              { step: '4', title: 'Seleciona uma vaga', desc: 'Escolha da vaga de interesse.' },
              { step: '5', title: 'A IA analisa o Match', desc: 'Cálculo de compatibilidade ATS.' },
              { step: '6', title: 'Recebe melhorias', desc: 'Otimização e simulador de treino.' }
            ].map((st, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm flex flex-col justify-between space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#3B82F6] font-mono font-bold text-sm flex items-center justify-center">
                    {st.step}
                  </span>
                  {idx < 5 && (
                    <ArrowRight className="hidden lg:block text-slate-600 dark:text-slate-600 light:text-slate-300" size={16} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 mb-1">{st.title}</h3>
                  <p className="text-[11px] text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. COMO O LOGIN COM GOOGLE É UTILIZADO (Item 2 + Supplementary) ── */}
        <section id="google-login-use" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="p-8 rounded-3xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 max-w-5xl mx-auto space-y-8 shadow-sm">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
                    Como o Login com Google é utilizado
                  </h2>
                  <p className="text-xs text-[#3B82F6] font-bold">Por que utilizar sua conta Google?</p>
                </div>
              </div>

              <button 
                onClick={() => navigateToRoute('/how-google-login-works')}
                className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver guia completo de permissões</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Texto Oficial Explicativo */}
            <div className="p-5 rounded-2xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 leading-relaxed text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p>
                O login com Google é utilizado apenas para autenticar sua conta com segurança. Caso você autorize, o Vocentro poderá acessar apenas seu endereço de e-mail básico e seu nome para criar seu perfil automaticamente.
              </p>
              <p className="mt-2 font-medium">
                Nenhum e-mail é enviado. Nenhum arquivo do Google Drive é acessado. Nenhuma informação da conta é compartilhada.
              </p>
            </div>

            {/* Grid de Ícones Visuais Explicitos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#22C55E] shrink-0" />
                <span className="text-xs font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800">Apenas autenticação</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#22C55E] shrink-0" />
                <span className="text-xs font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800">Nome básico</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#22C55E] shrink-0" />
                <span className="text-xs font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800">E-mail básico</span>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-500/10 light:bg-red-50 border border-red-500/30 flex items-center gap-3">
                <XCircle size={20} className="text-red-400 shrink-0" />
                <span className="text-xs font-bold text-red-300 dark:text-red-300 light:text-red-800">Sem acesso ao Gmail</span>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-500/10 light:bg-red-50 border border-red-500/30 flex items-center gap-3">
                <XCircle size={20} className="text-red-400 shrink-0" />
                <span className="text-xs font-bold text-red-300 dark:text-red-300 light:text-red-800">Sem acesso ao Google Drive</span>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-500/10 light:bg-red-50 border border-red-500/30 flex items-center gap-3">
                <XCircle size={20} className="text-red-400 shrink-0" />
                <span className="text-xs font-bold text-red-300 dark:text-red-300 light:text-red-800">Sem compartilhamento de dados</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── 5. COMO COMEÇAR (Supplementary Item) ── */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">Início Rápido</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Como começar no Vocentro
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              Comece a otimizar sua carreira em menos de 2 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-500/20 text-[#3B82F6] font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Faça Login Seguro</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Entre com sua conta Google ou cadastre-se com e-mail e senha.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-500/20 text-[#3B82F6] font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Envie seu Currículo</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Faça o upload do seu PDF para que nossa IA leia e mapeie suas experiências.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-500/20 text-[#3B82F6] font-bold text-xs flex items-center justify-center">3</span>
              <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Evolua na Carreira</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Calcule seu Match ATS, ajuste seu currículo e treine para suas entrevistas.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. COMO SEUS DADOS SÃO UTILIZADOS (Item 3) ── */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="p-8 rounded-3xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 max-w-4xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
                Como seus dados são utilizados
              </h2>
            </div>

            <div className="space-y-3 font-sans">
              {[
                'Seu currículo é utilizado apenas para análises de compatibilidade.',
                'As vagas são utilizadas para calcular o Match ATS.',
                'Os dados permanecem estritamente privados.',
                'Você pode excluir sua conta e seus dados a qualquer momento.',
                'Nenhum dado do usuário é vendido ou compartilhado com terceiros.'
              ].map((point, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-3">
                  <Check size={18} className="text-[#22C55E] shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-200 dark:text-slate-200 light:text-slate-800 font-medium">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. QUEM PODE UTILIZAR (Item 7) ── */}
        <section id="quem-pode" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="p-8 rounded-3xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 max-w-4xl mx-auto space-y-4 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Quem pode utilizar o Vocentro
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 max-w-2xl mx-auto leading-relaxed">
              O Vocentro foi desenvolvido para candidatos em busca de oportunidades profissionais, estudantes, profissionais em transição de carreira e pessoas que desejam melhorar sua preparação para processos seletivos.
            </p>
          </div>
        </section>

        {/* ── 8. SOBRE O VOCENTRO (Item 8) ── */}
        <section id="sobre" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="p-8 rounded-3xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 max-w-4xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
                Sobre o Vocentro
              </h2>
              <button 
                onClick={() => navigateToRoute('/about')}
                className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Página institucional detalhada</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed font-sans">
              <p>
                <strong>Desenvolvedor & Mantenedor:</strong> O Vocentro é desenvolvido e mantido pela empresa <strong>Vocentro Tecnologia</strong>.
              </p>
              <p>
                <strong>Finalidade:</strong> O aplicativo é uma plataforma completa de Inteligência Artificial para gestão de carreira, análise de currículo ATS, recomendação de vagas e simulação de entrevistas.
              </p>
              <p className="p-4 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs">
                ℹ️ <strong>Aviso de Afiliação:</strong> O Vocentro não possui qualquer afiliação direta ou patrocínio pela Google LLC. Apenas utilizamos o protocolo aberto de autenticação Google OAuth 2.0 para permitir o acesso seguro de nossos usuários.
              </p>
            </div>
          </div>
        </section>

        {/* ── 9. SEGURANÇA E PRIVACIDADE DE DADOS (Item 9) ── */}
        <section id="seguranca" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="p-8 rounded-3xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 max-w-4xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
              <ShieldCheck size={24} className="text-[#22C55E]" />
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
                Segurança e Compromisso de Privacidade
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 text-emerald-300 dark:text-emerald-300 light:text-emerald-900 text-xs sm:text-sm font-medium leading-relaxed space-y-2">
              <p className="font-bold text-sm">O Vocentro utiliza autenticação Google apenas para identificar o usuário.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <span>✕ Não lemos e-mails.</span>
                <span>✕ Não enviamos e-mails.</span>
                <span>✕ Não acessamos Google Drive.</span>
                <span>✕ Não acessamos Agenda.</span>
                <span>✕ Não acessamos Fotos.</span>
                <span>✕ Não acessamos contatos.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. PLANOS ── */}
        <section id="planos" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Planos acessíveis para sua carreira
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              Comece gratuitamente ou evolua com recursos avançados de inteligência artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plano Gratuito */}
            <div className="p-8 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Gratuito</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">R$ 0</span>
                  <span className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600">/mês</span>
                </div>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600">Ideal para iniciar a organização de candidaturas e testar o Match Score.</p>
                <ul className="space-y-2.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 pt-2">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#22C55E]" /> Análise de currículo básica
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#22C55E]" /> Busca de vagas compatíveis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#22C55E]" /> Dashboard Kanban de candidaturas
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 text-xs font-bold text-white bg-slate-800 dark:bg-slate-800 light:bg-slate-900 hover:bg-[#172554] rounded-xl transition-colors cursor-pointer"
              >
                Começar Grátis
              </button>
            </div>

            {/* Plano Pro */}
            <div className="p-8 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border-2 border-[#3B82F6] space-y-6 flex flex-col justify-between relative overflow-hidden shadow-md">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#3B82F6] text-[10px] font-bold uppercase font-mono">
                Recomendado
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">R$ 29</span>
                  <span className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600">/mês</span>
                </div>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600">Acelerador completo de carreira com Coach IA ilimitado e otimização ATS.</p>
                <ul className="space-y-2.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 pt-2">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#22C55E]" /> Tudo do plano Gratuito
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#22C55E]" /> Otimização ATS em método STAR
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#22C55E]" /> Simulador de entrevistas ilimitado
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-600 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Assinar Plano Pro
              </button>
            </div>
          </div>
        </section>

        {/* ── 11. FAQ ── */}
        <section id="faq" className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Perguntas Frequentes
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">Esclareça suas dúvidas sobre a plataforma Vocentro.</p>
          </div>

          <div className="space-y-3">
            {faqData.map((item, index) => (
              <div key={index} className="rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 flex justify-between items-center hover:bg-[#172554] dark:hover:bg-[#172554] light:hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-expanded={activeFaq === index}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`transition-transform ${activeFaq === index ? 'rotate-180 text-[#3B82F6]' : 'text-slate-400'}`} />
                </button>
                {activeFaq === index && (
                  <div className="p-4 pt-0 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed border-t border-slate-800/50 dark:border-slate-800/50 light:border-slate-200">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── 12. RODAPÉ COMPLETO (Item 10) ── */}
      <footer className="border-t border-slate-800 dark:border-slate-800 light:border-slate-200 bg-[#020617] dark:bg-[#020617] light:bg-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <VocentroLogo className="h-6" showText={true} />
            <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed">
              Vocentro é uma plataforma de gestão e desenvolvimento de carreira com Inteligência Artificial.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Plataforma</h4>
            <ul className="space-y-1.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              <li><a href="#funcionalidades" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">O que você pode fazer</a></li>
              <li><a href="#fluxo" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Fluxo da Plataforma</a></li>
              <li><a href="#quem-pode" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Quem Pode Usar</a></li>
              <li><a href="#planos" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Planos</a></li>
              <li>
                <button
                  onClick={() => navigateToRoute('/faq')}
                  className="text-[#3B82F6] font-bold hover:underline cursor-pointer"
                >
                  Central de Ajuda & FAQ
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Transparência & OAuth</h4>
            <ul className="space-y-1.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              <li>
                <button
                  onClick={() => navigateToRoute('/politica-de-privacidade')}
                  className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/termos-de-uso')}
                  className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/how-google-login-works')}
                  className="text-[#3B82F6] font-bold hover:underline cursor-pointer"
                >
                  Como o Login Google Funciona
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/about')}
                  className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Sobre o Vocentro (/about)
                </button>
              </li>
              <li>
                <a
                  href="mailto:suporte@vocentro.com.br?subject=Solicitacao%20de%20Exclusao%20de%20Conta"
                  className="text-red-400 hover:underline cursor-pointer font-semibold"
                >
                  Exclusão de Conta & Dados
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Suporte & Empresa</h4>
            <ul className="space-y-1.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              <li><span className="font-semibold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Empresa:</span> Vocentro Tecnologia</li>
              <li><span className="font-semibold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Contato:</span> suporte@vocentro.com.br</li>
              <li><a href="mailto:suporte@vocentro.com.br" className="text-[#3B82F6] hover:underline">Falar com Suporte</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600">
          <p>© {new Date().getFullYear()} Vocentro Tecnologia. Todos os direitos reservados.</p>
          <p className="font-mono text-[11px]">Vocentro OAuth 2.0 Verified • WCAG AA Compliant</p>
        </div>
      </footer>

    </div>
  );
}
