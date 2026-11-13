export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.info("[StartIn PWA] Nova versão disponível e pronta para uso.");
            }
          };
        };
      })
      .catch((error) => {
        console.warn("[StartIn PWA] Falha ao registrar Service Worker:", error);
      });
  });
}
