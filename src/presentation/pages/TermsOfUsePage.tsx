import React from 'react';
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';

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
            Termos & Condições
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-bold font-mono">
            <FileText size={14} />
            <span>Condições Gerais de Uso</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
            Termos de Uso - Vocentro
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a plataforma Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            1. Aceitação dos Termos
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao criar uma conta ou utilizar os serviços do <strong className="text-foreground">Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-brand-500 hover:underline">https://vocentro.com.br</a>), você concorda expressamente com os presentes Termos de Uso e com nossa Política de Privacidade.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-brand-500" />
            2. Descrição do Serviço
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O <strong className="text-foreground">Vocentro</strong> é uma plataforma de desenvolvimento profissional que utiliza Inteligência Artificial para orientar candidatos na busca por oportunidades de emprego. A plataforma oferece:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-2">
            <li>Busca inteligente e agregação de vagas de trabalho;</li>
            <li>Análise semântica e cálculo do Match da vaga (Match Score);</li>
            <li>Otimização de currículos para sistemas automatizados de seleção (ATS);</li>
            <li>Simulador interativo de entrevistas com feedback inteligente;</li>
            <li>Organização e acompanhamento de candidaturas em funil (Kanban).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            3. Regras de Conduta do Usuário
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao utilizar o Vocentro, o usuário se compromete a:
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground pt-1">
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
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            4. Limitação de Responsabilidade
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O <strong className="text-foreground">Vocentro</strong> atua como uma ferramenta facilitadora da jornada profissional do candidato. Não garantimos a contratação imediata nem possuímos vínculo empregatício com as empresas cujas vagas são disponibilizadas pelos portais parceiros.
          </p>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Mail size={18} className="text-brand-500 shrink-0" />
            5. Alterações e Contato
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reservamo-nos o direito de atualizar estes Termos de Uso periodicamente. Em caso de dúvidas, entre em contato:
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
        <p>© {new Date().getFullYear()} Vocentro. Todos os direitos reservados. • Termos de Uso da Aplicação.</p>
      </footer>
    </div>
  );
};
