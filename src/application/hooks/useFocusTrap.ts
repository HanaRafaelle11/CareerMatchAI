import { useEffect, type RefObject } from 'react';

/**
 * Hook para manter o foco preso (Focus Trap) dentro de um modal/drawer enquanto aberto.
 * Impede que a navegação por Tab/Shift+Tab saia para elementos em segundo plano.
 * Restaura o foco para o elemento original ao fechar.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];
      return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')))
        .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
    };

    // Focar o primeiro elemento focável ou o contêiner
    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      setTimeout(() => focusables[0].focus(), 50);
    } else {
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = getFocusableElements();
      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = currentFocusables[0];
      const lastElement = currentFocusables[currentFocusables.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab: Se estiver no primeiro elemento, move o foco para o último
        if (activeElement === firstElement || activeElement === container) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Se estiver no último elemento, move o foco para o primeiro
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, isOpen]);
}
