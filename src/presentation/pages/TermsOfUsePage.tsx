import React from 'react';
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';

interface TermsOfUsePageProps {
  onBack?: () => void;
}

export const TermsOfUsePage: React.FC<TermsOfUsePageProps> = ({ onBack }) => {
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-[#020617]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Voltar para a página inicial do Vocentro"
          >
            <ArrowLeft size={18} />
          </button>
          <VocentroLogo className="h-7 text-white" showText={true} />
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">
          Termos & Condições
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] text-xs font-bold font-mono">
            <FileText size={14} />
            <span>Condições Gerais de Uso</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#F8FAFC]">
            Termos de Uso - Vocentro
          </h1>
          <p className="text-xs text-[#CBD5E1] font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a plataforma Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1: Aceitação dos Termos */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#22C55E]" />
            1. Aceitação dos Termos
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Ao criar uma conta ou utilizar os serviços do <strong>Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-[#3B82F6] hover:underline">https://vocentro.com.br</a>), você concorda expressamente com os presentes Termos de Uso e com nossa Política de Privacidade. Caso não concorde com qualquer disposição aqui estabelecida, você não deverá utilizar a plataforma.
          </p>
        </section>

        {/* Section 2: Descrição do Serviço */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <FileText size={18} className="text-[#3B82F6]" />
            2. Descrição do Serviço
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            O <strong>Vocentro</strong> é uma plataforma de desenvolvimento profissional que utiliza ferramentas de Inteligência Artificial para orientar e auxiliar candidatos na busca por oportunidades de emprego. A plataforma oferece:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-[#CBD5E1] pl-2">
            <li>Busca inteligente e agregação de vagas de trabalho;</li>
            <li>Análise semântica e cálculo de pontuação de compatibilidade (Match Score);</li>
            <li>Otimização de currículos para sistemas automatizados de seleção (ATS);</li>
            <li>Simulador interativo de entrevistas com feedback inteligente;</li>
            <li>Organização e acompanhamento de candidaturas em funil (Kanban).</li>
          </ul>
        </section>

        {/* Section 3: Regras de Conduta do Usuário */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#22C55E]" />
            3. Regras de Conduta do Usuário
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Ao utilizar o Vocentro, o usuário se compromete a:
          </p>
          <ul className="space-y-2 text-xs text-[#CBD5E1] pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0 mt-0.5" />
              <span>Fornecer informações verdadeiras e atualizadas no seu perfil profissional e currículo.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0 mt-0.5" />
              <span>Manter o sigilo de suas credenciais de acesso (e-mail/senha ou login Google).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0 mt-0.5" />
              <span>Não utilizar a plataforma para fins ilícitos, spam ou envio de conteúdos ofensivos.</span>
            </li>
          </ul>
        </section>

        {/* Section 4: Limitação de Responsabilidade */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            4. Limitação de Responsabilidade
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            O <strong>Vocentro</strong> atua como uma ferramenta facilitadora e otimizadora da jornada profissional do candidato. O Vocentro não garante a contratação imediata nem possui vínculo empregatício direto com as empresas cujas vagas são disponibilizadas pelos portais parceiros. As decisões de contratação são de inteira responsabilidade das empresas recrutadoras.
          </p>
        </section>

        {/* Section 5: Contato */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <Mail size={18} className="text-[#3B82F6]" />
            5. Alterações e Contato
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Reservamo-nos o direito de atualizar estes Termos de Uso periodicamente. Em caso de dúvidas referentes a estes termos, entre em contato através do suporte:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 text-xs font-bold">
            <a href="mailto:suporte@vocentro.com.br" className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[#3B82F6] hover:underline flex items-center gap-2">
              <Mail size={15} /> suporte@vocentro.com.br
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#020617] py-8 px-6 text-center text-xs text-[#CBD5E1]">
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • Termos de Uso da Aplicação.</p>
      </footer>
    </div>
  );
};
