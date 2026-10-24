import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  Bot,
  Building2,
  ChevronDown,
  Logo,
  LogOut,
  Menu,
  OrbitMark,
  SettingsIcon,
  SlidersHorizontal,
  UserRound,
  X,
} from "@/icons";
import { clearSession } from "@/lib/api";
import { NAV_ITEMS, type Screen } from "@/types/startin";
import { getInitials } from "@/utils/formatters";

const SCREEN_BREADCRUMB_LABELS: Record<Screen, string> = {
  login: "Login",
  signup: "Criar conta",
  recovery: "Recuperar acesso",
  reset: "Nova senha",
  verify: "Verificação",
  onboarding: "Onboarding da Startup",
  dashboard: "Dashboard",
  "for-you": "Para você",
  explore: "Explorar",
  matches: "Matches",
  "saved-opportunities": "Interesses salvos",
  "my-opportunities": "Minhas oportunidades",
  assistant: "Assistente IA",
  startup: "Minha startup",
  settings: "Configurações",
  notifications: "Notificações",
  account: "Conta e acesso",
  privacy: "Privacidade e segurança",
  preferences: "Preferências de matching",
  opportunity: "Detalhes da oportunidade",
  match: "Análise de Match",
  "create-company": "Cadastrar empresa",
  "create-opportunity": "Publicar oportunidade",
  "interest-success": "Interesse registrado",
  "opportunity-success": "Oportunidade publicada",
};

