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
          OAuth & Privacy Verified
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] text-xs font-bold font-mono">
            <ShieldCheck size={14} />
            <span>Documentação Oficial de Privacidade</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#F8FAFC]">
            Política de Privacidade - Vocentro
          </h1>
          <p className="text-xs text-[#CBD5E1] font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a aplicação Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1: Introdução */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <FileText size={18} className="text-[#3B82F6]" />
            1. Introdução
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            A aplicação <strong>Vocentro</strong> respeita a privacidade dos seus usuários e está plenamente comprometida com a proteção dos seus dados pessoais. Esta Política de Privacidade explica de forma transparente como coletamos, utilizamos, armazenamos e protegemos suas informações ao utilizar a plataforma <strong>Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-[#3B82F6] hover:underline">https://vocentro.com.br</a>).
          </p>
        </section>

        {/* Section 2: Coleta de Dados */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#22C55E]" />
            2. Coleta de Dados e Login com o Google
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Ao utilizar o recurso de login com o Google no <strong>Vocentro</strong>, coletamos única e exclusivamente as informações básicas de perfil autorizadas pelo provedor OAuth:
          </p>
          <ul className="space-y-2 text-xs text-[#CBD5E1] pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
              <span><strong>Nome Completo:</strong> Utilizado para identificação e saudação na plataforma.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
              <span><strong>Endereço de E-mail:</strong> Utilizado para autenticar sua conta com segurança.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
              <span><strong>Foto de Perfil (Avatar):</strong> Utilizada para personalizar seu painel interno.</span>
            </li>
          </ul>
          <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mt-3 font-medium">
            <strong>Importante:</strong> O Vocentro NÃO solicita, NÃO lê e NÃO acessa seus e-mails do Gmail, arquivos do Google Drive, contatos ou qualquer outro dado privado da sua conta Google.
          </p>
        </section>

        {/* Section 3: Uso das Informações */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <Lock size={18} className="text-[#3B82F6]" />
            3. Uso das Informações
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Os dados coletados do Google ou fornecidos no cadastro por e-mail são utilizados estritamente para:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-[#CBD5E1] pl-2">
            <li>Autenticar o usuário e manter sua sessão segura na plataforma Vocentro;</li>
            <li>Permitir o gerenciamento do seu perfil profissional, currículos e candidaturas;</li>
            <li>Fornecer suporte técnico e comunicações essenciais sobre sua conta.</li>
          </ul>
        </section>

        {/* Section 4: Compartilhamento de Dados */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck size={18} className="text-rose-400" />
            4. Compartilhamento e Venda de Dados
          </h2>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold leading-relaxed">
            Declaramos expressamente que <strong>não compartilhamos, não vendemos, não alugamos e não comercializamos</strong> dados pessoais ou informações dos usuários do Vocentro com quaisquer terceiros, anunciantes ou empresas parceiras.
          </div>
        </section>

        {/* Section 5: Armazenamento e Segurança */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <Lock size={18} className="text-[#22C55E]" />
            5. Armazenamento, Criptografia e Exclusão de Dados
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Todos os dados são armazenados em infraestrutura segura com criptografia de ponta a ponta (SSL/TLS em trânsito e criptografia AES no banco de dados).
          </p>
          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            O usuário tem o direito integral de solicitar a alteração ou exclusão definitiva de sua conta e de todos os seus dados armazenados a qualquer momento, diretamente pelas configurações do app ou entrando em contato com nosso suporte.
          </p>
        </section>

        {/* Section 6: Contato */}
        <section className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <Mail size={18} className="text-[#3B82F6]" />
            6. Contato e Encarregado de Privacidade
          </h2>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Em caso de dúvidas sobre esta Política de Privacidade ou solicitações referentes aos seus dados pessoais, entre em contato conosco através dos nossos e-mails oficiais de suporte:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 text-xs font-bold">
            <a href="mailto:suporte@vocentro.com.br" className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[#3B82F6] hover:underline flex items-center gap-2">
              <Mail size={15} /> suporte@vocentro.com.br
            </a>
            <a href="mailto:contato@vocentro.com.br" className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[#3B82F6] hover:underline flex items-center gap-2">
              <Mail size={15} /> contato@vocentro.com.br
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#020617] py-8 px-6 text-center text-xs text-[#CBD5E1]">
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • Política de Privacidade conforme LGPD e Google OAuth Policies.</p>
      </footer>
    </div>
  );
};
