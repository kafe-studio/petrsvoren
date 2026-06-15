// Lehký toast systém pro admin — bez frameworku, přes custom DOM event.
// Toaster.astro (mountovaný jednou v AdminLayout) event poslouchá a vykreslí
// dočasnou bublinu. Svelte island verze přijde s refaktorem v Run 008.

export type ToastKind = "success" | "error" | "info";

export interface ToastDetail {
  message: string;
  kind: ToastKind;
}

export const ADMIN_TOAST_EVENT = "admin-toast";

export function toast(message: string, kind: ToastKind = "info"): void {
  document.dispatchEvent(
    new CustomEvent<ToastDetail>(ADMIN_TOAST_EVENT, {
      detail: { message, kind },
    }),
  );
}
