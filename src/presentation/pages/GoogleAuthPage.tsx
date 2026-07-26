import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ShieldCheck, UserCheck, Mail, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface GoogleAuthPageProps {
  onBack?: () => void;
}

export function GoogleAuthPage({ onBack }: GoogleAuthPageProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-brand-500/30 selection:text-white transition-colors duration-300 py-10 px-4 sm:px-6">
      
      {/* Background Gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-brand-500/5 blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vh] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none z-0" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-900 cursor-pointer min-h-[36px]"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </button>
          <VocentroLogo className="h-7 text-white" showText={true} />
        </div>

        {/* Hero Card / Title */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <ShieldCheck size={13} />
            Google Auth Platform Verification
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Autenticação e Login com Google - Vocentro
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
            Esta página descreve com total transparência a finalidade da integração do login via Google OAuth 2.0 no aplicativo <strong className="text-white">Vocentro</strong>, quais dados são acessados e nossas políticas de privacidade e proteção ao usuário.
          </p>
        </div>

        {/* Section 1: Purpose of Google Login */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-850 space-y-4 shadow-md font-sans">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                1. Por que o Vocentro utiliza o Login do Google?
              </h2>
              <span className="text-[11px] text-slate-400">Autenticação rápida, simples e segura</span>
            </div>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            A integração com o recurso Google OAuth 2.0 no <strong className="text-white">Vocentro</strong> existe única e exclusivamente para permitir que os usuários criem suas contas ou façam login de forma instantânea e segura, sem a necessidade de memorizar senhas adicionais.
          </p>
        </div>

        {/* Section 2: Data Used */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-850 space-y-4 shadow-md font-sans">
          <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <UserCheck className="text-brand-accent" size={18} />
            2. QUAIS DADOS SÃO UTILIZADOS?
          </h2>

          <p className="text-slate-300 text-xs leading-relaxed">
            O aplicativo solicita apenas escopos básicos de permissão de identificação pública:
          </p>

          <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block text-xs">Endereço de E-mail:</strong>
                Utilizado como identificador único da conta para acesso e comunicações de serviço.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block text-xs">Nome Completo:</strong>
                Utilizado para personalizar a experiência do usuário e saudações no painel.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block text-xs">Foto Pública de Perfil:</strong>
                Utilizada apenas para exibição no avatar do usuário dentro do aplicativo.
              </div>
            </li>
          </ul>
        </div>

        {/* Section 3: Privacy & Security Guarantee */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-850 space-y-4 shadow-md font-sans">
          <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Lock className="text-brand-accent" size={18} />
            3. Garantia de Privacidade e Uso de Dados do Google
          </h2>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white">Os dados do usuário NUNCA são vendidos, alugados ou compartilhados com terceiros para fins publicitários.</strong>
            </p>
            <p>
              O aplicativo <strong className="text-white">Vocentro</strong> <strong className="text-emerald-400">NÃO</strong> solicita, não lê, não edita, não armazena e não possui acesso a e-mails do Gmail, contatos, arquivos do Google Drive ou histórico de navegação.
            </p>
            <p>
              O tratamento de dados obedece rigorosamente à <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline font-semibold">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado (Limited Use Requirements).
            </p>
          </div>
        </div>

        {/* Section 4: App Purpose */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-850 space-y-4 shadow-md font-sans">
          <h2 className="text-base sm:text-lg font-bold text-white font-display border-b border-slate-800/80 pb-3">
            4. Sobre a Finalidade do Aplicativo Vocentro
          </h2>

          <p className="text-slate-300 text-xs leading-relaxed">
            O <strong className="text-white">Vocentro</strong> é uma plataforma de Inteligência Artificial para carreira e desenvolvimento profissional. Permite que os usuários encontrem vagas de emprego compatíveis, otimizem seus currículos para robôs de triagem de RH (ATS) no padrão STAR, simulem entrevistas de emprego interativas e gerenciem suas candidaturas em um painel Kanban.
          </p>
        </div>

        {/* Section 5: Institutional Links & Contact */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg font-sans">
          <h2 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3">
            5. Documentos Institucionais & Contato
          </h2>

          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline inline-flex items-center gap-1.5 py-1 px-2 min-h-[32px]">
              📄 Política de Privacidade do Vocentro
            </a>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline inline-flex items-center gap-1.5 py-1 px-2 min-h-[32px]">
              ⚖️ Termos de Uso do Vocentro
            </a>
            <a href="mailto:contato@vocentro.com.br" className="text-brand-accent hover:underline inline-flex items-center gap-1.5 py-1 px-2 min-h-[32px]">
              <Mail size={14} />
              contato@vocentro.com.br
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 py-4 font-sans">
          © 2026 Vocentro. Todos os direitos reservados.
        </div>

      </div>
    </div>
  );
}
