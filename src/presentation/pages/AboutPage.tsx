import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ArrowLeft, ShieldCheck, Lock, UserCheck, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-x-hidden">
      {/* Luzes decorativas */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Voltar para o início
        </button>

        <div className="flex flex-col items-start gap-3 border-b border-slate-850 pb-6">
          <VocentroLogo className="h-10 mb-2" showText={true} />
          <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase font-mono">
            Institucional & Transparência
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Sobre o Vocentro
          </h1>
          <p className="text-sm text-slate-400 font-sans">
            A plataforma inteligente para acelerar sua carreira profissional.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {/* 1. O que é o Vocentro */}
          <div className="p-6 rounded-[20px] bg-slate-900/40 border border-slate-850 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              1. O que é o Vocentro
            </h2>
            <p>
              O <strong>Vocentro</strong> é uma plataforma desenvolvida para apoiar profissionais durante toda a jornada de busca por oportunidades de trabalho, utilizando Inteligência Artificial para aumentar a eficiência na preparação de currículos, identificação de vagas compatíveis e preparação para processos seletivos.
            </p>
          </div>

          {/* 2. Qusais dados são utilizados */}
          <div className="p-6 rounded-[20px] bg-slate-900/40 border border-slate-850 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              2. Quais dados são utilizados
            </h2>
            <p>
              Para fornecer análises personalizadas e simulações de carreira, o Vocentro processa unicamente os seguintes dados fornecidos voluntariamente:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Informações de Perfil:</strong> Nome completo, endereço de e-mail e foto de perfil (quando fornecida via login social).</li>
              <li><strong>Dados Profissionais:</strong> Currículos enviados em formato PDF/Word para leitura e otimização semântica ATS.</li>
              <li><strong>Preferências de Carreira:</strong> Histórico de candidaturas ativas, cargos de interesse e metas profissionais.</li>
            </ul>
          </div>

          {/* 3. Como funciona o Login Google */}
          <div className="p-6 rounded-[20px] bg-slate-900/40 border border-slate-850 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <ShieldCheck className="text-brand-accent" size={20} />
              3. Como funciona o Login Google (OAuth)
            </h2>
            <p>
              O recurso de entrada via Google (Google OAuth) no <strong>Vocentro</strong> é utilizado <strong>exclusivamente para autenticação rápida e segura do usuário</strong>. Ao utilizar sua conta Google para entrar:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>Solicitamos apenas escopos básicos de identificação pública (nome e e-mail).</li>
              <li>Não solicitamos nem acessamos permissões adicionais de leitura ou modificação no Google Drive, Gmail, Agenda ou outros serviços pessoais.</li>
              <li>Sua senha do Google nunca é compartilhada nem armazenada pelo Vocentro.</li>
            </ul>
          </div>

          {/* 4. Privacidade e Proteção de Dados */}
          <div className="p-6 rounded-[20px] bg-slate-900/40 border border-slate-850 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <Lock className="text-brand-accent" size={20} />
              4. Privacidade e Proteção de Dados
            </h2>
            <p>
              <strong>Nenhum dado pessoal ou profissional do usuário é compartilhado ou vendido a terceiros para fins publicitários ou mercadológicos.</strong> Todas as informações processadas são armazenadas com criptografia em trânsito e em repouso, respeitando rigorosamente a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </div>

          {/* 5. Contato e Suporte */}
          <div className="p-6 rounded-[20px] bg-slate-900/40 border border-slate-850 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <UserCheck className="text-brand-accent" size={20} />
              5. Contato e Suporte
            </h2>
            <p>
              Se você tiver alguma dúvida sobre a plataforma ou sobre o tratamento de seus dados, nossa equipe de suporte está à disposição:
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Mail className="text-brand-accent" size={16} />
              <a href="mailto:suporte@vocentro.com.br" className="text-brand-accent hover:underline font-semibold">
                suporte@vocentro.com.br
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
