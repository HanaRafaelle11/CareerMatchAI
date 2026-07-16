import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signUpSchema } from '../../domain/validators/schemas';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { VocentroLogo } from '../components/ds/MyCareerIcons';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (fullName: string, email: string, password: string) => Promise<void>;
  onOAuth: (provider: 'google' | 'github') => Promise<void>;
  onBack?: () => void;
}

export function Login({ onLogin, onSignUp, onOAuth, onBack }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  });

  const handleLoginSubmit = async (data: any) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await onLogin(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (data: any) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await onSignUp(data.fullName, data.email, data.password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'google' | 'github') => {
    setErrorMsg('');
    setLoading(true);
    try {
      await onOAuth(provider);
    } catch (err: any) {
      setErrorMsg(err.message || `Erro ao entrar com o ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden font-sans">
      {/* Luzes decorativas de fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full sm:w-[420px] max-w-full z-10 flex flex-col gap-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="self-start text-[10.5px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors -mb-3 cursor-pointer select-none"
          >
            ← Voltar para o início
          </button>
        )}
        {/* Cabeçalho */}
        <div className="text-center flex flex-col items-center">
          <VocentroLogo className="mb-3" showText={true} variant="vertical" />
          <p className="text-xs text-slate-400 mt-3 max-w-[320px] leading-relaxed">
            Sua carreira. Você no centro das melhores oportunidades do mercado profissional.
          </p>
        </div>

        {/* Card Principal */}
        <div className="premium-card p-8 rounded-[20px] relative w-full flex flex-col gap-5 bg-slate-900 border border-slate-800">
          {errorMsg && (
            <div className="p-4 rounded-[14px] bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSignUp ? (
            /* Formulário Cadastro */
            <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-400">Nome Completo</label>
                <div className="relative w-full">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="João da Silva"
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
                className="w-full py-3.5 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Criando conta...' : 'Cadastrar'}
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            /* Formulário Login */
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="flex flex-col gap-4 w-full">
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
                  <a href="#" className="text-[10px] text-brand-accent hover:underline">Esqueceu a senha?</a>
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
                className="w-full py-3.5 px-4 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Acessando...' : 'Entrar'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Divisor */}
          <div className="relative flex items-center justify-center w-full my-2">
            <span className="absolute w-full h-[1px] bg-slate-800" />
            <span className="relative px-3 text-[10px] uppercase font-bold text-slate-500 bg-slate-900 rounded-full select-none font-mono">
              Ou continue com
            </span>
          </div>

          {/* OAuth Buttons */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => handleOAuthClick('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3.5 px-4 w-full rounded-[14px] bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Entrar com o Google
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 mt-2 font-sans">
          {isSignUp ? 'Já tem uma conta?' : 'Não possui uma conta?'}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-brand-accent hover:underline font-semibold ml-1.5 focus:outline-none cursor-pointer"
          >
            {isSignUp ? 'Faça login' : 'Cadastre-se agora'}
          </button>
        </p>
      </div>
    </div>
  );
}
