/**
 * Simple toast notification utility
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
};

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-${opts.position}`;
  toast.textContent = message;

  // Apply styles
  Object.assign(toast.style, {
    position: 'fixed',
    padding: '12px 24px',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    zIndex: '9999',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    maxWidth: '400px',
    wordBreak: 'break-word',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  });

  // Position styles
  const positionStyles: Record<string, Partial<CSSStyleDeclaration>> = {
    top: { top: '20px', left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
  };

  Object.assign(toast.style, positionStyles[opts.position || 'top-right']);

  // Type styles
  const typeColors: Record<ToastType, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  toast.style.backgroundColor = typeColors[type];

  // Add to DOM
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, opts.duration);
}

export default showToast;
