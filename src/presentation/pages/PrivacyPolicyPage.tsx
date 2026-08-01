import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Lock, CheckCircle2, FileText } from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
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
          OAuth & Privacy Verified
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-slate-800 light:border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 light:text-emerald-700 text-xs font-bold font-mono">
            <ShieldCheck size={14} />
            <span>Documentação Oficial de Privacidade</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-100 light:text-slate-900">
            Política de Privacidade - Vocentro
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a aplicação Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-400 light:text-blue-700" />
            1. Introdução
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            A aplicação <strong className="text-slate-200 light:text-slate-800">Vocentro</strong> respeita a privacidade dos seus usuários e está plenamente comprometida com a proteção dos seus dados pessoais. Esta Política de Privacidade explica de forma transparente como coletamos, utilizamos, armazenamos e protegemos suas informações ao utilizar a plataforma <strong className="text-slate-200 light:text-slate-800">Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-blue-400 light:text-blue-700 hover:underline">https://vocentro.com.br</a>).
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            2. Coleta de Dados e Login com o Google
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Ao utilizar o recurso de login com o Google no <strong className="text-slate-200 light:text-slate-800">Vocentro</strong>, coletamos única e exclusivamente as informações básicas de perfil autorizadas pelo provedor OAuth:
          </p>
          <ul className="space-y-2 text-xs text-slate-400 light:text-slate-600 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-slate-300 light:text-slate-700">Nome Completo:</strong> Utilizado para identificação e saudação na plataforma.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-slate-300 light:text-slate-700">Endereço de E-mail:</strong> Utilizado para autenticar sua conta com segurança.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-slate-300 light:text-slate-700">Foto de Perfil (Avatar):</strong> Utilizada para personalizar seu painel interno.</span>
            </li>
          </ul>
          <p className="text-xs text-amber-400 light:text-amber-800 bg-amber-500/10 light:bg-amber-50 p-3 rounded-lg border border-amber-500/20 light:border-amber-300 mt-3 font-medium">
            <strong>Importante:</strong> O Vocentro NÃO solicita, NÃO lê e NÃO acessa seus e-mails do Gmail, arquivos do Google Drive, contatos ou qualquer outro dado privado da sua conta Google.
          </p>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Lock size={18} className="text-blue-400 light:text-blue-700" />
            3. Uso das Informações
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Os dados coletados do Google ou fornecidos no cadastro por e-mail são utilizados estritamente para:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 light:text-slate-600 pl-2">
            <li>Autenticar o usuário e manter sua sessão segura na plataforma Vocentro;</li>
            <li>Permitir o gerenciamento do seu perfil profissional, currículos e candidaturas;</li>
            <li>Fornecer suporte técnico e comunicações essenciais sobre sua conta.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-rose-400" />
            4. Compartilhamento e Venda de Dados
          </h2>
          <div className="p-4 rounded-xl bg-rose-500/10 light:bg-rose-50 border border-rose-500/20 light:border-rose-300 text-rose-300 light:text-rose-800 text-xs font-semibold leading-relaxed">
            Declaramos expressamente que <strong>não compartilhamos, não vendemos, não alugamos e não comercializamos</strong> dados pessoais ou informações dos usuários do Vocentro com quaisquer terceiros, anunciantes ou empresas parceiras.
          </div>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Lock size={18} className="text-emerald-500" />
            5. Armazenamento, Criptografia e Exclusão de Dados
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Todos os dados são armazenados em infraestrutura segura com criptografia de ponta a ponta (SSL/TLS em trânsito e criptografia AES no banco de dados).
          </p>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            O usuário tem o direito integral de solicitar a alteração ou exclusão definitiva de sua conta e de todos os seus dados armazenados a qualquer momento, diretamente pelas configurações do app ou entrando em contato com nosso suporte.
          </p>
        </section>

        {/* Section 6 */}
        <section className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Mail size={18} className="text-blue-400 light:text-blue-700 shrink-0" />
            6. Contato e Encarregado de Privacidade
          </h2>
          <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
            Em caso de dúvidas sobre esta Política de Privacidade ou solicitações referentes aos seus dados pessoais, entre em contato com nosso suporte oficial:
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
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • Política de Privacidade conforme LGPD e Google OAuth Policies.</p>
      </footer>
    </div>
  );
};
