import { useEffect } from 'react';

/**
 * Custom hook to register a global Escape key listener to close a modal/drawer.
 * @param isOpen Condition representing whether the modal/drawer is open
 * @param onClose Callback function to close the modal/drawer
 */
export function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);
}
