import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../application/providers/ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isLight = effectiveTheme === 'light';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border border-border bg-card text-foreground hover:scale-105 active:scale-95 transition-transform duration-150 shadow-xs cursor-pointer flex items-center justify-center ${className}`}
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
