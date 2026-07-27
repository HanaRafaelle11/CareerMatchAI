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
  CheckCircle2
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
      a: 'Sim! Você pode criar sua conta gratuitamente no Vocentro para analisar seu currículo, buscar vagas e testar a Inteligência Artificial sem cartão de crédito.'
    },
    {
      q: 'O login com o Google é obrigatório?',
      a: 'Não. O login com o Google é 100% opcional no Vocentro. Você pode se cadastrar normalmente utilizando e-mail e senha, mantendo total flexibilidade.'
    },
    {
      q: 'Como funciona a análise ATS do currículo?',
      a: 'Nossa inteligência artificial analisa o formato do seu currículo e compara com os requisitos técnicos das vagas, indicando termos chave do método STAR aprovados por robôs de RH.'
    },
    {
      q: 'Meus dados estão seguros no Vocentro?',
      a: 'Sim. Seus dados cadastrais e documentos são criptografados de ponta a ponta. Não acessamos e-mails privados nem compartilhamos seus dados com terceiros sem sua permissão.'
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
        description: 'Plataforma de inteligência de carreira e preparação profissional com Inteligência Artificial.'
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://vocentro.com.br/#application',
        name: 'Vocentro',
        operatingSystem: 'Web',
        applicationCategory: 'BusinessApplication',
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

  return (
    <div className="min-h-screen bg-[#020617] dark:bg-[#020617] light:bg-slate-50 text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 font-sans relative selection:bg-blue-500/30 selection:text-white transition-colors duration-200">
      
      {/* Schema JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* ── HEADER / NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#020617]/90 dark:bg-[#020617]/90 light:bg-white/95 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between px-4 sm:px-6 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <VocentroLogo className="h-7" showText={true} />
        </div>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação Principal">
          <a href="#o-que-e" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">O que é</a>
          <a href="#beneficios" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">Benefícios</a>
          <a href="#como-funciona" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">Como funciona</a>
          <a href="#google-auth" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">Segurança</a>
          <a href="#planos" className="text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">Planos</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-bold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-blue-600 transition-colors cursor-pointer px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-lg"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-600 rounded-xl transition-all shadow-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Criar conta
          </button>
        </div>
      </header>

      {/* ── MAIN LANDMARK FOR ACCESSIBILITY ── */}
      <main id="main-content" className="w-full pt-16">

        {/* ── 1. HERO SECTION ── */}
        <section className="py-20 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Lado Esquerdo: Textos & CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] text-xs font-bold font-mono">
                <Sparkles size={14} />
                <span>Vocentro — Plataforma de Carreira com IA</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 leading-[1.15]">
                <strong>Vocentro</strong> — Encontre vagas melhores.<br />
                <span className="bg-gradient-to-r from-[#3B82F6] to-[#22C55E] bg-clip-text text-transparent">
                  Aumente suas chances com IA.
                </span>
              </h1>

              {/* Banner Institucional de Finalidade Explicita exigido pela Verificação do Google OAuth */}
              <div className="p-5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 text-xs sm:text-sm space-y-3 shadow-md">
                <h2 className="font-extrabold text-[#3B82F6] font-mono uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 border-b border-blue-500/20 pb-2">
                  📌 SOBRE O VOCENTRO &amp; USO DE DADOS GOOGLE
                </h2>
                
                <p className="text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed font-sans">
                  O <strong>Vocentro</strong> é uma plataforma completa de desenvolvimento profissional que utiliza Inteligência Artificial para ajudar candidatos a encontrar vagas, otimizar currículos para sistemas ATS, simular entrevistas de emprego e gerenciar candidaturas.
                </p>

                <div className="space-y-1.5 pt-1">
                  <p className="font-bold text-xs uppercase tracking-wider text-[#3B82F6]">Como utilizamos seus dados:</p>
                  <ul className="space-y-1 text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#3B82F6] font-bold">•</span>
                      <span><strong>Login Seguro:</strong> O login via Google é utilizado exclusivamente para autenticar seu acesso de forma rápida e criar seu perfil no Vocentro.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3B82F6] font-bold">•</span>
                      <span><strong>Dados Acessados:</strong> Solicitamos apenas suas informações públicas de perfil (Nome, E-mail e Foto de Avatar).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#22C55E] font-bold">•</span>
                      <span><strong>Privacidade Garantida:</strong> Não lemos, não acessamos e não armazenamos e-mails do seu Gmail, arquivos do Google Drive ou outros dados pessoais da sua conta Google.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => onNavigateToAuth('signup')}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-[#3B82F6] hover:bg-blue-600 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <span>Criar conta gratuitamente</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#como-funciona"
                  className="px-6 py-3.5 text-sm font-bold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 hover:text-white bg-[#0F172A] dark:bg-[#0F172A] light:bg-white hover:bg-[#172554] border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                >
                  <span>Ver como funciona</span>
                </a>
              </div>
            </div>

            {/* Lado Direito: SaaS Product Mockup */}
            <div className="lg:col-span-6">
              <HeroProductMockup onSimulateClick={() => onNavigateToAuth('signup')} />
            </div>

          </div>
        </section>

        {/* ── 2. O QUE É O VOCENTRO (App Purpose) ── */}
        <section id="o-que-e" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              O que é o Vocentro
            </h2>
            <p className="text-base text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed">
              O Vocentro é uma plataforma de desenvolvimento profissional que utiliza Inteligência Artificial para ajudar candidatos durante toda a jornada de busca por emprego.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
            <div className="p-5 rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Encontrar vagas compatíveis</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 mt-1">Busca inteligente de oportunidades alinhadas ao seu histórico.</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Analisar compatibilidade</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 mt-1">Cálculo de Match Score semântico de perfil técnico e comportamental.</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Melhorar currículos ATS</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 mt-1">Otimização de palavras-chave e padrão STAR aprovado por robôs de RH.</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Treinar para entrevistas</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 mt-1">Simulador de entrevistas interativo com feedback de IA em tempo real.</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Organizar candidaturas</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 mt-1">Kanban visual para acompanhar cada etapa do seu processo seletivo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. BENEFÍCIOS (4 Grandes Cards) ── */}
        <section id="beneficios" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Principais Benefícios
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              Tecnologia desenvolvida para simplificar cada fase do seu crescimento profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-[#172554] dark:hover:bg-[#172554] light:hover:bg-slate-50 transition-colors space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center">
                <Search size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Busca Inteligente de Vagas</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Reúna oportunidades reais dos principais portais em um único lugar, com cálculo automático de afinidade e senioridade.
              </p>
            </article>

            <article className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-[#172554] dark:hover:bg-[#172554] light:hover:bg-slate-50 transition-colors space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] flex items-center justify-center">
                <ScanSearch size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Otimização ATS & Método STAR</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Garanta que seu currículo passe pelos filtros automatizados dos recrutadores com frases de impacto e palavras-chave corretas.
              </p>
            </article>

            <article className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-[#172554] dark:hover:bg-[#172554] light:hover:bg-slate-50 transition-colors space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Simulador de Entrevistas</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Treine suas respostas para perguntas comportamentais com um Coach IA interativo que avalia sua fala e confiança.
              </p>
            </article>

            <article className="p-6 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-[#172554] dark:hover:bg-[#172554] light:hover:bg-slate-50 transition-colors space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <BriefcaseBusiness size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Dashboard de Candidaturas</h3>
              <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">
                Mantenha todas as suas candidaturas e convites para entrevista organizados em um funil claro e produtivo.
              </p>
            </article>
          </div>
        </section>

        {/* ── 4. COMO FUNCIONA (6 Etapas) ── */}
        <section id="como-funciona" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
              Como funciona o Vocentro
            </h2>
            <p className="text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              Acompanhe o passo a passo simplificado para impulsionar suas candidaturas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { num: '1', title: 'Envie seu Currículo', desc: 'Faça upload do seu currículo em PDF ou preencha suas experiências.' },
              { num: '2', title: 'Mapeamento de Perfil', desc: 'Nossa IA analisa suas competências técnicas e nível de experiência.' },
              { num: '3', title: 'Busca & Match de Vagas', desc: 'Visualização de vagas com pontuação de afinidade percentual.' },
              { num: '4', title: 'Otimização para ATS', desc: 'Ajuste do currículo para os termos exigidos pela vaga desejada.' },
              { num: '5', title: 'Treino para Entrevista', desc: 'Simulações interativas para treinar suas respostas antes do RH.' },
              { num: '6', title: 'Conquiste a Vaga', desc: 'Acompanhe seu avanço no pipeline até a contratação.' }
            ].map((step, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-[#3B82F6] font-mono font-bold text-xs flex items-center justify-center">
                  {step.num}
                </span>
                <h3 className="font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">{step.title}</h3>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. GOOGLE OAUTH & SEGURANÇA (Dedicated Section) ── */}
        <section id="google-auth" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
          <div className="p-8 rounded-2xl bg-[#0F172A] dark:bg-[#0F172A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 max-w-4xl mx-auto space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">
                  Finalidade do aplicativo e Uso da Conta Google
                </h2>
                <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-600">Transparência total e respeito à sua privacidade de dados.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#3B82F6]">Descrição do Aplicativo</h3>
                <p className="text-slate-300 dark:text-slate-300 light:text-slate-700">
                  O <strong>Vocentro</strong> é uma plataforma de Inteligência Artificial voltada ao desenvolvimento profissional, ajudando candidatos na busca inteligente por vagas, otimização de currículos para sistemas ATS e simulação de entrevistas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#3B82F6]">Justificativa da Autenticação Google OAuth</h3>
                <p className="text-slate-300 dark:text-slate-300 light:text-slate-700">
                  A autenticação pelo Google é utilizada estritamente para autenticar seu acesso de forma rápida e segura, identificando seu perfil (nome, e-mail e foto avatar) para gestão do seu painel e acompanhamento de candidaturas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 space-y-1 font-medium">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#22C55E]">Garantia de Privacidade</h3>
                <p>
                  Não acessamos, lemos ou solicitamos dados do seu Gmail, Google Drive ou qualquer outro serviço privado do Google.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
                <Check size={16} className="text-[#22C55E]" />
                <span>Zero acesso a e-mails ou Drive</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
                <Check size={16} className="text-[#22C55E]" />
                <span>Sem postagens em seu nome</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
                <Check size={16} className="text-[#22C55E]" />
                <span>Login opcional e cadastro seguro</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. PLANOS (2 Planos) ── */}
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
                className="w-full py-3 text-xs font-bold text-white bg-slate-800 dark:bg-slate-800 light:bg-slate-900 hover:bg-[#172554] rounded-xl transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full py-3 text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-600 rounded-xl transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-md"
              >
                Assinar Plano Pro
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ── */}
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
                  className="w-full p-4 text-left font-bold text-sm text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 flex justify-between items-center hover:bg-[#172554] dark:hover:bg-[#172554] light:hover:bg-slate-50 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

      {/* ── 8. FOOTER PROFISSIONAL ── */}
      <footer className="border-t border-slate-800 dark:border-slate-800 light:border-slate-200 bg-[#020617] dark:bg-[#020617] light:bg-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <VocentroLogo className="h-6" showText={true} />
            <p className="text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700 leading-relaxed">
              Vocentro é uma plataforma de inteligência de carreira focada no desenvolvimento e contratação de profissionais através de IA.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Plataforma</h4>
            <ul className="space-y-1.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              <li><a href="#o-que-e" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">O que é o Vocentro</a></li>
              <li><a href="#beneficios" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Benefícios</a></li>
              <li><a href="#como-funciona" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Como funciona</a></li>
              <li><a href="#planos" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Planos</a></li>
              <li>
                <a
                  href="/faq"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/faq');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="text-[#3B82F6] font-bold hover:underline cursor-pointer"
                >
                  Central de Ajuda & FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900">Privacidade & OAuth</h4>
            <ul className="space-y-1.5 text-xs text-[#CBD5E1] dark:text-[#CBD5E1] light:text-slate-700">
              <li>
                <a
                  href="/politica-de-privacidade"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/politica-de-privacidade');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a
                  href="/termos-de-uso"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/termos-de-uso');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Termos de Uso
                </a>
              </li>
              <li><a href="#google-auth" className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors">Autenticação Google</a></li>
              <li><span className="text-[#22C55E] font-semibold">● Status: Operacional</span></li>
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
          <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados.</p>
          <p className="font-mono text-[11px]">Vocentro OAuth Ready • WCAG AA Verified</p>
        </div>
      </footer>

    </div>
  );
}
