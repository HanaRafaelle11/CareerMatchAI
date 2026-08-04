import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Lock, CheckCircle2, FileText, Users, Scale, AlertTriangle } from 'lucide-react';
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

  React.useEffect(() => {
    if (window.location.hash === '#exclusao') {
      setTimeout(() => {
        const el = document.getElementById('exclusao');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, []);

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
            LGPD & Privacy Verified
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        {/* Page Title */}
        <div className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold font-mono">
            <ShieldCheck size={14} />
            <span>Documentação Oficial de Privacidade (Rascunho de Trabalho)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
            Política de Privacidade - Vocentro
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Válido para a plataforma Vocentro (https://vocentro.com.br)
          </p>
        </div>

        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-brand-500" />
            1. Introdução e Escopo
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A aplicação <strong className="text-foreground">Vocentro</strong> respeita a privacidade dos seus usuários e está plenamente comprometida com a proteção de dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD). Esta Política de Privacidade descreve de forma clara e transparente como coletamos, tratamos, armazenamos e protegemos suas informações ao utilizar a plataforma <strong className="text-foreground">Vocentro</strong> (disponível em <a href="https://vocentro.com.br" className="text-brand-500 hover:underline">https://vocentro.com.br</a>).
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users size={18} className="text-brand-500" />
            2. Idade Mínima para Uso
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O uso da plataforma Vocentro e a contratação de nossos serviços são destinados exclusivamente a pessoas físicas com idade igual ou superior a <strong className="text-foreground">18 (dezoito) anos completos</strong> ou emancipadas legalmente. Ao se cadastrar, você declara expressamente possuir capacidade civil plena para aceitar estes termos.
          </p>
        </section>

        {/* Section 3 - Novo item 1: Currículo */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-emerald-500" />
            3. Tratamento dos Dados do Currículo Profissional
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao enviar seu currículo em formato PDF ou texto para a plataforma, coletamos e processamos automatizadamente (via inteligência artificial) os seguintes dados profissionais:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-2">
            <li>Histórico profissional, experiências anteriores e cargos ocupados;</li>
            <li>Formação acadêmica, cursos, certificações e diplomas;</li>
            <li>Habilidades técnicas (hard skills), competências comportamentais e idiomas;</li>
            <li>Informações de contato públicas incluídas no documento (ex: LinkedIn, telefone).</li>
          </ul>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Recomendação sobre Dados Sensíveis:
            </p>
            <p>
              Orientamos que os usuários <strong>evitem incluir dados sensíveis desnecessários</strong> em seus currículos (como dados de saúde, convicção religiosa, filiação a sindicato ou partido político, dados genéticos ou biométricos). Esses dados não são o foco da análise e não são necessários para os serviços de Match e desenvolvimento profissional do Vocentro.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            4. Coleta de Dados de Cadastro e Login Google
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao se cadastrar diretamente ou através do recurso de login com o Google, coletamos apenas os dados essenciais para autenticação segura:
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-foreground">Nome Completo:</strong> Para identificação e personalização do seu painel.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-foreground">Endereço de E-mail:</strong> Para login seguro e comunicações de serviço.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span><strong className="text-foreground">Foto de Perfil:</strong> Para exibição no seu cabeçalho interno.</span>
            </li>
          </ul>
        </section>

        {/* Section 5 - Novo item 2: Terceiros Nominal */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users size={18} className="text-brand-500" />
            5. Compartilhamento com Processadores e Operadores Terceiros
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para operar a infraestrutura técnica da plataforma, contratamos fornecedores de tecnologia especializados que atuam como <strong>Operadores de Dados</strong> sob nossas instruções estritas. Declaramos nominalmente as principais categorias de parceiros técnicos:
          </p>
          <ul className="space-y-2.5 text-xs text-muted-foreground pt-1">
            <li className="p-3 rounded-xl bg-muted/40 border border-border">
              <strong className="text-foreground font-semibold">Google Cloud & Google Gemini AI:</strong> Processamento inteligente de currículos, cálculo de Match de vagas e sugestões de otimização de carreira via modelos de IA.
            </li>
            <li className="p-3 rounded-xl bg-muted/40 border border-border">
              <strong className="text-foreground font-semibold">Asaas Gestão Financeira S.A.:</strong> Gateway seguro contratado para processamento de pagamentos, cobranças recorrentes de assinatura e geração de PIX e faturas.
            </li>
            <li className="p-3 rounded-xl bg-muted/40 border border-border">
              <strong className="text-foreground font-semibold">Resend Inc.:</strong> Serviço infraestrutural responsável pelo envio de e-mails transacionais (como recuperação de senha, confirmações e resumo de vagas).
            </li>
          </ul>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 font-medium">
            <strong>Garantia Comercial:</strong> Estes parceiros atuam exclusivamente para viabilizar o funcionamento do serviço. O Vocentro <strong>NÃO vende, NÃO aluga e NÃO compartilha</strong> seus dados pessoais para fins comerciais ou publicitários de terceiros.
          </p>
        </section>

        {/* Section 6 - Novo item 3: Base Legal */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Scale size={18} className="text-brand-500" />
            6. Bases Legais de Tratamento (LGPD)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O tratamento dos seus dados pessoais é fundamentado nas hipóteses autorizativas do Artigo 7º da LGPD (Lei nº 13.709/2018):
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-2">
            <li><strong className="text-foreground">Execução de Contrato (Art. 7º, V):</strong> Para a prestação dos serviços contratados pelo usuário no Vocentro;</li>
            <li><strong className="text-foreground">Consentimento do Titular (Art. 7º, I):</strong> Para envio de comunicações de reengajamento e notificações personalizadas;</li>
            <li><strong className="text-foreground">Legítimo Interesse (Art. 7º, IX):</strong> Para aprimoramento da segurança, prevenção a fraudes e melhoria contínua dos algoritmos da plataforma.</li>
          </ul>
        </section>

        {/* Section 7 - Novo item 4: Retenção e Exclusão */}
        <section id="exclusao" className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock size={18} className="text-emerald-500" />
            7. Prazos de Retenção e Exclusão de Dados
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seus dados pessoais e currículos são mantidos armazenados com criptografia enquanto sua conta permanecer ativa na plataforma.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-2">
            <li><strong className="text-foreground">Exclusão Solicitada pelo Usuário:</strong> Você pode solicitar a exclusão da sua conta a qualquer momento nas configurações do aplicativo ou via suporte. Todos os seus dados pessoais e currículos serão deletados em até 30 (trinta) dias.</li>
            <li><strong className="text-foreground">Inatividade da Conta:</strong> Contas inativas sem qualquer acesso por mais de 24 (vinte e quatro) meses consecutivos poderão ter seus currículos arquivados ou descartados de forma automatizada e segura.</li>
          </ul>
        </section>

        {/* Section 8 - Novo item 5: Canal ANPD */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-500" />
            8. Direitos do Titular e Reclamação à ANPD
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nos termos da LGPD, você tem o direito de confirmar a existência de tratamento, acessar seus dados, corrigir informações incompletas e revogar o consentimento. Além do nosso suporte interno, você possui o direito de registrar petição ou reclamação diretamente perante a <strong className="text-foreground">Autoridade Nacional de Proteção de Dados (ANPD)</strong> através dos canais oficiais do Governo Federal (<a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline font-semibold">gov.br/anpd</a>).
          </p>
        </section>

        {/* Section 9 */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Mail size={18} className="text-brand-500 shrink-0" />
            9. Contato do Encarregado de Proteção de Dados (DPO)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para exercer seus direitos de titular ou esclarecer qualquer dúvida sobre o tratamento de seus dados, entre em contato direto com o nosso Encarregado de Privacidade:
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
