import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { CareerAnalyticsService } from '../../application/services/CareerAnalyticsService';

interface DashboardProps {
  profile: Profile | null;
  resumes: Resume[];
  matches: Match[];
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<any>;
  setActiveTab: (tab: string) => void;
  applications: Application[];
  careerGoals: CareerGoal[];
}

export function Dashboard({ 
  profile, 
  resumes, 
  matches, 
  careerProfileNew,
  notifications,
  markNotificationAsRead,
  setActiveTab,
  applications = []
}: DashboardProps) {
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Filtrar entrevistas de hoje ou futuras
  const interviewsCount = applications.filter(a => 
    ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)
  ).length;

  const trainingSkills = careerProfileNew
    ? (careerProfileNew.ats_keywords?.missing_keywords || []).slice(0, 3)
    : ['Salesforce', 'SQL', 'STAR Method'];

  // Funil de Candidaturas (Goal Tracker)
  const funnel = CareerAnalyticsService.getFunnel(applications);

  // Calcular progresso principal
  const calculatedProgress = funnel.analyzed > 0 
    ? Math.round((funnel.applied / funnel.analyzed) * 100) 
    : 65;

  // Calcular match médio
  const avgMatch = matches.length > 0 
    ? Math.round(matches.reduce((acc, m) => acc + m.scoreOverall, 0) / matches.length) 
    : 92;

  // Insight dinâmico baseado em dados reais
  const getAIInsight = () => {
    const name = careerProfileNew?.personal?.fullName?.split(' ')[0] ||
      profile?.fullName?.split(' ')[0] || 'Candidato';
    if (applications.length === 0 && !careerProfileNew) {
      return `Bem-vindo, ${name}! Envie seu currículo na aba "Resume" para a IA mapear suas competências automaticamente.`;
    }
    if (careerProfileNew && applications.length === 0) {
      return `Perfil IA gerado com sucesso! Use o Match Manual para calcular compatibilidade com vagas ou o Search para prospectar oportunidades.`;
    }
    if (interviewsCount > 0) {
      return `Parabéns! Você está em ${interviewsCount} processos seletivos. Acesse o Prep para simular entrevistas com a IA.`;
    }
    return `Identificamos novas oportunidades que possuem alto match com seu perfil atual.`;
  };

  const userName = profile?.fullName?.split(' ')[0] || 'Candidato';
  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuAslswa38bUuj_FwkwQt_HS8lzA5G4fFrWCeSWd247ear2QngypwhSCowyvPKPGxE_I1phpBnc5AZN9AxJ8JeOVNqST-NpwzIt-MCPs98Bgmdrb2hn0OAGCAcQOW_PF-B9oSZhaMek40wgr5Q4jGbwrgEzFRytl71lT0rULYhA7sN-O6iZVPqQWN55zD8iPzbW4tG2IXWSeuvpIX5NcQvtKKDSLSMIrWMM68zktKJaoggcmyTE-wG4c";

  // Se não houver currículo
  if (resumes.length === 0) {
    return (
      <div className="space-y-xxl p-2 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xxl">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-background tracking-tight">Olá, {userName} 👋</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Sua jornada rumo à próxima grande oportunidade começa enviando seu currículo.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container-highest shadow-sm">
              <img alt="User portrait" className="w-full h-full object-cover" src={profile?.avatarUrl || defaultAvatar}/>
            </div>
          </div>
        </header>

        <div className="py-20 text-center border border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant max-w-lg mx-auto p-8 bg-surface-container/30 animate-fade-in">
          <span className="material-symbols-outlined text-[48px] mb-4 text-primary animate-pulse">rocket_launch</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">Comece enviando seu Currículo</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-2 max-w-sm leading-relaxed">
            Analise suas experiências com inteligência artificial para mapear seus pontos fortes, planejar sua recolocação e calcular compatibilidade com vagas.
          </p>
          <button
            onClick={() => setActiveTab('profile')}
            className="mt-6 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all flex items-center gap-sm font-label-md text-label-md cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Cadastrar Meu Currículo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg p-2 max-w-7xl mx-auto mb-xxl">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xxl">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-on-background tracking-tight">Olá, {userName} 👋</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Sua jornada rumo à próxima grande oportunidade continua.</p>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container-highest shadow-sm">
            <img alt="User portrait" className="w-full h-full object-cover" src={profile?.avatarUrl || defaultAvatar}/>
          </div>
          {unreadNotifications.length > 0 && (
            <button className="relative w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-surface-container"></span>
            </button>
          )}
        </div>
      </header>

      {/* Goal Section & Bento Grid Start */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mb-lg">
        {/* Goal Section */}
        <section className="lg:col-span-8 premium-card rounded-xl p-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-md text-headline-md text-on-background">Meta principal: Conseguir emprego</h3>
              <span className="text-primary font-bold text-headline-md">{calculatedProgress}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-lg">
              <div className="h-full ai-gradient rounded-full" style={{ width: `${calculatedProgress}%` }}></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="p-md rounded-lg bg-surface-container-highest/30 border border-outline-variant/30">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Status do CV</p>
              <p className="font-headline-md text-headline-md text-on-surface">{primaryResume ? 'Otimizado' : 'Pendente'}</p>
            </div>
            <div className="p-md rounded-lg bg-surface-container-highest/30 border border-outline-variant/30">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Rede Social</p>
              <p className="font-headline-md text-headline-md text-on-surface">
                {careerProfileNew?.personal?.linkedin ? '90% Completo' : 'Incompleto'}
              </p>
            </div>
            <div className="p-md rounded-lg bg-surface-container-highest/30 border border-outline-variant/30">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Preparação</p>
              <p className="font-headline-md text-headline-md text-on-surface">
                {interviewsCount > 0 ? `${interviewsCount} Processo(s)` : '2 Simulações'}
              </p>
            </div>
          </div>
        </section>

        {/* Primary CTA Card (AI Recommendation) */}
        <section className="lg:col-span-4 ai-gradient rounded-xl p-lg text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div>
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-white/90">magic_button</span>
              <span className="font-label-md text-label-md uppercase tracking-widest text-white/80">Recomendado pelo Copilot</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-white mb-sm">Próximo Passo: Prospecção</h3>
            <p className="font-body-md text-body-md text-white/90 mb-lg">{getAIInsight()}</p>
          </div>
          <button 
            onClick={() => setActiveTab('career-profile')}
            className="w-full py-md bg-white text-primary-container font-bold rounded-lg shadow-lg hover:bg-slate-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">search</span>
            Buscar vagas agora
          </button>
        </section>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
        <div className="premium-card rounded-xl p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="material-symbols-outlined text-primary">work</span>
            <span className="text-green-400 font-bold text-label-sm">+{matches.length}</span>
          </div>
          <p className="font-headline-xl text-headline-xl text-on-background">{matches.length}</p>
          <p className="font-label-md text-label-md text-on-surface-variant">Vagas encontradas</p>
        </div>
        <div className="premium-card rounded-xl p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="material-symbols-outlined text-secondary">send</span>
            <span className="text-on-surface-variant font-bold text-label-sm">--</span>
          </div>
          <p className="font-headline-xl text-headline-xl text-on-background">{applications.length}</p>
          <p className="font-label-md text-label-md text-on-surface-variant">Candidaturas</p>
        </div>
        <div className="premium-card rounded-xl p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="material-symbols-outlined text-tertiary">groups</span>
            <span className="text-green-400 font-bold text-label-sm">+{interviewsCount}</span>
          </div>
          <p className="font-headline-xl text-headline-xl text-on-background">{String(interviewsCount).padStart(2, '0')}</p>
          <p className="font-label-md text-label-md text-on-surface-variant">Entrevistas</p>
        </div>
        <div className="premium-card rounded-xl p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="material-symbols-outlined text-primary-container">favorite</span>
            <span className="text-primary font-bold text-label-sm">Alta</span>
          </div>
          <p className="font-headline-xl text-headline-xl text-on-background">{avgMatch}%</p>
          <p className="font-label-md text-label-md text-on-surface-variant">Match médio</p>
        </div>
      </div>

      {/* Activity & Visual Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Recent Activity */}
        <section className="lg:col-span-7 premium-card rounded-xl p-lg">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-headline-md text-headline-md text-on-background">Atividades recentes</h3>
            <button className="text-primary font-bold font-label-md hover:underline cursor-pointer" onClick={() => setActiveTab('match')}>Ver todas</button>
          </div>
          <div className="space-y-md">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.slice(0, 3).map(n => (
                <div key={n.id} className="flex items-start gap-md p-md rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">campaign</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface font-semibold">{n.title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{n.message}</p>
                  </div>
                  <button 
                    onClick={() => markNotificationAsRead(n.id)}
                    className="font-label-sm text-label-sm text-primary hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Marcar lida
                  </button>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-md p-md rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">edit_document</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Currículo analisado</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">IA mapeou suas experiências e atualizou o Objetivo de Vagas.</p>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Há poucos min</p>
                </div>
                <div className="flex items-start gap-md p-md rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">campaign</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Nova vaga disponível</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Mapeada nova oportunidade compatível na aba de Matches.</p>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Há 1h</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Insights/Visual Section */}
        <section className="lg:col-span-5 flex flex-col gap-lg">
          <div className="premium-card rounded-xl p-lg flex-1 flex flex-col">
            <h4 className="font-headline-md text-headline-md text-on-background mb-md">Insights de Carreira</h4>
            <div className="flex-1 rounded-lg overflow-hidden relative group min-h-[140px]">
              <img alt="Career insights graph" className="w-full h-full object-cover opacity-80 absolute inset-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfxgQj1nkPXOYpdCLjsnvYPu7lJhd4cCvHxIxvqY4lglj4Tzdm75FtyM8m15gX-OTJhXw-tP2i0yn4YV4IZ5yfYsrVc2WAcU3kZvCH0BLPGLKBak1_40vp3D5moLZNzpmhpx4Ahm_F9GjN8YO7n1AYlFrsNYqJi9Zk5Pa4s4zULfJvM4rxfxy8mQCPX0s_OBtU6sP5d0CvMEs2-6sIVvAMxnj65azn7q-5fqgANx0D1N5mqIotYMx9"/>
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent flex items-end p-md">
                <p className="text-on-surface font-body-md relative z-10 font-semibold">Seu perfil está 40% mais visível que na semana anterior.</p>
              </div>
            </div>
          </div>
          <div className="premium-card rounded-xl p-lg border-l-4 border-primary">
            <p className="font-label-md text-label-md text-primary font-bold uppercase mb-xs">Dica do Copilot</p>
            <p className="font-body-md text-body-md text-on-surface">
              Considere adicionar "{trainingSkills[0] || 'Figma'}" às suas habilidades principais para aumentar o match em 15%.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
