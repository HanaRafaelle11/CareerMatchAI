import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ArrowLeft, ShieldCheck, CheckCircle2, XCircle, Lock, Mail, ExternalLink, Trash2, Key } from 'lucide-react';

interface HowGoogleLoginWorksPageProps {
  onBack?: () => void;
}

export function HowGoogleLoginWorksPage({ onBack }: HowGoogleLoginWorksPageProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 font-sans p-6 md:p-12 relative overflow-x-hidden transition-colors duration-300">
      {/* Decorative gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vh] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Voltar para o início
        </button>

        {/* Header */}
        <div className="flex flex-col items-start gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-6">
          <VocentroLogo className="h-10 mb-2" showText={true} />
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] text-[10px] font-bold tracking-wider uppercase font-mono">
            Transparência & OAuth 2.0
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 font-display">
            Como Funciona o Login com Google no Vocentro
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans">
            Guia completo sobre a autenticação OAuth, permissões solicitadas, proteção de dados e revogação de acesso.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans">
          
          {/* 1. Por que usamos OAuth */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Key className="text-[#3B82F6]" size={20} />
              1. Por que utilizamos o Google OAuth?
            </h2>
            <p>
              O <strong>Vocentro</strong> utiliza o padrão internacional <strong>OAuth 2.0 da Google</strong> para oferecer uma experiência de entrada rápida, conveniente e altamente segura. Com o login do Google:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600">
              <li>Você cria sua conta em 1 clique sem precisar inventar e guardar novas senhas.</li>
              <li>Sua senha real da conta Google <strong>nunca é enviada ou conhecida</strong> pelo Vocentro.</li>
              <li>A autenticação é processada nos servidores seguros da própria Google.</li>
            </ul>
          </div>

          {/* 2. Permissões utilizadas vs NÃO utilizadas */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <ShieldCheck className="text-[#22C55E]" size={20} />
              2. Permissões Solicitadas vs Permissões NÃO Utilizadas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* O que solicitamos */}
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#22C55E] flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  Permissões que Solicitamos (Estritas):
                </h3>
                <ul className="space-y-1.5 text-xs text-emerald-300 dark:text-emerald-300 light:text-emerald-800 font-medium">
                  <li>✓ <strong>E-mail básico (email):</strong> Para criar sua conta e identificação.</li>
                  <li>✓ <strong>Nome (profile):</strong> Para saudações personalizadas no painel.</li>
                  <li>✓ <strong>Foto de avatar (profile):</strong> Para exibição visual do seu perfil.</li>
                </ul>
              </div>

              {/* O que NÃO solicitamos */}
              <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-500/10 light:bg-red-50 border border-red-500/30 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-red-400 dark:text-red-400 light:text-red-800 flex items-center gap-1.5">
                  <XCircle size={16} />
                  O que NUNCA Acessamos:
                </h3>
                <ul className="space-y-1.5 text-xs text-red-300 dark:text-red-300 light:text-red-800 font-medium">
                  <li>✕ <strong>Gmail / Mensagens:</strong> Zero leitura ou envio de e-mails.</li>
                  <li>✕ <strong>Google Drive:</strong> Zero leitura ou gravação de arquivos.</li>
                  <li>✕ <strong>Google Agenda / Contatos / Fotos:</strong> Zero acesso.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. Como revogar acesso */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Lock className="text-[#3B82F6]" size={20} />
              3. Como Revogar o Acesso do Vocentro a Qualquer Momento
            </h2>
            <p>
              Você mantém controle total sobre sua conta Google. Para desconectar o aplicativo Vocentro de sua conta Google:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300 dark:text-slate-300 light:text-slate-700">
              <li>Acesse a página oficial de segurança da Google: <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] font-bold hover:underline inline-flex items-center gap-1">https://myaccount.google.com/permissions <ExternalLink size={12} /></a></li>
              <li>Localize a lista de <strong>"Apps com acesso à sua conta"</strong>.</li>
              <li>Clique em <strong>Vocentro</strong> e selecione a opção <strong>"Remover acesso"</strong>.</li>
            </ol>
          </div>

          {/* 4. Exclusão de Conta */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Trash2 className="text-red-400" size={20} />
              4. Como Excluir sua Conta e Dados no Vocentro
            </h2>
            <p>
              Respeitamos o direito ao esquecimento previsto pela LGPD. Para excluir permanentemente sua conta e todos os dados associados (currículos, candidaturas e histórico):
            </p>
            <p className="text-slate-300 dark:text-slate-300 light:text-slate-700">
              Envie uma solicitação para <a href="mailto:suporte@vocentro.com.br" className="text-[#3B82F6] font-bold hover:underline">suporte@vocentro.com.br</a> com o assunto <em>"Exclusão de Conta"</em>. Sua conta e dados serão eliminados definitivamente em até 48 horas úteis.
            </p>
          </div>

          {/* 5. Contato */}
          <div className="p-6 rounded-[20px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-display">
              <Mail className="text-[#3B82F6]" size={20} />
              5. Dúvidas e Suporte
            </h2>
            <p>
              Dúvidas sobre o funcionamento do login ou sobre a privacidade dos seus dados? Entre em contato conosco:
            </p>
            <p className="font-semibold text-[#3B82F6]">
              suporte@vocentro.com.br
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
