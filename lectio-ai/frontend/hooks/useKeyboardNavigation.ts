import { useEffect } from "react";

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onTab?: () => void;
  onSlash?: () => void;
  customKeys?: Record<string, () => void>;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey } = event;

      // Handle modifier key combinations
      if (ctrlKey || metaKey) {
        switch (key) {
          case 'k':
            event.preventDefault();
            options.onSlash?.();
            break;
          case '/':
            event.preventDefault();
            options.onSlash?.();
            break;
        }
        return;
      }

      // Handle single keys
      switch (key) {
        case 'Enter':
          event.preventDefault();
          options.onEnter?.();
          break;
        case 'Escape':
          event.preventDefault();
          options.onEscape?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          options.onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          options.onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          options.onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          options.onArrowRight?.();
          break;
        case ' ':
          event.preventDefault();
          options.onSpace?.();
          break;
        case 'Tab':
          event.preventDefault();
          options.onTab?.();
          break;
        case '/':
          event.preventDefault();
          options.onSlash?.();
          break;
        default:
          // Handle custom keys
          if (options.customKeys?.[key]) {
            event.preventDefault();
            options.customKeys[key]();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
