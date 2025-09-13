/**
 * Simple toast notification utility for success/error messages
 */

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Array<(toasts: ToastMessage[]) => void> = [];

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 5000) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = { id, message, type, duration };
    
    this.toasts.push(toast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

// Convenience methods
export const toast = {
  success: (message: string, duration?: number) => toastManager.show(message, 'success', duration),
  error: (message: string, duration?: number) => toastManager.show(message, 'error', duration),
  info: (message: string, duration?: number) => toastManager.show(message, 'info', duration),
};