export function AuthShell({
  children,
  sideTitle,
  sideText,
}: {
  children: React.ReactNode;
  sideTitle: React.ReactNode;
  sideText: string;
}) {
  return (
    <div className="startin-auth-shell">
      <section className="startin-auth-hero hidden lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-[22px] font-extrabold tracking-[.02em]">
            Start<span className="text-[#ffd43b]">In</span>
          </div>
          <div className="mt-28 max-w-[405px]">
            <OrbitMark />
            <h1 className="mt-8 text-[45px] font-extrabold leading-[1.02] tracking-[-.065em]">
              {sideTitle}
            </h1>
            <p className="mt-7 max-w-[350px] text-[15px] leading-6 text-[#c7d8ea]">{sideText}</p>
          </div>
        </div>
        <div className="relative z-10 text-xs text-[#a8c0d9]">
          StartIn © 2026 · O ecossistema para os próximos grandes começos.
        </div>
        <div className="absolute -bottom-44 -right-28 h-[470px] w-[470px] rounded-full border-[54px] border-[#174b7e]" />
        <div className="absolute -right-10 top-24 h-64 w-64 rounded-full border border-[#2a6598]/40" />
      </section>
      <section className="flex min-h-screen items-center justify-center p-5 md:p-10">
        <div className="startin-auth-card p-7 md:p-10">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}

export function Sidebar({
  screen,
  go,
  onClose,
  matchesCount,
  savedCount = 0,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  onClose: () => void;
  matchesCount: number;
  savedCount?: number;
}) {
  return (
    <aside className="startin-sidebar shadow-xl lg:shadow-none">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e8edf0] px-5">
        <Logo />
        <button onClick={onClose} className="rounded-lg p-1 text-[#83909b] lg:hidden">
          <X size={18} />
        </button>
      </div>
      <nav className="mt-6 space-y-1 px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                go(item.id as Screen);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                screen === item.id
                  ? "bg-[#f1f4f7] text-[#062f61]"
                  : "text-[#65717c] hover:bg-[#f8fafc] hover:text-[#062f61]"
              }`}
            >
              <Icon size={17} strokeWidth={screen === item.id ? 2.5 : 1.8} />
              <span className="truncate">{item.label}</span>
              {item.id === "matches" && (
                <span className="ml-auto rounded-full bg-[#fff1b4] px-2 py-0.5 text-[10px] font-bold text-[#725800]">
                  {matchesCount || 2}
                </span>
              )}
              {item.id === "saved-opportunities" && savedCount > 0 && (
                <span className="ml-auto rounded-full bg-[#e8f4ef] px-2 py-0.5 text-[10px] font-bold text-[#1e7a57]">
                  {savedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-4 pb-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#a0a8af]">
          Conta
        </p>
        <button
          onClick={() => {
            go("startup");
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${
            screen === "startup" ? "bg-[#f1f4f7] text-[#062f61]" : "text-[#65717c]"
          }`}
        >
          <Building2 size={17} />
          Minha startup
        </button>
        <button
          onClick={() => {
            go("settings");
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${
            screen === "settings" ? "bg-[#f1f4f7] text-[#062f61]" : "text-[#65717c]"
          }`}
        >
          <SettingsIcon size={17} />
          Configurações
        </button>
        <button
          onClick={() => {
            clearSession();
            go("login");
          }}
          className="mt-3 flex w-full items-center gap-3 border-t border-[#edf0f2] px-3 pt-4 text-left text-xs font-semibold text-[#8a949d] hover:text-[#075394]"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}

export function AppShell({
  screen,
  go,
  startupName,
  avatarUrl,
  matchesCount,
  savedCount = 0,
  children,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  startupName: string;
  avatarUrl?: string;
  matchesCount: number;
  savedCount?: number;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const breadcrumbLabel = SCREEN_BREADCRUMB_LABELS[screen] || "Minha conta";

  return (
    <div className="startin-app-shell">
      <div
        className={`${menu ? "block" : "hidden"} fixed inset-0 z-30 bg-[#062f61]/20 lg:hidden`}
        onClick={() => setMenu(false)}
      />
      <div className={`${menu ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <Sidebar
          screen={screen}
          go={go}
          onClose={() => setMenu(false)}
          matchesCount={matchesCount}
          savedCount={savedCount}
        />
      </div>
      <div className="lg:pl-[248px]">
        <header className="startin-header px-5 md:px-9">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenu(true)} className="rounded-lg p-2 text-[#687681] lg:hidden">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#8b959e]">
              <button
                type="button"
                onClick={() => go("dashboard")}
                className="font-semibold text-[#6e7d8a] transition hover:text-[#075394]"
              >
                StartIn
              </button>
              <span>/</span>
              <span className="font-bold text-[#062f61]">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => go("notifications")}
              title="Notificações"
              className="relative rounded-lg p-2 text-[#687681] transition hover:bg-[#f2f5f7]"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ffd43b]" />
            </button>
            <div className="h-7 w-px bg-[#e7ebee]" />

            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#f2f5f7]"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={startupName || "Perfil"}
                    className="h-8 w-8 rounded-full border border-[#d6e4f0] object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9e8f4] text-xs font-bold text-[#075394]">
                    {getInitials(startupName)}
                  </div>
                )}
                <span className="hidden text-xs font-semibold text-[#526371] md:block">
                  {startupName || "Nexa Health"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-[#9ba4ac] transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[#e3e8ec] bg-white shadow-xl">
                  <div className="flex items-center gap-3 border-b border-[#edf1f4] bg-[#f8fafc] px-4 py-3.5">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={startupName || "Perfil"}
                        className="h-10 w-10 rounded-full border border-[#d6e4f0] object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9e8f4] text-xs font-extrabold text-[#075394]">
                        {getInitials(startupName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-[#062f61]">
                        {startupName || "Minha Startup"}
                      </p>
                      <p className="truncate text-[11px] text-[#7a8792]">Menu rápido do perfil</p>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("startup");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#3f5263] transition hover:bg-[#f1f5f9] hover:text-[#062f61]"
                    >
                      <Building2 size={15} className="text-[#075394]" />
                      Minha startup (Perfil)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("account");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#3f5263] transition hover:bg-[#f1f5f9] hover:text-[#062f61]"
                    >
                      <UserRound size={15} className="text-[#075394]" />
                      Conta e acesso
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("saved-opportunities");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#3f5263] transition hover:bg-[#f1f5f9] hover:text-[#062f61]"
                    >
                      <Bookmark size={15} className="text-[#075394]" />
                      Interesses salvos
                      {savedCount > 0 && (
                        <span className="ml-auto rounded-full bg-[#e8f4ef] px-2 py-0.5 text-[10px] font-bold text-[#1e7a57]">
                          {savedCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("preferences");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#3f5263] transition hover:bg-[#f1f5f9] hover:text-[#062f61]"
                    >
                      <SlidersHorizontal size={15} className="text-[#075394]" />
                      Preferências de matching
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("settings");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#3f5263] transition hover:bg-[#f1f5f9] hover:text-[#062f61]"
                    >
                      <SettingsIcon size={15} className="text-[#075394]" />
                      Configurações
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("assistant");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#3f5263] transition hover:bg-[#f1f5f9] hover:text-[#062f61]"
                    >
                      <Bot size={15} className="text-[#075394]" />
                      Assistente IA
                    </button>
                  </div>

                  <div className="border-t border-[#edf1f4] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        clearSession();
                        go("login");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[#c93b3b] transition hover:bg-[#fff2f2]"
                    >
                      <LogOut size={15} />
                      Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="startin-main-container px-5 py-8 md:px-9 md:py-10">{children}</main>
      </div>
    </div>
  );
}
