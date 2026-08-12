import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const applyThemeToDOM = (targetTheme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  // Atualização síncrona e imediata das classes e atributos no DOM
  root.setAttribute('data-theme', targetTheme);
  body.setAttribute('data-theme', targetTheme);

  if (targetTheme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
    body.classList.add('light');
    body.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
    body.classList.add('dark');
    body.classList.remove('light');
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'dark';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    const active = theme === 'system' ? getSystemTheme() : theme;
    // Aplicar no DOM no instante da montagem inicial
    applyThemeToDOM(active);
    return active;
  });

  // Função de troca síncrona e imediata acionada no clique do botão
  const setTheme = (newTheme: Theme) => {
    const activeTheme = newTheme === 'system' ? getSystemTheme() : newTheme;

    // 1. Aplicação IMEDIATA e síncrona no DOM no mesmo evento do clique (0ms de atraso)
    applyThemeToDOM(activeTheme);

    // 2. Atualização dos estados do React
    setThemeState(newTheme);
    setEffectiveTheme(activeTheme);

    // 3. Persistência e notificação
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: newTheme } }));
  };

  const toggleTheme = () => {
    const nextTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  useEffect(() => {
    // Sincronização inicial do DOM para garantir o estado correto
    const activeTheme = theme === 'system' ? getSystemTheme() : theme;
    applyThemeToDOM(activeTheme);

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newSystemTheme = e.matches ? 'light' : 'dark';
        applyThemeToDOM(newSystemTheme);
        setEffectiveTheme(newSystemTheme);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', handleSystemChange);

    const handleExternalThemeChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const newTheme = detail?.theme || (localStorage.getItem('theme') as Theme | null);
      if (newTheme && ['light', 'dark', 'system'].includes(newTheme)) {
        const active = newTheme === 'system' ? getSystemTheme() : (newTheme as 'light' | 'dark');
        applyThemeToDOM(active);
        setThemeState(newTheme as Theme);
        setEffectiveTheme(active);
      }
    };

    window.addEventListener('theme-change', handleExternalThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('theme-change', handleExternalThemeChange);
    };
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
