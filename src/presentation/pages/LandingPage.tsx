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
  Target,
  Activity,
  Lock,
  Zap
} from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';
import { HeroProductMockup } from '../components/HeroProductMockup';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'signup') => void;
}

export function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [transparencyTab, setTransparencyTab] = useState<'data' | 'flow' | 'security'>('data');

  const [pricingCycle, setPricingCycle] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');

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
      q: 'Como funciona a análise de currículo e entrevistas?',
      a: 'Nossa inteligência artificial analisa as informações do seu currículo e compara com os requisitos das vagas, ajudando você a estruturar respostas de impacto e se preparar para entrevistas.'
    },
    {
      q: 'Como posso excluir minha conta e meus dados?',
      a: 'Você pode solicitar a exclusão permanente de sua conta e dados a qualquer momento enviando um e-mail para suporte@vocentro.com.br. Todos os seus registros serão removidos definitivamente em até 48h úteis.'
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
        description: 'Plataforma para análise de currículo, organização de candidaturas e preparação para entrevistas utilizando Inteligência Artificial.',
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
    <div className="min-h-screen bg-background text-foreground font-sans relative selection:bg-brand-500/30 selection:text-primary transition-colors duration-200">
      
      {/* Schema JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* ── HEADER / NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-b border-border text-foreground flex items-center justify-between px-4 sm:px-6 z-50 transition-colors">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <VocentroLogo className="h-7" showText={true} />
        </div>

        <nav className="hidden lg:flex items-center gap-5" aria-label="Navegação Principal">
          <a href="#funcionalidades" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#transparencia" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Transparência & Login</a>
          <button 
            onClick={() => navigateToRoute('/politica-de-privacidade')}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Privacidade
          </button>
          <button 
            onClick={() => navigateToRoute('/termos-de-uso')}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Termos
          </button>
          <a href="#planos" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Planos</a>
          <a href="#faq" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button 
            onClick={() => onNavigateToAuth('login')}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-2"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigateToAuth('signup')}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Criar conta grátis
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main id="main-content" className="w-full pt-16">

        {/* ── 1. HERO SECTION ── */}
        <section className="py-12 sm:py-16 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Lado Esquerdo: Mensagem Clara & Transparência de Dados */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold font-mono text-xs">
                <Sparkles size={14} />
                <span>🚀 Em fase beta — seja um dos primeiros a testar</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black font-display tracking-tight text-foreground leading-[1.2]">
                Conquiste a vaga ideal mais rápido com Inteligência Artificial
              </h1>

              <h2 className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium">
                O Vocentro ajuda você a encontrar vagas compatíveis com seu perfil, melhorar seu currículo e se preparar para entrevistas — tudo em um só lugar.
              </h2>

              {/* Benefícios Humanos Acima da Dobra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  'Encontre vagas do seu perfil',
                  'Currículo otimizado para o mercado',
                  'Treino de entrevistas interativo',
                  'Organização simples de candidaturas'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Aviso Explícito de Dados do Google OAuth Acima da Dobra */}
              <div className="p-3.5 rounded-xl bg-card border border-border text-xs text-muted-foreground leading-relaxed">
                🔒 <strong className="text-foreground">Login seguro com Google:</strong> Utilizamos o login do Google apenas para identificar seu nome e e-mail com segurança. Não lemos e-mails nem acessamos seus arquivos do Google Drive.
              </div>

              {/* Botões de Ação Principais */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => onNavigateToAuth('signup')}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <span>Criar Conta Gratuita</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#transparencia"
                  className="px-6 py-3.5 text-sm font-bold text-foreground bg-card hover:bg-card/80 border border-border rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Como Funciona</span>
                </a>
              </div>
            </div>

            {/* Lado Direito: Preview da Plataforma */}
            <div className="lg:col-span-6">
              <HeroProductMockup onSimulateClick={() => onNavigateToAuth('signup')} />
            </div>

          </div>
        </section>

        {/* ── 2. O QUE VOCÊ PODE FAZER ── */}
        <section id="funcionalidades" className="py-16 px-6 max-w-7xl mx-auto border-t border-border space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-500">Benefícios para a sua Carreira</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              O que você pode fazer no Vocentro
            </h2>
            <p className="text-sm text-muted-foreground">
              Ferramentas inteligentes projetadas para colocar você no controle da sua busca de emprego.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Search, title: 'Oportunidades Certas para Você', desc: 'Busca inteligente de vagas alinhadas com sua área e senioridade.' },
              { icon: BriefcaseBusiness, title: 'Painel de Candidaturas', desc: 'Acompanhe o status de cada processo seletivo sem se perder.' },
              { icon: FileText, title: 'Diagnóstico do Currículo', desc: 'Descubra pontos fortes e oportunidades de melhoria no seu perfil.' },
              { icon: ScanSearch, title: 'Currículo de Alto Impacto', desc: 'Destaque suas conquistas com termos relevantes para os recrutadores.' },
              { icon: Sparkles, title: 'Treino de Entrevistas com IA', desc: 'Pratique perguntas comportamentais e ganhe confiança antes da entrevista.' },
              { icon: Activity, title: 'Teste de Match da vaga', desc: 'Saiba se seu currículo atende aos requisitos exigidos pelas empresas.' },
              { icon: CheckCircle2, title: 'Histórias Profissionais', desc: 'Estruture seus cases de sucesso de forma clara e convincente.' },
              { icon: Target, title: 'Evolução Semanal', desc: 'Metas e acompanhamento contínuo para acelerar sua contratação.' }
            ].map((card, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3 hover:border-brand-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center">
                  <card.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. TRANSPARÊNCIA & COMO FUNCIONA (CONTAINER INTERATIVO) ── */}
        <section id="transparencia" className="py-16 px-6 max-w-7xl mx-auto border-t border-border space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Transparência & Confiança</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              Como Funciona & Uso de Dados
            </h2>
            <p className="text-sm text-muted-foreground">
              Entenda em detalhes como funciona a plataforma e nosso compromisso com a privacidade dos seus dados.
            </p>
          </div>

          {/* Abas de Seleção */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-card border border-border">
              <button
                onClick={() => setTransparencyTab('data')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  transparencyTab === 'data'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock size={15} />
                <span>🔒 Uso de Dados do Google</span>
              </button>

              <button
                onClick={() => setTransparencyTab('flow')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  transparencyTab === 'flow'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap size={15} />
                <span>⚡ Passo a Passo na Plataforma</span>
              </button>

              <button
                onClick={() => setTransparencyTab('security')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  transparencyTab === 'security'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShieldCheck size={15} />
                <span>🛡️ Segurança & Privacidade</span>
              </button>
            </div>

            {/* Conteúdo da Aba 1: USO DE DADOS DO GOOGLE (Default Open) */}
            {transparencyTab === 'data' && (
              <div className="mt-6 p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border shadow-xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        Como o Login com Google é utilizado
                      </h3>
                      <p className="text-xs text-brand-500 font-semibold">Uso restrito a autenticação de perfil</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigateToRoute('/how-google-login-works')}
                    className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver guia completo de permissões & OAuth</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-card/60 border border-border text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    O login com Google é utilizado exclusivamente para autenticar sua conta com segurança. Caso autorize, o Vocentro acessa apenas seu endereço de e-mail básico e seu nome público para criar seu cadastro de candidato.
                  </p>
                  <p className="font-semibold text-foreground">
                    Nenhum e-mail é lido ou enviado. Nenhum arquivo do Google Drive é acessado. Nenhuma informação é compartilhada com terceiros.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">Autenticação rápida e sem senha</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">Leitura básica de nome público</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">Leitura básica de e-mail</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5">
                    <XCircle size={18} className="text-red-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">Sem acesso ao Gmail</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5">
                    <XCircle size={18} className="text-red-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">Sem acesso ao Google Drive</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5">
                    <XCircle size={18} className="text-red-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">Sem compartilhamento de dados</span>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 2: PASSO A PASSO NA PLATAFORMA */}
            {transparencyTab === 'flow' && (
              <div className="mt-6 p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">
                  Fluxo da plataforma do cadastro à preparação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { step: '1', title: 'Login Seguro', desc: 'Entrada rápida via Google ou e-mail sem burocracia.' },
                    { step: '2', title: 'Mapeamento Inicial', desc: 'Identificação da sua área de atuação e objetivos.' },
                    { step: '3', title: 'Envio de Currículo', desc: 'Upload do seu arquivo para diagnóstico imediato.' },
                    { step: '4', title: 'Seleção de Vaga', desc: 'Escolha das oportunidades do seu interesse.' },
                    { step: '5', title: 'Análise de Afinidade', desc: 'Diagnóstico de pontos fortes e lacunas técnicas.' },
                    { step: '6', title: 'Treino Interativo', desc: 'Simulações de entrevistas para ganhar confiança.' }
                  ].map((st, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border space-y-2">
                      <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-500 font-mono font-bold text-xs flex items-center justify-center">
                        {st.step}
                      </span>
                      <h4 className="font-bold text-xs text-foreground">{st.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 3: SEGURANÇA E PRIVACIDADE */}
            {transparencyTab === 'security' && (
              <div className="mt-6 p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <ShieldCheck size={22} className="text-emerald-500" />
                  <h3 className="text-lg font-bold text-foreground">
                    Segurança e Compromisso com a Privacidade
                  </h3>
                </div>

                <div className="space-y-3 font-sans">
                  {[
                    'Seus dados e currículo são utilizados exclusivamente para análises do seu próprio perfil.',
                    'Armazenamento protegido com criptografia e padrões modernos de segurança na nuvem.',
                    'Você possui controle total e pode solicitar a exclusão definitiva da sua conta a qualquer momento.',
                    'Nenhum dado pessoal é vendido, alugado ou compartilhado com terceiros ou anunciantes.'
                  ].map((point, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-card/60 border border-border flex items-center gap-3">
                      <Check size={18} className="text-emerald-500 shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ── 4. POR QUE CONFIAR NO VOCENTRO ── */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-border space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-500">Compromisso com o Candidato</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              Por que utilizar o Vocentro
            </h2>
            <p className="text-sm text-muted-foreground">
              Desenvolvido para ajudar você a avançar na carreira com clareza e segurança.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-sm text-foreground">Privacidade Absoluta</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seus dados pertencem a você. Não vendemos informações e usamos escopos mínimos de autenticação.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <h3 className="font-bold text-sm text-foreground">Foco no Benefício Real</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Diagnósticos práticos de currículo e treinos realistas de entrevista para dar confiança real.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="font-bold text-sm text-foreground">Evolução Beta Contínua</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plataforma em aprimoramento constante com base nos feedbacks dos primeiros usuários.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-center max-w-2xl mx-auto">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-mono font-bold text-[10px] uppercase">
              Depoimentos reais em breve
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Estamos coletando os primeiros relatos de uso da comunidade Beta para compartilhar histórias reais em breve.
            </p>
          </div>
        </section>

        {/* ── 5. PLANOS ── */}
        <section id="planos" className="py-16 px-6 max-w-7xl mx-auto border-t border-border space-y-10">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              Planos acessíveis para sua carreira
            </h2>
            <p className="text-sm text-muted-foreground">
              Comece gratuitamente ou evolua com recursos avançados de inteligência artificial.
            </p>

            {/* Seletor de Ciclo de Cobrança Semanal vs Mensal */}
            <div className="inline-flex items-center bg-card p-1 rounded-2xl border border-border shadow-xs mt-2 gap-1">
              <button
                type="button"
                onClick={() => setPricingCycle('WEEKLY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pricingCycle === 'WEEKLY' ? 'bg-brand-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semanal (R$ 9,90/sem)
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('MONTHLY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pricingCycle === 'MONTHLY' ? 'bg-brand-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Mensal (R$ 29,90/mês)</span>
                <span className="text-[9px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full uppercase">
                  Mais Vantajoso (Economize 30%)
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plano Gratuito */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Gratuito</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">R$ 0</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground">Ideal para iniciar a organização de candidaturas e testar diagnósticos.</p>
                <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Diagnóstico inicial de currículo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Busca de vagas compatíveis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Painel de organização de candidaturas
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 text-xs font-bold text-foreground bg-card/80 hover:bg-card border border-border rounded-xl transition-colors cursor-pointer"
              >
                Começar Grátis
              </button>
            </div>

            {/* Plano Pro */}
            <div className="p-8 rounded-2xl bg-card border-2 border-brand-500 space-y-6 flex flex-col justify-between relative overflow-hidden shadow-md">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-500 text-[10px] font-bold uppercase font-mono">
                {pricingCycle === 'MONTHLY' ? 'Mais Popular' : 'Flexível'}
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">
                    {pricingCycle === 'WEEKLY' ? 'R$ 9,90' : 'R$ 29,90'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{pricingCycle === 'WEEKLY' ? 'semana' : 'mês'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Acelerador completo de carreira com treinos de entrevista ilimitados.</p>
                <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Tudo do plano Gratuito
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Otimização avançada de currículo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Treinador de entrevistas com IA ilimitado
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Exportação ilimitada de PDF em formato ATS
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Assinar Plano Pro ({pricingCycle === 'WEEKLY' ? 'R$ 9,90/semana' : 'R$ 29,90/mês'})
              </button>
            </div>
          </div>
        </section>

        {/* ── 6. FAQ ── */}
        <section id="faq" className="py-16 px-6 max-w-4xl mx-auto border-t border-border space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              Perguntas Frequentes
            </h2>
            <p className="text-sm text-muted-foreground">Esclareça suas dúvidas sobre a plataforma Vocentro.</p>
          </div>

          <div className="space-y-3">
            {faqData.map((item, index) => (
              <div key={index} className="rounded-xl bg-card border border-border overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left font-bold text-sm text-foreground flex justify-between items-center hover:bg-card/80 transition-colors cursor-pointer"
                  aria-expanded={activeFaq === index}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`transition-transform ${activeFaq === index ? 'rotate-180 text-brand-500' : 'text-muted-foreground'}`} />
                </button>
                {activeFaq === index && (
                  <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── RODAPÉ COMPLETO ── */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <VocentroLogo className="h-6" showText={true} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vocentro é uma plataforma de gestão e desenvolvimento de carreira com Inteligência Artificial.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Plataforma</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#funcionalidades" className="inline-block py-1 hover:text-foreground transition-colors">O que você pode fazer</a></li>
              <li><a href="#transparencia" className="inline-block py-1 hover:text-foreground transition-colors">Como Funciona</a></li>
              <li><a href="#planos" className="inline-block py-1 hover:text-foreground transition-colors">Planos</a></li>
              <li>
                <button
                  onClick={() => navigateToRoute('/faq')}
                  className="inline-block py-1 text-brand-500 font-bold hover:underline cursor-pointer"
                >
                  Central de Ajuda & FAQ
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Transparência & OAuth</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <button
                  onClick={() => navigateToRoute('/politica-de-privacidade')}
                  className="inline-block py-1 hover:text-foreground transition-colors cursor-pointer"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/termos-de-uso')}
                  className="inline-block py-1 hover:text-foreground transition-colors cursor-pointer"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/how-google-login-works')}
                  className="inline-block py-1 text-brand-500 font-bold hover:underline cursor-pointer"
                >
                  Como o Login Google Funciona
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/about')}
                  className="inline-block py-1 hover:text-foreground transition-colors cursor-pointer"
                >
                  Sobre o Vocentro (/about)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToRoute('/politica-de-privacidade#exclusao')}
                  className="inline-block py-1 text-red-500 hover:underline cursor-pointer font-semibold text-left"
                >
                  Exclusão de Conta & Dados
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Suporte & Empresa</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="font-semibold text-foreground">Empresa:</span> Vocentro Tecnologia</li>
              <li><span className="font-semibold text-foreground">Contato:</span> suporte@vocentro.com.br</li>
              <li><a href="mailto:suporte@vocentro.com.br" className="inline-block py-1 text-brand-500 hover:underline">Falar com Suporte</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Vocentro Tecnologia. Todos os direitos reservados.</p>
          <p className="font-mono text-[11px]">Vocentro OAuth 2.0 Verified • WCAG AA Compliant</p>
        </div>
      </footer>

    </div>
  );
}
