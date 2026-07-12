import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const isLightMode = savedTheme === 'light' || (!savedTheme && systemPrefersLight);
    
    setIsLight(isLightMode);
    if (isLightMode) {
      document.body.classList.add('light');
      document.documentElement.classList.add('light');
    } else {
      document.body.classList.remove('light');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    
    if (nextLight) {
      document.body.classList.add('light');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white text-slate-400 hover:text-brand-500 hover:border-slate-700 transition-all duration-200"
      aria-label="Alternar tema de cores"
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
