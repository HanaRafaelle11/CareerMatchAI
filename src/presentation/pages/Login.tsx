import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
import { ThemeToggle } from '../components/ThemeToggle';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface LoginProps {
  initialMode?: 'login' | 'signup';
  onLogin: (email: string, pass: string) => Promise<any>;
  onSignUp: (email: string, pass: string, fullName: string) => Promise<any>;
  onOAuth: (provider: 'google') => Promise<any>;
  onResetPassword?: (email: string) => Promise<any>;
  onBack?: () => void;
}

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function Login({ initialMode = 'login', onLogin, onSignUp, onOAuth, onResetPassword, onBack }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  });

  const formatAuthError = (err: any): string => {
    console.error('[Auth Error Details]', err);
    const message = err?.message || err?.error_description || String(err);

    if (message.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }
    if (message.includes('User already registered')) {
      return 'Este e-mail já está cadastrado. Faça login ou solicite a redefinição de senha.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
    }
    if (message.includes('Password should be at least')) {
      return 'A senha precisa ter no mínimo 6 caracteres.';
    }
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Erro de conexão. Verifique sua internet ou tente novamente em instantes.';
    }
    return message || 'Ocorreu um erro durante a autenticação. Tente novamente.';
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await onLogin(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (data: SignUpFormData) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await onSignUp(data.email, data.password, data.fullName);
      setSuccessMsg('Conta criada com sucesso! Redirecionando...');
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido para redefinir a senha.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (onResetPassword) {
        await onResetPassword(resetEmail);
      }
      setSuccessMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidFormSubmit = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      setErrorMsg(firstError.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Luzes decorativas de fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full sm:w-[440px] max-w-full z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between w-full">
          {onBack ? (
            <button 
              onClick={onBack}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer select-none py-1.5 px-2 rounded-lg"
            >
              ← Voltar ao início
            </button>
          ) : <div />}
          <ThemeToggle />
        </div>

        {/* Cabeçalho */}
        <div className="text-center flex flex-col items-center">
          <VocentroLogo className="mb-3" showText={true} variant="vertical" />
          <p className="text-xs text-muted-foreground mt-2 max-w-[340px] leading-relaxed">
            Sua carreira. Você no centro das melhores oportunidades do mercado profissional.
          </p>
        </div>

        {/* Card Principal */}
        <div className="p-7 sm:p-8 rounded-[20px] relative w-full flex flex-col gap-5 bg-card border border-border shadow-xl">
          {errorMsg && (
            <div className="p-4 rounded-[14px] bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-500 text-xs leading-relaxed">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-500 text-xs leading-relaxed">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isResetPasswordMode ? (
            /* Formulário de Redefinição de Senha */
            <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <KeyRound size={16} className="text-brand-500" />
                  Redefinir sua senha
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Informe o e-mail cadastrado na plataforma para receber o link de redefinição de senha.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-muted-foreground">E-mail cadastrado</label>
                <div className="relative w-full">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="voce@exemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
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
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer mt-1"
              >
                ← Voltar para a tela de login
              </button>
            </form>
          ) : isSignUp ? (
            /* Formulário Cadastro */
            <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit, handleInvalidFormSubmit)} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-muted-foreground">Nome Completo</label>
                <div className="relative w-full">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    {...signUpForm.register('fullName')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
                {signUpForm.formState.errors.fullName && (
                  <p className="text-[10px] text-red-500">{signUpForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-muted-foreground">E-mail</label>
                <div className="relative w-full">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    {...signUpForm.register('email')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-[10px] text-red-500">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-muted-foreground">Senha</label>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register('password')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="text-[10px] text-red-500">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-muted-foreground">Confirmar Senha</label>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register('confirmPassword')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-[10px] text-red-500">{signUpForm.formState.errors.confirmPassword.message}</p>
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
                <label className="text-xs font-semibold text-muted-foreground">E-mail</label>
                <div className="relative w-full">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    {...loginForm.register('email')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-[10px] text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex justify-between items-center w-full">
                  <label className="text-xs font-semibold text-muted-foreground">Senha</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPasswordMode(true);
                      setResetEmail(loginForm.getValues('email') || '');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-brand-500 hover:underline cursor-pointer font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-card border border-border focus:border-brand-500 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-[10px] text-red-500">{loginForm.formState.errors.password.message}</p>
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
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative bg-card px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
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
                className="w-full py-3 px-4 rounded-[14px] bg-card/80 hover:bg-card border border-border text-foreground font-semibold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50 min-h-[44px]"
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
          <p className="text-center text-xs text-muted-foreground font-sans">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não possui uma conta?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-brand-500 hover:underline font-semibold ml-1.5 focus:outline-none cursor-pointer"
            >
              {isSignUp ? 'Faça login' : 'Cadastre-se agora gratuitamente'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
