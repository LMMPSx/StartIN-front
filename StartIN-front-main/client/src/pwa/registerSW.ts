import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(() => Boolean(deferredPrompt));

  useEffect(() => {
    const update = () => setCanInstall(Boolean(deferredPrompt));
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        deferredPrompt = null;
        notifyListeners();
        return true;
      }
    } catch (err) {
      console.warn("[StartIn PWA] Erro ao exibir prompt de instalacao:", err);
    }
    return false;
  };

  return { canInstall, triggerInstall };
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => {});
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.info("[StartIn PWA] Nova versao disponivel e pronta para uso.");
            }
          };
        };
      })
      .catch((error) => {
        console.warn("[StartIn PWA] Falha ao registrar Service Worker:", error);
      });
  });
}
