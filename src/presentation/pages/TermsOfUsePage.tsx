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
    <div className="min-h-screen bg-slate-950 light:bg-slate-50 text-slate-100 light:text-slate-900 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-slate-950/90 light:bg-white/95 backdrop-blur-md border-b border-slate-800 light:border-slate-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-200 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Voltar para a página inicial do Vocentro"
          >
            <ArrowLeft size={18} />
          </button>
          <VocentroLogo className="h-7" showText={true} />
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 light:text-blue-700 font-bold">
          Termos & Condições
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-slate-800 light:border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 light:text-blue-700 text-xs font-bold font-mono">
            <FileText size={14} />
            <span>Condições Gerais de Uso</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-100 light:text-slate-900">
            Termos de Uso - Vocentro
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a plataforma Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            1. Aceitação dos Termos
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Ao criar uma conta ou utilizar os serviços do <strong className="text-slate-200 light:text-slate-800">Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-blue-400 light:text-blue-700 hover:underline">https://vocentro.com.br</a>), você concorda expressamente com os presentes Termos de Uso e com nossa Política de Privacidade.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-400 light:text-blue-700" />
            2. Descrição do Serviço
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            O <strong className="text-slate-200 light:text-slate-800">Vocentro</strong> é uma plataforma de desenvolvimento profissional que utiliza Inteligência Artificial para orientar candidatos na busca por oportunidades de emprego. A plataforma oferece:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 light:text-slate-600 pl-2">
            <li>Busca inteligente e agregação de vagas de trabalho;</li>
            <li>Análise semântica e cálculo do Match da vaga (Match Score);</li>
            <li>Otimização de currículos para sistemas automatizados de seleção (ATS);</li>
            <li>Simulador interativo de entrevistas com feedback inteligente;</li>
            <li>Organização e acompanhamento de candidaturas em funil (Kanban).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            3. Regras de Conduta do Usuário
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Ao utilizar o Vocentro, o usuário se compromete a:
          </p>
          <ul className="space-y-2 text-xs text-slate-400 light:text-slate-600 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Fornecer informações verdadeiras e atualizadas no seu perfil profissional e currículo.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Manter o sigilo de suas credenciais de acesso (e-mail/senha ou login Google).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Não utilizar a plataforma para fins ilícitos, spam ou envio de conteúdos ofensivos.</span>
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            4. Limitação de Responsabilidade
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            O <strong className="text-slate-200 light:text-slate-800">Vocentro</strong> atua como uma ferramenta facilitadora da jornada profissional do candidato. Não garantimos a contratação imediata nem possuímos vínculo empregatício com as empresas cujas vagas são disponibilizadas pelos portais parceiros.
          </p>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Mail size={18} className="text-blue-400 light:text-blue-700 shrink-0" />
            5. Alterações e Contato
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Reservamo-nos o direito de atualizar estes Termos de Uso periodicamente. Em caso de dúvidas, entre em contato:
          </p>
          <div className="pt-1">
            <a 
              href="mailto:suporte@vocentro.com.br" 
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 light:bg-slate-100 border border-slate-700 light:border-slate-200 text-blue-400 light:text-blue-700 hover:text-white light:hover:text-blue-800 font-bold text-xs sm:text-sm hover:border-blue-500 transition-all break-all"
            >
              <Mail size={16} className="shrink-0" />
              <span>suporte@vocentro.com.br</span>
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 light:border-slate-200 bg-slate-950 light:bg-slate-100 py-8 px-6 text-center text-xs text-slate-400 light:text-slate-600">
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • Termos de Uso da Aplicação.</p>
      </footer>
    </div>
  );
};
