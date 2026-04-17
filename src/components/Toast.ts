type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
}

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const typeColors: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
};

const typeBgs: Record<ToastType, string> = {
  success: 'var(--color-success-light)',
  error: 'var(--color-error-light)',
  info: 'var(--color-info-light)',
  warning: 'var(--color-warning-light)',
};

export function showToast({ message, type = 'info', duration = 2500 }: ToastOptions): void {
  const c = getContainer();
  const toast = document.createElement('div');
  const color = typeColors[type];
  const bg = typeBgs[type];
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: ${bg};
    color: ${color};
    border: 1px solid ${color};
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: var(--shadow-md);
    pointer-events: auto;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 200ms ease, transform 200ms ease;
    font-family: var(--font-family);
    max-width: 320px;
    word-break: break-word;
  `;
  toast.innerHTML = `<span style="font-weight:700">${typeIcons[type]}</span><span>${message}</span>`;
  c.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
  });

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
