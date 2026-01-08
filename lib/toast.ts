import { toast as sonnerToast } from "sonner";
import type React from "react";

/**
 * Custom Toast utility dengan tema orange
 * Wrapper untuk Sonner dengan styling yang konsisten
 */

interface ToastAction {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
}

/**
 * Success toast dengan soft orange/green-tinted background
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    const toastOptions: any = {
      description: options?.description,
      duration: options?.duration || 4000,
    };
    
    if (options?.action) {
      toastOptions.action = options.action;
    }
    
    if (options?.cancel) {
      toastOptions.cancel = options.cancel;
    }
    
    return sonnerToast.success(message, toastOptions);
  },

  /**
   * Error toast dengan orange-red accent
   */
  error: (message: string, options?: ToastOptions) => {
    const toastOptions: any = {
      description: options?.description,
      duration: options?.duration || 5000,
    };
    
    if (options?.action) {
      toastOptions.action = options.action;
    }
    
    if (options?.cancel) {
      toastOptions.cancel = options.cancel;
    }
    
    return sonnerToast.error(message, toastOptions);
  },

  /**
   * Info toast dengan subtle orange accent
   */
  info: (message: string, options?: ToastOptions) => {
    const toastOptions: any = {
      description: options?.description,
      duration: options?.duration || 4000,
    };
    
    if (options?.action) {
      toastOptions.action = options.action;
    }
    
    if (options?.cancel) {
      toastOptions.cancel = options.cancel;
    }
    
    return sonnerToast.info(message, toastOptions);
  },

  /**
   * Loading toast dengan subtle orange accent
   */
  loading: (message: string, options?: Omit<ToastOptions, "action" | "cancel">) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration,
    });
  },

  /**
   * Warning toast dengan amber/orange accent
   */
  warning: (message: string, options?: ToastOptions) => {
    const toastOptions: any = {
      description: options?.description,
      duration: options?.duration || 4000,
    };
    
    if (options?.action) {
      toastOptions.action = options.action;
    }
    
    if (options?.cancel) {
      toastOptions.cancel = options.cancel;
    }
    
    return sonnerToast.warning(message, toastOptions);
  },

  /**
   * Promise toast untuk async operations
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Dismiss toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

