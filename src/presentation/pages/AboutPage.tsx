import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ArrowLeft, Mail, Target, Rocket, Layers, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 font-sans p-6 md:p-12 relative overflow-x-hidden transition-colors duration-300">
      {/* Decorative background light */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Voltar para o início
        </button>

        <div className="flex flex-col items-start gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-6">
          <VocentroLogo className="h-10 mb-2" showText={true} />
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] text-[10px] font-bold tracking-wider uppercase font-mono">
            Institucional & Transparência
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 font-display">
            Sobre o Vocentro
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans">
            A plataforma inteligente de gestão de carreira com Inteligência Artificial.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans">
          
          {/* 1. Missão */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Target className="text-[#3B82F6]" size={20} />
              1. Nossa Missão
            </h2>
            <p>
              A missão do <strong>Vocentro</strong> é democratizar o acesso a ferramentas avançadas de inteligência de carreira. Capacitamos candidatos e profissionais em busca de recolocação a entenderem os critérios dos algoritmos de recrutamento (ATS), apresentarem seus talentos no formato padrão STAR e alcançarem vagas altamente compatíveis com suas competências reais.
            </p>
          </div>

          {/* 2. Objetivo */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Rocket className="text-[#22C55E]" size={20} />
              2. Nosso Objetivo
            </h2>
            <p>
              Eliminar o sentimento de desorientação durante a busca por empregos. O Vocentro transforma um processo seletivo caótico em um fluxo produtivo, organizado e guiado por IA, onde o candidato possui visibilidade clara do seu Match percentual e recomendações práticas de melhoria.
            </p>
          </div>

          {/* 3. Funcionalidades Principais */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Layers className="text-[#3B82F6]" size={20} />
              3. Principais Funcionalidades
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 dark:text-slate-300 light:text-slate-700">
              <li><strong>Análise & Cálculo de Match ATS:</strong> Comparação semântica de currículo com os requisitos da vaga desejada.</li>
              <li><strong>Otimização em Padrão STAR:</strong> Ajuste de palavras-chave e reescrita de conquistas profissionais aprovadas por robôs de RH.</li>
              <li><strong>Simulador de Entrevistas:</strong> Coach interativo com perguntas comportamentais e feedback de desempenho em tempo real.</li>
              <li><strong>Funil Kanban de Candidaturas:</strong> Organização visual de todas as vagas aplicadas e agendamentos de entrevista.</li>
            </ul>
          </div>

          {/* 4. Equipe & Projeto */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Users className="text-[#3B82F6]" size={20} />
              4. Equipe & Projeto (Vocentro Tecnologia)
            </h2>
            <p>
              O <strong>Vocentro</strong> é mantido e continuamente aprimorado pela <strong>Vocentro Tecnologia</strong>, uma iniciativa focada em soluções de software de alta performance e inteligência artificial voltada ao desenvolvimento profissional. Não possuímos vínculo ou afiliação direta com a Google LLC; utilizamos apenas o protocolo de login aberto Google OAuth 2.0 para autenticação segura de usuários.
            </p>
          </div>

          {/* 5. Contato & Suporte */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Mail className="text-[#3B82F6]" size={20} />
              5. Contato & Suporte
            </h2>
            <p>
              Para dúvidas institucionais, suporte técnico ou solicitações relativas à privacidade de dados:
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Mail className="text-[#3B82F6]" size={16} />
              <a href="mailto:suporte@vocentro.com.br" className="text-[#3B82F6] hover:underline font-bold">
                suporte@vocentro.com.br
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
