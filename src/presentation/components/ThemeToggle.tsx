import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [isLight, setIsLight] = useState(false);

  const applyTheme = (light: boolean) => {
    if (light) {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
  };

  useEffect(() => {
    const syncThemeState = () => {
      const savedTheme = localStorage.getItem('theme');
      const hasLightClass = document.documentElement.classList.contains('light');
      const isLightMode = savedTheme === 'light' || hasLightClass;
      setIsLight(isLightMode);
      applyTheme(isLightMode);
    };

    syncThemeState();
    window.addEventListener('theme-change', syncThemeState);
    return () => window.removeEventListener('theme-change', syncThemeState);
  }, []);

  const toggleTheme = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    applyTheme(nextLight);
    localStorage.setItem('theme', nextLight ? 'light' : 'dark');
    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border border-slate-700/60 dark:border-slate-800 light:border-slate-300 bg-slate-900/80 dark:bg-slate-900/80 light:bg-white text-amber-400 dark:text-amber-400 light:text-slate-700 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center ${className}`}
      aria-label={isLight ? "Alternar para Modo Escuro" : "Alternar para Modo Claro"}
      title={isLight ? "Alternar para Modo Escuro" : "Alternar para Modo Claro"}
    >
      {isLight ? (
        <Moon size={18} className="text-indigo-600 dark:text-indigo-400" />
      ) : (
        <Sun size={18} className="text-amber-400" />
      )}
    </button>
  );
}
