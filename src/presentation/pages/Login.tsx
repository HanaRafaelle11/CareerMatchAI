import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signUpSchema } from '../../domain/validators/schemas';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';

interface LoginProps {
  initialMode?: 'login' | 'signup';
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (fullName: string, email: string, password: string) => Promise<any>;
  onOAuth: (provider: 'google' | 'github') => Promise<void>;
  onResetPassword?: (email: string) => Promise<any>;
  onBack?: () => void;
}

export function Login({ initialMode = 'login', onLogin, onSignUp, onOAuth, onResetPassword, onBack }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setIsResetPasswordMode(false);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  });

  const formatAuthError = (err: any, inputEmail?: string): string => {
    const msg = err?.message || err?.error_description || String(err || '');
    const code = err?.code || '';

    if (code === 'user_already_exists' || msg.toLowerCase().includes('user already registered') || msg.toLowerCase().includes('already registered')) {
      return 'Este e-mail já está cadastrado no Vocentro. Por favor, faça login com sua senha ou utilize a opção "Entrar com o Google".';
    }
    if (code === 'invalid_credentials' || msg.toLowerCase().includes('invalid login credentials')) {
      const isTypoSuspect = inputEmail && (inputEmail.includes('gmaill') || inputEmail.includes('hotmaill') || inputEmail.includes('outlok'));
      return `E-mail ou senha incorretos. ${
        isTypoSuspect 
          ? `Atenção: o e-mail "${inputEmail}" parece conter um erro de digitação no domínio.` 
          : 'Se você ainda não criou uma conta com este e-mail, clique abaixo em "Cadastre-se agora" para criar seu acesso em 1 minuto.'
      } Caso tenha esquecido sua senha, utilize a opção "Esqueceu a senha?".`;
    }
    if (msg.toLowerCase().includes('email not confirmed')) {
      return 'E-mail ainda não confirmado. Por favor, verifique a caixa de entrada do seu e-mail para ativar sua conta no Vocentro.';
    }
    if (msg.toLowerCase().includes('password should be at least')) {
      return 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (msg.toLowerCase().includes('email rate limit exceeded')) {
      return 'Limite de solicitações atingido. Por favor, aguarde um instante antes de tentar novamente.';
    }
    return msg || 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
  };

  const handleInvalidFormSubmit = (errors: any) => {
    const firstErrKey = Object.keys(errors)[0];
    if (firstErrKey && errors[firstErrKey]?.message) {
      setErrorMsg(String(errors[firstErrKey]?.message));
    }
  };

  const handleLoginSubmit = async (data: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await onLogin(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err, data.email));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (data: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await onSignUp(data.fullName, data.email, data.password);
      if (res?.status === 'needs_confirmation') {
        setSuccessMsg(`Cadastro realizado com sucesso! Enviamos um e-mail de confirmação para ${data.email}. Por favor, verifique sua caixa de entrada para ativar sua conta.`);
      } else {
        setSuccessMsg('Cadastro realizado com sucesso! Acessando sua conta...');
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err, data.email));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!resetEmail || !resetEmail.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido para redefinição de senha.');
      return;
    }
    setLoading(true);
    try {
      if (onResetPassword) {
        await onResetPassword(resetEmail);
      }
      setSuccessMsg(`Instruções de redefinição enviadas para ${resetEmail}. Verifique sua caixa de entrada e pasta de spam.`);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err, resetEmail));
    } finally {
      setLoading(false);
    }
  };

  /*
  const handleOAuthClick = async (provider: 'google' | 'github') => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await onOAuth(provider);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };
  */

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden font-sans">
      {/* Luzes decorativas de fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full sm:w-[440px] max-w-full z-10 flex flex-col gap-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="self-start text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors -mb-3 cursor-pointer select-none py-1.5 px-2 rounded-lg"
          >
            ← Voltar para o início
          </button>
        )}
        {/* Cabeçalho */}
        <div className="text-center flex flex-col items-center">
          <VocentroLogo className="mb-3" showText={true} variant="vertical" />
          <p className="text-xs text-slate-400 mt-2 max-w-[340px] leading-relaxed">
            Sua carreira. Você no centro das melhores oportunidades do mercado profissional.
          </p>
        </div>

        {/* Card Principal */}
        <div className="premium-card p-7 sm:p-8 rounded-[20px] relative w-full flex flex-col gap-5 bg-slate-900 border border-slate-800 shadow-xl">
          {errorMsg && (
            <div className="p-4 rounded-[14px] bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs leading-relaxed">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400 text-xs leading-relaxed">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isResetPasswordMode ? (
            /* Formulário de Redefinição de Senha */
            <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <KeyRound size={16} className="text-brand-400" />
                  Redefinir sua senha
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Informe o e-mail cadastrado na plataforma para receber o link de redefinição de senha.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">E-mail cadastrado</label>
                <div className="relative w-full">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="voce@exemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-1"
              >
                {loading ? 'Enviando e-mail...' : 'Enviar link de redefinição'}
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordMode(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors text-center cursor-pointer mt-1"
              >
                ← Voltar para a tela de login
              </button>
            </form>
          ) : isSignUp ? (
            /* Formulário Cadastro */
            <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit, handleInvalidFormSubmit)} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">Nome Completo</label>
                <div className="relative w-full">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    {...signUpForm.register('fullName')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
                {signUpForm.formState.errors.fullName && (
                  <p className="text-[10px] text-red-400">{signUpForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">E-mail</label>
                <div className="relative w-full">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    {...signUpForm.register('email')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-[10px] text-red-400">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">Senha</label>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register('password')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="text-[10px] text-red-400">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">Confirmar Senha</label>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register('confirmPassword')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-[10px] text-red-400">{signUpForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-2 min-h-[44px]"
              >
                {loading ? 'Criando conta...' : 'Cadastrar'}
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            /* Formulário Login */
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit, handleInvalidFormSubmit)} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">E-mail</label>
                <div className="relative w-full">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    {...loginForm.register('email')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-[10px] text-red-400">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex justify-between items-center w-full">
                  <label className="text-xs font-semibold text-slate-400">Senha</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPasswordMode(true);
                      setResetEmail(loginForm.getValues('email') || '');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline cursor-pointer font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-slate-950/50 border border-slate-800 focus:border-brand-accent outline-none text-sm transition-all"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-[10px] text-red-400">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-1 min-h-[44px]"
              >
                {loading ? 'Acessando...' : 'Entrar'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Divisor & Botão Google Auth */}
          {!isResetPasswordMode && (
            <div className="w-full space-y-4 pt-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative bg-[#121929] px-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  ou continue com
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setErrorMsg('');
                  setLoading(true);
                  try {
                    await onOAuth('google');
                  } catch (err: any) {
                    setErrorMsg(formatAuthError(err));
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3 px-4 rounded-[14px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50 min-h-[44px]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Entrar com o Google</span>
              </button>
            </div>
          )}


        </div>

        {/* Footer Link */}
        {!isResetPasswordMode && (
          <p className="text-center text-xs text-slate-400 font-sans">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não possui uma conta?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-brand-accent hover:underline font-semibold ml-1.5 focus:outline-none cursor-pointer"
            >
              {isSignUp ? 'Faça login' : 'Cadastre-se agora gratuitamente'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
