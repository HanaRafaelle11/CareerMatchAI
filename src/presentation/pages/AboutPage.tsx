import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ArrowLeft, Mail, Target, Rocket, Layers, Users } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

interface AboutPageProps {
  onBack?: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12 relative overflow-x-hidden transition-colors duration-300">
      {/* Decorative background light */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar para o início
          </button>
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-start gap-3 border-b border-border pb-6">
          <VocentroLogo className="h-10 mb-2" showText={true} />
          <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-[10px] font-bold tracking-wider uppercase font-mono">
            Institucional & Transparência
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
            Sobre o Vocentro
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            A plataforma inteligente de gestão de carreira com Inteligência Artificial.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
          
          {/* 1. Missão */}
          <div className="p-6 rounded-[20px] bg-card border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
              <Target className="text-brand-500" size={20} />
              1. Nossa Missão
            </h2>
            <p>
              A missão do <strong className="text-foreground">Vocentro</strong> é democratizar o acesso a ferramentas avançadas de inteligência de carreira. Capacitamos candidatos e profissionais em busca de recolocação a entenderem os critérios dos algoritmos de recrutamento (ATS), apresentarem seus talentos no formato padrão STAR e alcançarem vagas altamente compatíveis com suas competências reais.
            </p>
          </div>

          {/* 2. Objetivo */}
          <div className="p-6 rounded-[20px] bg-card border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
              <Rocket className="text-emerald-500" size={20} />
              2. Nosso Objetivo
            </h2>
            <p>
              Eliminar o sentimento de desorientação durante a busca por empregos. O Vocentro transforma um processo seletivo caótico em um fluxo produtivo, organizado e guiado por IA, onde o candidato possui visibilidade clara do seu Match percentual e recomendações práticas de melhoria.
            </p>
          </div>

          {/* 3. Funcionalidades Principais */}
          <div className="p-6 rounded-[20px] bg-card border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
              <Layers className="text-brand-500" size={20} />
              3. Principais Funcionalidades
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Análise & Cálculo de Match ATS:</strong> Comparação semântica de currículo com os requisitos da vaga desejada.</li>
              <li><strong className="text-foreground">Otimização em Padrão STAR:</strong> Ajuste de palavras-chave e reescrita de conquistas profissionais aprovadas por robôs de RH.</li>
              <li><strong className="text-foreground">Simulador de Entrevistas:</strong> Coach interativo com perguntas comportamentais e feedback de desempenho em tempo real.</li>
              <li><strong className="text-foreground">Funil Kanban de Candidaturas:</strong> Organização visual de todas as vagas aplicadas e agendamentos de entrevista.</li>
            </ul>
          </div>

          {/* 4. Equipe & Projeto */}
          <div className="p-6 rounded-[20px] bg-card border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
              <Users className="text-brand-500" size={20} />
              4. Equipe & Projeto (Vocentro Tecnologia)
            </h2>
            <p>
              O <strong className="text-foreground">Vocentro</strong> é mantido e continuamente aprimorado pela <strong className="text-foreground">Vocentro Tecnologia</strong>, uma iniciativa focada em soluções de software de alta performance e inteligência artificial voltada ao desenvolvimento profissional. Não possuímos vínculo ou afiliação direta com a Google LLC; utilizamos apenas o protocolo de login aberto Google OAuth 2.0 para autenticação segura de usuários.
            </p>
          </div>

          {/* 5. Contato & Suporte */}
          <div className="p-6 rounded-[20px] bg-card border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
              <Mail className="text-brand-500" size={20} />
              5. Contato & Suporte
            </h2>
            <p>
              Para dúvidas institucionais, suporte técnico ou solicitações relativas à privacidade de dados:
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Mail className="text-brand-500" size={16} />
              <a href="mailto:suporte@vocentro.com.br" className="text-brand-500 hover:underline font-bold">
                suporte@vocentro.com.br
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
