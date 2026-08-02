import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Lock, CheckCircle2, FileText } from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg bg-card border border-border hover:bg-card/80 text-foreground transition-colors cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none"
            aria-label="Voltar para a página inicial do Vocentro"
          >
            <ArrowLeft size={18} />
          </button>
          <VocentroLogo className="h-7" showText={true} />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold hidden sm:inline-block">
            OAuth & Privacy Verified
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold font-mono">
            <ShieldCheck size={14} />
            <span>Documentação Oficial de Privacidade</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
            Política de Privacidade - Vocentro
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a aplicação Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-brand-500" />
            1. Introdução
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A aplicação <strong className="text-foreground">Vocentro</strong> respeita a privacidade dos seus usuários e está plenamente comprometida com a proteção dos seus dados pessoais. Esta Política de Privacidade explica de forma transparente como coletamos, utilizamos, armazenamos e protegemos suas informações ao utilizar a plataforma <strong className="text-foreground">Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-brand-500 hover:underline">https://vocentro.com.br</a>).
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            2. Coleta de Dados e Login com o Google
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao utilizar o recurso de login com o Google no <strong className="text-foreground">Vocentro</strong>, coletamos única e exclusivamente as informações básicas de perfil autorizadas pelo provedor OAuth:
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-foreground">Nome Completo:</strong> Utilizado para identificação e saudação na plataforma.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-foreground">Endereço de E-mail:</strong> Utilizado para autenticar sua conta com segurança.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-foreground">Foto de Perfil (Avatar):</strong> Utilizada para personalizar seu painel interno.</span>
            </li>
          </ul>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mt-3 font-medium">
            <strong>Importante:</strong> O Vocentro NÃO solicita, NÃO lê e NÃO acessa seus e-mails do Gmail, arquivos do Google Drive, contatos ou qualquer outro dado privado da sua conta Google.
          </p>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock size={18} className="text-brand-500" />
            3. Uso das Informações
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados coletados do Google ou fornecidos no cadastro por e-mail são utilizados estritamente para:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-2">
            <li>Autenticar o usuário e manter sua sessão segura na plataforma Vocentro;</li>
            <li>Permitir o gerenciamento do seu perfil profissional, currículos e candidaturas;</li>
            <li>Fornecer suporte técnico e comunicações essenciais sobre sua conta.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-rose-500" />
            4. Compartilhamento e Venda de Dados
          </h2>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold leading-relaxed">
            Declaramos expressamente que <strong>não compartilhamos, não vendemos, não alugamos e não comercializamos</strong> dados pessoais ou informações dos usuários do Vocentro com quaisquer terceiros, anunciantes ou empresas parceiras.
          </div>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock size={18} className="text-emerald-500" />
            5. Armazenamento, Criptografia e Exclusão de Dados
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todos os dados são armazenados em infraestrutura segura com criptografia de ponta a ponta (SSL/TLS em trânsito e criptografia AES no banco de dados).
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O usuário tem o direito integral de solicitar a alteração ou exclusão definitiva de sua conta e de todos os seus dados armazenados a qualquer momento, diretamente pelas configurações do app ou entrando em contato com nosso suporte.
          </p>
        </section>

        {/* Section 6 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Mail size={18} className="text-brand-500 shrink-0" />
            6. Contato e Encarregado de Privacidade
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Em caso de dúvidas sobre esta Política de Privacidade ou solicitações referentes aos seus dados pessoais, entre em contato com nosso suporte oficial:
          </p>
          <div className="pt-1">
            <a 
              href="mailto:suporte@vocentro.com.br" 
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border text-brand-500 font-bold text-xs sm:text-sm hover:border-brand-500 transition-all break-all"
            >
              <Mail size={16} className="shrink-0" />
              <span>suporte@vocentro.com.br</span>
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • Política de Privacidade conforme LGPD e Google OAuth Policies.</p>
      </footer>
    </div>
  );
};
