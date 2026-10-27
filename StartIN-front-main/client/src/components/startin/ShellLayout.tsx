import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  Bot,
  Building2,
  ChevronDown,
  FilePlus2,
  FileText,
  Logo,
  LogOut,
  Menu,
  OrbitMark,
  Rocket,
  SettingsIcon,
  SlidersHorizontal,
  UserRound,
  X,
} from "@/icons";
import { clearSession } from "@/lib/api";
import {
  NAV_ITEMS_COMPANY,
  NAV_ITEMS_STARTUP,
  type AccountType,
  type Screen,
} from "@/types/startin";
import { getInitials } from "@/utils/formatters";

const SCREEN_BREADCRUMB_LABELS: Record<Screen, string> = {
  login: "Login",
  signup: "Criar conta",
  recovery: "Recuperar acesso",
  reset: "Nova senha",
  verify: "Verificação",
  onboarding: "Onboarding",
  dashboard: "Dashboard",
  "for-you": "Para você",
  explore: "Explorar",
  "search-companies": "Buscar empresas",
  "search-startups": "Buscar startups",
  "company-detail": "Match com Empresa",
  "startup-detail": "Match com Startup",
  matches: "Matches",
  "saved-opportunities": "Interesses salvos",
  "my-opportunities": "Lançar oportunidades",
  assistant: "Assistente IA",
  startup: "Conta e acesso",
  "company-profile": "Minha empresa",
  settings: "Configurações",
  notifications: "Notificações",
  account: "Conta e acesso",
  privacy: "Privacidade e segurança",
  preferences: "Preferências de matching",
  opportunity: "Detalhes da oportunidade",
  match: "Análise de Match",
  "create-company": "Cadastrar empresa",
  "create-opportunity": "Lançar POC / Compra",
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
          <div className="flex items-center gap-3 text-[24px] font-black tracking-[.02em]">
            <span>Start</span><span className="text-[#FEC908]">In</span>
          </div>
          <div className="mt-20 max-w-[420px]">
            <OrbitMark />
            <h1 className="mt-8 text-[44px] font-black leading-[1.04] tracking-[-.05em] text-white">
              {sideTitle}
            </h1>
            <p className="mt-6 max-w-[360px] text-[15px] leading-6 text-gray-300 font-medium">{sideText}</p>
          </div>
        </div>
        <div className="relative z-10 text-xs text-gray-400 font-medium">
          StartIn © 2026 · O ecossistema para os próximos grandes começos.
        </div>
        <div className="absolute -bottom-44 -right-28 h-[470px] w-[470px] rounded-full border-[54px] border-[#1f2937]/50" />
        <div className="absolute -right-10 top-24 h-64 w-64 rounded-full border border-[#FEC908]/20" />
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
  accountType = "STARTUP",
  matchesCount,
  savedCount = 0,
  onLogout,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  onClose: () => void;
  accountType?: AccountType;
  matchesCount: number;
  savedCount?: number;
  onLogout?: () => void;
}) {
  const isCompany = accountType === "COMPANY";
  const navItems = isCompany ? NAV_ITEMS_COMPANY : NAV_ITEMS_STARTUP;

  return (
    <aside className="startin-sidebar shadow-xl lg:shadow-none">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e8edf0] px-5">
        <div className="flex items-center gap-2">
          <Logo />
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
              isCompany
                ? "bg-[#fef08a] text-[#854d0e]"
                : "bg-[#111827] text-[#FEC908]"
            }`}
          >
            {isCompany ? "Empresa" : "Startup"}
          </span>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-[#83909b] lg:hidden">
          <X size={18} />
        </button>
      </div>
      <nav className="mt-6 space-y-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = screen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                go(item.id as Screen);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                isActive
                  ? "bg-[#111827] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="truncate">{item.label}</span>
              {item.id === "matches" && !isCompany && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-[#FEC908] text-[#111827]" : "bg-[#fef08a] text-[#854d0e]"
                }`}>
                  {matchesCount || 2}
                </span>
              )}
              {item.id === "saved-opportunities" && !isCompany && savedCount > 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-[#FEC908] text-[#111827]" : "bg-[#dcfce7] text-[#166534]"
                }`}>
                  {savedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-4 pb-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#9ca3af]">
          Conta ({isCompany ? "Empresa" : "Startup"})
        </p>
        <button
          onClick={() => {
            go(isCompany ? "company-profile" : "account");
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            screen === "account" || screen === "startup" || screen === "company-profile"
              ? "bg-[#111827] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-black"
          }`}
        >
          {isCompany ? <Building2 size={17} /> : <UserRound size={17} />}
          {isCompany ? "Minha empresa" : "Conta e acesso"}
        </button>
        <button
          onClick={() => {
            go("settings");
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            screen === "settings"
              ? "bg-[#111827] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-black"
          }`}
        >
          <SettingsIcon size={17} />
          Configurações
        </button>
        <button
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              clearSession();
              go("login");
            }
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
  accountType = "STARTUP",
  matchesCount,
  savedCount = 0,
  onLogout,
  children,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  startupName: string;
  avatarUrl?: string;
  accountType?: AccountType;
  matchesCount: number;
  savedCount?: number;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const isCompany = accountType === "COMPANY";

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
          accountType={accountType}
          matchesCount={matchesCount}
          savedCount={savedCount}
          onLogout={onLogout}
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
                onClick={() => go(isCompany ? "search-startups" : "dashboard")}
                className="font-semibold text-gray-500 transition hover:text-[#111827]"
              >
                StartIn
              </button>
              <span>/</span>
              <span className="font-bold text-[#111827]">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => go("notifications")}
              title="Notificações"
              className="relative rounded-lg p-2 text-[#687681] transition hover:bg-[#f2f5f7]"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#FEC908]" />
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
                    className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-[#FEC908]">
                    {getInitials(startupName)}
                  </div>
                )}
                <span className="hidden text-xs font-semibold text-[#111827] md:block">
                  {startupName || (isCompany ? "Empresa Alpha" : "Nexa Health")}
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-extrabold text-[#FEC908]">
                        {getInitials(startupName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-[#111827]">
                        {startupName || (isCompany ? "Minha Empresa" : "Minha Startup")}
                      </p>
                      <p className="truncate text-[11px] text-[#7a8792]">
                        Fluxo {isCompany ? "Empresa Contratante" : "Startup"}
                      </p>
                    </div>
                  </div>

                  <div className="p-2">
                    {isCompany && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          go("company-profile");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                      >
                        <Building2 size={15} className="text-[#111827]" />
                        Minha empresa (Perfil)
                      </button>
                    )}

                    {isCompany ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("search-startups");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <Rocket size={15} />
                          Buscar startups (Match IA)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("my-opportunities");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <FileText size={15} className="text-[#111827]" />
                          Lançar oportunidades (POC/Compra)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("create-opportunity");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <FilePlus2 size={15} className="text-[#111827]" />
                          Nova POC / Compra
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("search-companies");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <Building2 size={15} className="text-[#111827]" />
                          Buscar empresas (Match IA)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("saved-opportunities");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <Bookmark size={15} className="text-[#111827]" />
                          Interesses salvos
                          {savedCount > 0 && (
                            <span className="ml-auto rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold text-[#166534]">
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
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <SlidersHorizontal size={15} className="text-[#111827]" />
                          Preferências de matching
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("account");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                    >
                      <UserRound size={15} className="text-[#111827]" />
                      Conta e acesso
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("settings");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                    >
                      <SettingsIcon size={15} className="text-[#111827]" />
                      Configurações
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("assistant");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                    >
                      <Bot size={15} className="text-[#111827]" />
                      Assistente IA
                    </button>
                  </div>

                  <div className="border-t border-[#edf1f4] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        if (onLogout) {
                          onLogout();
                        } else {
                          clearSession();
                          go("login");
                        }
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
