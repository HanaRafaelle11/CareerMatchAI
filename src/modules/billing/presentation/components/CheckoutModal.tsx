import { useState, useEffect, type FormEvent } from 'react';
import { 
  Sparkles, CheckCircle2, ShieldCheck, QrCode, 
  CreditCard, FileText, Copy, Check, ExternalLink, Loader2, ArrowRight, Lock
} from 'lucide-react';
import { BaseModal } from '../../../../presentation/components/ds/BaseModal';
import { useCheckout } from '../../application/hooks/useCheckout';
import type { BillingCycle, BillingType } from '../../domain/types/billingTypes';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export function CheckoutModal({ isOpen, onClose, userId, userEmail, userName }: CheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [billingType, setBillingType] = useState<BillingType>('PIX');

  // Form Fields
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Credit Card Fields
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState('');
  const [cardExpiryYear, setCardExpiryYear] = useState('');
  const [cardCcv, setCardCcv] = useState('');
  const [cardHolderCpf, setCardHolderCpf] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');

  const {
    executeCheckout,
    recoverPendingCheckout,
    checkoutResult,
    isLoading,
    error,
    isPolling,
    paymentConfirmed,
    resetCheckout
  } = useCheckout(userId);

  // Recuperar checkout pendente automaticamente se houver
  useEffect(() => {
    if (isOpen) {
      recoverPendingCheckout();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetCheckout();
    onClose();
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const payload: any = {
      planSlug: 'pro',
      billingCycle,
      billingType,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      mobilePhone: mobilePhone.replace(/\D/g, ''),
      name: userName || userEmail?.split('@')[0] || 'Candidato Vocentro'
    };

    if (billingType === 'CREDIT_CARD') {
      payload.creditCard = {
        holderName: cardHolderName,
        number: cardNumber.replace(/\s/g, ''),
        expiryMonth: cardExpiryMonth,
        expiryYear: cardExpiryYear.length === 2 ? `20${cardExpiryYear}` : cardExpiryYear,
        ccv: cardCcv
      };
      payload.creditCardHolderInfo = {
        name: cardHolderName,
        email: userEmail || '',
        cpfCnpj: (cardHolderCpf || cpfCnpj).replace(/\D/g, ''),
        postalCode: postalCode.replace(/\D/g, ''),
        addressNumber: addressNumber || '1',
        phone: mobilePhone.replace(/\D/g, '')
      };
    }

    await executeCheckout(payload);
  };

  const handleCopyPix = async () => {
    if (!checkoutResult?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(checkoutResult.pixCopyPaste);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar código PIX:', err);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidthClass="max-w-2xl"
      showCloseButton={true}
    >
      <div className="space-y-6 animate-fade-in font-sans">

        {/* ── Tela 1: Estado de Sucesso / Confirmação do Pagamento ── */}
        {paymentConfirmed ? (
          <div className="py-8 text-center space-y-5 animate-scale-up">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={46} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-extrabold text-xs">
                ASSINATURA PRO ATIVADA!
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                Parabéns, você agora é Vocentro Pro! 🚀
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Todos os recursos avançados de IA, simulações STAR ilimitadas e exportação de PDF foram liberados na sua conta.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Acessar Painel Pro</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : checkoutResult ? (

          /* ── Tela 2: Resultado da Cobrança Gerada (PIX ou Boleto) ── */
          <div className="space-y-6 py-2">
            <div className="text-center space-y-1 border-b border-border pb-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
                Cobrança Gerada com Sucesso
              </span>
              <h3 className="text-xl font-bold text-foreground mt-2">
                Conclua o Pagamento para Ativar o Pro
              </h3>
              <p className="text-xs text-muted-foreground">
                Valor Total: <strong className="text-foreground">R$ {checkoutResult.amount?.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>

            {/* Resultado do PIX */}
            {billingType === 'PIX' && (
              <div className="space-y-5 text-center">
                {checkoutResult.pixQrCodeUrl ? (
                  <div className="mx-auto w-48 h-48 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-slate-200">
                    <img 
                      src={checkoutResult.pixQrCodeUrl} 
                      alt="QR Code do PIX Asaas" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mx-auto w-48 h-48 bg-card border border-border rounded-2xl flex items-center justify-center text-muted-foreground">
                    <QrCode size={48} />
                  </div>
                )}

                {checkoutResult.pixCopyPaste && (
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-foreground block">Código PIX Copia e Cola:</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={checkoutResult.pixCopyPaste} 
                        className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                      >
                        {copiedPix ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Status de Polling */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-amber-500" />
                  <span>{isPolling ? 'Aguardando confirmação do pagamento em tempo real...' : 'Processando pagamento...'}</span>
                </div>
              </div>
            )}

            {/* Resultado do Boleto */}
            {billingType === 'BOLETO' && (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center">
                  <FileText size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">Boleto Bancário Gerado</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    A compensação ocorre normalmente em até 1 dia útil após o pagamento.
                  </p>
                </div>
                {checkoutResult.bankSlipUrl && (
                  <a
                    href={checkoutResult.bankSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <span>Visualizar / Baixar Boleto</span>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-semibold"
            >
              Fechar Janela
            </button>
          </div>
        ) : (

          /* ── Tela 3: Formulário SaaS Unificado (Benefícios + Ciclo + Forma de Pagamento) ── */
          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Cabecalho SaaS com Badge e Preço */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold text-[11px]">
                  <Sparkles size={13} />
                  <span>PLANO PRO VOCENTRO</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                  Eleve sua busca de emprego a nível Pro
                </h2>
              </div>

              {/* Seletor de Ciclo (Semanal / Mensal) */}
              <div className="flex items-center bg-card p-1 rounded-xl border border-border shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('WEEKLY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'WEEKLY' ? 'bg-brand-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Semanal (R$ 9,90/sem)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'MONTHLY' ? 'bg-brand-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Mensal (R$ 29,90/mês)</span>
                  <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                    Mais Vantajoso (Economize 30%)
                  </span>
                </button>
              </div>
            </div>

            {/* Grade de Benefícios do Plano Pro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-card/60 border border-border rounded-2xl text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Simulações de Entrevista STAR Ilimitadas</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Matching IA Avançado Gemini</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Exportação de Currículo PDF Customizado</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Até 10 Versões Salvas do Currículo</span>
              </div>
            </div>

            {/* Mensagem de Erro (se houver) */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Seletor do Método de Pagamento */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Escolha a Forma de Pagamento:</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillingType('PIX')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    billingType === 'PIX' 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-md' 
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <QrCode size={20} />
                  <span>PIX Instantâneo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType('CREDIT_CARD')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    billingType === 'CREDIT_CARD' 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500 shadow-md' 
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CreditCard size={20} />
                  <span>Cartão de Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType('BOLETO')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    billingType === 'BOLETO' 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500 shadow-md' 
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText size={20} />
                  <span>Boleto Bancário</span>
                </button>
              </div>
            </div>

            {/* Campos Obrigatórios para Emissão de Fatura / Asaas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground block">CPF ou CNPJ do Pagador *</label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground block">Celular / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={mobilePhone}
                  onChange={e => setMobilePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Formulário Específico para Cartão de Crédito */}
            {billingType === 'CREDIT_CARD' && (
              <div className="p-4 rounded-2xl bg-card/80 border border-border space-y-3 text-xs animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-2">
                  <Lock size={14} className="text-emerald-500" />
                  <span>Dados Seguros do Cartão</span>
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground block">Nome Impresso no Cartão *</label>
                  <input
                    type="text"
                    required
                    placeholder="COMO CONSTA NO CARTÃO"
                    value={cardHolderName}
                    onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground block">Número do Cartão *</label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-muted-foreground block">Mês (MM) *</label>
                    <input
                      type="text"
                      required
                      placeholder="08"
                      maxLength={2}
                      value={cardExpiryMonth}
                      onChange={e => setCardExpiryMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block">Ano (AA) *</label>
                    <input
                      type="text"
                      required
                      placeholder="28"
                      maxLength={4}
                      value={cardExpiryYear}
                      onChange={e => setCardExpiryYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block">CVV *</label>
                    <input
                      type="password"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={cardCcv}
                      onChange={e => setCardCcv(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 text-center font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-muted-foreground block">CPF Titular</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cardHolderCpf}
                      onChange={e => setCardHolderCpf(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block">CEP do Titular *</label>
                    <input
                      type="text"
                      required
                      placeholder="00000-000"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block">Nº Res. *</label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      value={addressNumber}
                      onChange={e => setAddressNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé com Selo de Segurança e Botão de Confirmação */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Gerando cobrança segura no Asaas...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Assinatura Pro — {billingCycle === 'WEEKLY' ? 'R$ 9,90/semana' : 'R$ 29,90/mês'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Processamento criptografado via Asaas Pagamentos • Cancele quando quiser</span>
              </div>
            </div>

          </form>
        )}

      </div>
    </BaseModal>
  );
}
