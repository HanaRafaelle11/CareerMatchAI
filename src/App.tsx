import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './application/hooks/useAuth';
import { useUserPreferences } from './application/hooks/useUserPreferences';
import { Loader2 } from 'lucide-react';
import { VocentroLogo } from './presentation/components/ds/MyCareerIcons';

// ── Code Splitting: Lazy-load de todas as páginas públicas e privadas ──
const LandingPage = lazy(() => import('./presentation/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./presentation/pages/Login').then(m => ({ default: m.Login })));
const AboutPage = lazy(() => import('./presentation/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const GoogleAuthPage = lazy(() => import('./presentation/pages/GoogleAuthPage').then(m => ({ default: m.GoogleAuthPage })));
const PrivacyPolicyPage = lazy(() => import('./presentation/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfUsePage = lazy(() => import('./presentation/pages/TermsOfUsePage').then(m => ({ default: m.TermsOfUsePage })));
const FaqHelpPage = lazy(() => import('./presentation/pages/FaqHelpPage').then(m => ({ default: m.FaqHelpPage })));
const HowGoogleLoginWorksPage = lazy(() => import('./presentation/pages/HowGoogleLoginWorksPage').then(m => ({ default: m.HowGoogleLoginWorksPage })));
const PublicSurveyPage = lazy(() => import('./presentation/pages/PublicSurveyPage').then(m => ({ default: m.PublicSurveyPage })));

// 🔒 Authenticated App is strictly code-split to prevent post-login services from weighting the initial Landing Page paint
const AuthenticatedApp = lazy(() => import('./presentation/AuthenticatedApp').then(m => ({ default: m.AuthenticatedApp })));

function LazyFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
      <div className="p-3 rounded-full bg-slate-950 border border-slate-800 text-brand-500">
        <Loader2 className="animate-spin text-brand-500" size={24} />
      </div>
      <div className="text-center space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-355">Carregando Módulo</span>
        <p className="text-[10px] text-slate-550">Preparando interface e componentes inteligentes...</p>
      </div>
    </div>
  );
}

function App() {
  const { user, profile, loading, loginWithEmail, signUpWithEmail, loginWithOAuth, resetPasswordForEmail, logout, updateProfile } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAboutView, setIsAboutView] = useState(window.location.pathname === '/about');
  const [isGoogleAuthView, setIsGoogleAuthView] = useState(
    window.location.pathname === '/google-auth' || window.location.pathname === '/google-auth.html'
  );
  const [isHowGoogleLoginWorksView, setIsHowGoogleLoginWorksView] = useState(
    window.location.pathname === '/how-google-login-works' || window.location.pathname === '/how-google-login-works.html'
  );
  const [isFaqHelpView, setIsFaqHelpView] = useState(
    window.location.pathname === '/faq' || window.location.pathname === '/ajuda' || window.location.pathname === '/faq.html'
  );
  const [isPrivacyPolicyView, setIsPrivacyPolicyView] = useState(
    window.location.pathname === '/politica-de-privacidade' || window.location.pathname === '/politica-de-privacidade.html'
  );
  const [isTermsOfUseView, setIsTermsOfUseView] = useState(
    window.location.pathname === '/termos-de-uso' || window.location.pathname === '/termos-de-uso.html'
  );
  const [isPublicSurveyView] = useState(
    window.location.pathname === '/pesquisa' || window.location.pathname === '/survey' || window.location.search.includes('token=')
  );

  const { preferences, updatePreferences } = useUserPreferences(user?.id);

  // Synchronize visual theme on mount and on 'theme-change' / preferences update
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme') || preferences.theme || 'dark';
      const isDark = savedTheme === 'dark' || (savedTheme !== 'light' && !window.matchMedia('(prefers-color-scheme: light)').matches);
      
      const targetClass = isDark ? 'dark' : 'light';
      const currentClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

      if (targetClass !== currentClass) {
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);
        document.body.classList.toggle('dark', isDark);
        document.body.classList.toggle('light', !isDark);
      }
    };
    applyTheme();
    window.addEventListener('theme-change', applyTheme);
    return () => window.removeEventListener('theme-change', applyTheme);
  }, [preferences.theme]);


  // Observa mudanças de histórico
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/about') {
        setIsAboutView(true);
        setIsGoogleAuthView(false);
        setIsHowGoogleLoginWorksView(false);
        setIsPrivacyPolicyView(false);
        setIsTermsOfUseView(false);
        setIsFaqHelpView(false);
      } else if (path === '/how-google-login-works' || path === '/how-google-login-works.html') {
        setIsHowGoogleLoginWorksView(true);
        setIsAboutView(false);
        setIsGoogleAuthView(false);
        setIsPrivacyPolicyView(false);
        setIsTermsOfUseView(false);
        setIsFaqHelpView(false);
      } else if (path === '/google-auth' || path === '/google-auth.html') {
        setIsGoogleAuthView(true);
        setIsAboutView(false);
        setIsHowGoogleLoginWorksView(false);
        setIsPrivacyPolicyView(false);
        setIsTermsOfUseView(false);
        setIsFaqHelpView(false);
      } else if (path === '/politica-de-privacidade' || path === '/politica-de-privacidade.html') {
        setIsPrivacyPolicyView(true);
        setIsAboutView(false);
        setIsGoogleAuthView(false);
        setIsHowGoogleLoginWorksView(false);
        setIsTermsOfUseView(false);
        setIsFaqHelpView(false);
      } else if (path === '/termos-de-uso' || path === '/termos-de-uso.html') {
        setIsTermsOfUseView(true);
        setIsAboutView(false);
        setIsGoogleAuthView(false);
        setIsHowGoogleLoginWorksView(false);
        setIsPrivacyPolicyView(false);
        setIsFaqHelpView(false);
      } else if (path === '/faq' || path === '/ajuda' || path === '/faq.html') {
        setIsFaqHelpView(true);
        setIsAboutView(false);
        setIsGoogleAuthView(false);
        setIsHowGoogleLoginWorksView(false);
        setIsPrivacyPolicyView(false);
        setIsTermsOfUseView(false);
      } else {
        setIsAboutView(false);
        setIsGoogleAuthView(false);
        setIsHowGoogleLoginWorksView(false);
        setIsPrivacyPolicyView(false);
        setIsTermsOfUseView(false);
        setIsFaqHelpView(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden px-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        <div className="w-[calc(100%-32px)] max-w-sm sm:max-w-md p-5 sm:p-8 mx-auto rounded-2xl sm:rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center space-y-4 sm:space-y-6 relative shadow-2xl">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 rounded-full bg-brand-accent/15 blur-xl animate-pulse" />
            <div className="p-3.5 sm:p-5 rounded-full bg-slate-950 border border-slate-800 text-brand-accent shadow-xl relative z-10 flex items-center justify-center">
              <VocentroLogo className="h-8 w-8 sm:h-12 sm:w-12 animate-pulse" showText={false} variant="symbol" />
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2 font-sans px-2">
            <h3 className="font-display font-bold text-base sm:text-lg text-slate-200">Iniciando Vocentro</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">Autenticando sessão e conectando à plataforma...</p>
          </div>
          <div className="w-full max-w-[160px] sm:max-w-[200px] h-1 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent rounded-full animate-progress-loading" />
          </div>
        </div>
      </div>
    );
  }

  if (isHowGoogleLoginWorksView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <HowGoogleLoginWorksPage
          onBack={() => {
            window.history.pushState(null, '', '/');
            setIsHowGoogleLoginWorksView(false);
          }}
        />
      </Suspense>
    );
  }

  if (isFaqHelpView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <FaqHelpPage
          onBack={() => {
            window.history.pushState(null, '', '/');
            setIsFaqHelpView(false);
          }}
        />
      </Suspense>
    );
  }

  if (isPrivacyPolicyView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <PrivacyPolicyPage
          onBack={() => {
            window.history.pushState(null, '', '/');
            setIsPrivacyPolicyView(false);
          }}
        />
      </Suspense>
    );
  }

  if (isTermsOfUseView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <TermsOfUsePage
          onBack={() => {
            window.history.pushState(null, '', '/');
            setIsTermsOfUseView(false);
          }}
        />
      </Suspense>
    );
  }

  if (isPublicSurveyView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <PublicSurveyPage />
      </Suspense>
    );
  }

  if (isAboutView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <AboutPage
          onBack={() => {
            window.history.pushState(null, '', '/');
            setIsAboutView(false);
          }}
        />
      </Suspense>
    );
  }

  if (isGoogleAuthView) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <GoogleAuthPage
          onBack={() => {
            window.history.pushState(null, '', '/');
            setIsGoogleAuthView(false);
          }}
        />
      </Suspense>
    );
  }

  if (!user) {
    if (showAuth) {
      return (
        <Suspense fallback={<LazyFallback />}>
          <Login
            initialMode={authMode}
            onLogin={loginWithEmail}
            onSignUp={signUpWithEmail}
            onOAuth={loginWithOAuth}
            onResetPassword={resetPasswordForEmail}
            onBack={() => setShowAuth(false)}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<LazyFallback />}>
        <LandingPage 
          onNavigateToAuth={(mode = 'login') => {
            setAuthMode(mode);
            setShowAuth(true);
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LazyFallback />}>
      <AuthenticatedApp 
        user={user}
        profile={profile}
        logout={logout}
        updateProfile={updateProfile}
        preferences={preferences}
        updatePreferences={updatePreferences}
      />
    </Suspense>
  );
}

export default App;
