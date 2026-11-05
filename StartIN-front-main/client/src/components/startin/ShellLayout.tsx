import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Bot,
  Briefcase,
  Building2,
  ChevronDown,
  FilePlus2,
  FileText,
  HomeIcon,
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
import { clearSession, type NotificationItem } from "@/lib/api";
import {
  NAV_ITEMS_COMPANY,
  NAV_ITEMS_PROVIDER,
  NAV_ITEMS_STARTUP,
  NAV_ITEMS_STARTUP_TRACAO,
  type AccountType,
  type Screen,
} from "@/types/startin";
import { getInitials } from "@/utils/formatters";

const SCREEN_BREADCRUMB_LABELS: Record<Screen, string> = {
  landing: "Início",
  login: "Login",
  signup: "Criar conta",
  recovery: "Recuperar acesso",
  reset: "Nova senha",
  verify: "Verificação",
  onboarding: "Onboarding",
  dashboard: "Home",
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
  "edit-opportunity": "Editar POC / Compra",
  "company-matches-history": "Histórico de Matches",
  "interest-success": "Interesse registrado",
  "opportunity-success": "Oportunidade publicada",
  "provider-onboarding": "Onboarding do Prestador",
  "provider-dashboard": "Home",
  "explore-startups": "Recomendações",
  "explore-providers": "Explorar prestadores",
  "provider-detail": "Perfil do prestador",
  "request-connection": "Solicitar conexão",
  "connection-sent": "Solicitação enviada",
  connections: "Conexões & Solicitações",
  "connection-received": "Solicitação recebida",
  "connection-accepted": "Conexão aceita",
  "connection-rejected": "Conexão recusada",
  "saved-providers": "Prestadores salvos",
  "saved-startups": "Oportunidades salvas",
  "provider-profile": "Meu perfil",
  "my-service-demands": "Demandas p/ prestadores",
  "create-service-demand": "Lançar demanda de serviço",
  "edit-service-demand": "Editar demanda de serviço",
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
      <section className="startin-auth-hero hidden lg:flex lg:flex-col lg:justify-between h-full min-h-screen">
        <div className="relative z-10 w-full max-w-[440px] mx-auto mt-2 md:mt-6 mb-auto">
          <div className="mb-5 flex justify-center">
            <div className="relative flex items-center justify-center max-w-[210px] transition hover:scale-105">
              <img
                src="/icons/startin-logo-transparent.png"
                alt="StartIn Marca Oficial"
                className="w-full h-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>
          <h1 className="text-[34px] xl:text-[38px] font-black leading-[1.08] tracking-[-.05em] text-[#111827]">
            {sideTitle}
          </h1>
          <p className="mt-4 max-w-[390px] text-[14px] xl:text-[15px] font-medium leading-6 text-[#4b5563]">
            {sideText}
          </p>
        </div>
        <div className="relative z-10 text-xs font-medium text-[#6b7280] pb-6 pt-8">
          StartIn © 2026 · O ecossistema para os próximos grandes começos.
        </div>
        <div className="absolute -bottom-44 -right-28 h-[470px] w-[470px] rounded-full border-[54px] border-[#f1f5f9]" />
        <div className="absolute -right-10 top-24 h-64 w-64 rounded-full border border-[#FEC908]/35" />
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
  mobileOpen = false,
  accountType = "STARTUP",
  isTracao = false,
  matchesCount,
  savedCount = 0,
  onLogout,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  onClose: () => void;
  mobileOpen?: boolean;
  accountType?: AccountType;
  isTracao?: boolean;
  matchesCount: number;
  savedCount?: number;
  onLogout?: () => void;
}) {
  const isCompany = accountType === "COMPANY";
  const isProvider = accountType === "PROVIDER";
  const navItems = isProvider
    ? NAV_ITEMS_PROVIDER
    : isCompany
    ? NAV_ITEMS_COMPANY
    : isTracao
    ? NAV_ITEMS_STARTUP_TRACAO
    : NAV_ITEMS_STARTUP;

  const roleLabel = isProvider ? "Prestador" : isCompany ? "Empresa" : "Startup";

  return (
    <aside
      className={`startin-sidebar shadow-xl lg:shadow-none ${
        mobileOpen ? "is-open" : ""
      }`}
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <button
          type="button"
          onClick={() => {
            go("dashboard");
            onClose();
          }}
          className="flex items-center gap-2 text-left"
        >
          <Logo inverted />
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
              isCompany
                ? "bg-white text-[#111827]"
                : "bg-[#FEC908] text-[#111827]"
            }`}
          >
            {roleLabel}
          </span>
        </button>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 transition hover:text-white lg:hidden"
        >
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
                  ? "bg-white text-[#111827] shadow-xs"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.id === "search-startups" ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white p-0.5 shadow-2xs">
                  <Icon size={15} />
                </span>
              ) : (
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              )}
              <span className="truncate">{item.label}</span>
              {item.id === "saved-opportunities" && !isCompany && savedCount > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-[#111827] text-[#FEC908]"
                      : "bg-[#FEC908] text-[#111827]"
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-4 pb-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-gray-400">
          Conta ({roleLabel})
        </p>
        <button
          onClick={() => {
            go(isProvider ? "provider-profile" : isCompany ? "company-profile" : "account");
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            screen === "account" || screen === "startup" || screen === "company-profile" || screen === "provider-profile"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {isProvider ? <Briefcase size={17} /> : isCompany ? <Building2 size={17} /> : <UserRound size={17} />}
          {isProvider ? "Meu perfil" : isCompany ? "Minha empresa" : "Conta e acesso"}
        </button>
        <button
          onClick={() => {
            go("settings");
            onClose();
          }}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            screen === "settings"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
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
          className="mt-3 flex w-full items-center gap-3 border-t border-white/10 px-3 pt-4 text-left text-xs font-semibold text-gray-400 transition hover:text-[#FEC908]"
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
  isTracao = false,
  matchesCount,
  savedCount = 0,
  notifications = [],
  onNotificationClick,
  onLogout,
  children,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  startupName: string;
  avatarUrl?: string;
  accountType?: AccountType;
  isTracao?: boolean;
  matchesCount: number;
  savedCount?: number;
  notifications?: NotificationItem[];
  onNotificationClick?: (n: NotificationItem) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifPreviewOpen, setNotifPreviewOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifHoverTimerRef = useRef<number | null>(null);
  const isCompany = accountType === "COMPANY";
  const isProvider = accountType === "PROVIDER";

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadBadgeLabel = unreadCount > 10 ? "10+" : String(unreadCount);
  const latestThreeNotifications = notifications.slice(0, 3);

  const handleNotifMouseEnter = () => {
    if (notifHoverTimerRef.current) {
      window.clearTimeout(notifHoverTimerRef.current);
      notifHoverTimerRef.current = null;
    }
    setNotifPreviewOpen(true);
  };

  const handleNotifMouseLeave = () => {
    notifHoverTimerRef.current = window.setTimeout(() => {
      setNotifPreviewOpen(false);
    }, 180);
  };

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (notifHoverTimerRef.current) {
        window.clearTimeout(notifHoverTimerRef.current);
      }
    };
  }, []);

  const PROVIDER_BREADCRUMB_OVERRIDES: Partial<Record<Screen, string>> = {
    "for-you": "Recomendações",
    "startup-detail": "Detalhes da startup",
    account: "Meu perfil",
  };
  const breadcrumbLabel =
    (isProvider ? PROVIDER_BREADCRUMB_OVERRIDES[screen] : undefined) ||
    SCREEN_BREADCRUMB_LABELS[screen] ||
    "Minha conta";

  return (
    <div className="startin-app-shell">
      <div
        className={`${menu ? "block" : "hidden"} fixed inset-0 z-30 bg-[#062f61]/30 lg:hidden`}
        onClick={() => setMenu(false)}
      />
      <Sidebar
        screen={screen}
        go={go}
        onClose={() => setMenu(false)}
        mobileOpen={menu}
        accountType={accountType}
        isTracao={isTracao}
        matchesCount={matchesCount}
        savedCount={savedCount}
        onLogout={onLogout}
      />
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
                className="font-semibold text-gray-500 transition hover:text-[#111827]"
              >
                StartIn
              </button>
              <span>/</span>
              <span className="font-bold text-[#111827]">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="relative"
              onMouseEnter={handleNotifMouseEnter}
              onMouseLeave={handleNotifMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setNotifPreviewOpen(false);
                  go("notifications");
                }}
                title="Notificações"
                className="relative rounded-lg p-2 text-[#687681] transition hover:bg-[#f2f5f7] hover:text-[#111827]"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FEC908] px-1 text-[10px] font-black leading-none text-[#111827] shadow-xs">
                    {unreadBadgeLabel}
                  </span>
                )}
              </button>

              {notifPreviewOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-[#e3e8ec] bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#edf1f4] bg-[#f8fafc] px-4 py-3">
                    <span className="text-xs font-extrabold text-[#111827]">
                      Últimas notificações
                    </span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-[#FEC908] px-2 py-0.5 text-[10px] font-extrabold text-[#111827]">
                        {unreadBadgeLabel} {unreadCount === 1 ? "nova" : "novas"}
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-semibold text-[#7a8792]">
                        Tudo visto
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-[#f0f3f6]">
                    {latestThreeNotifications.length > 0 ? (
                      latestThreeNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setNotifPreviewOpen(false);
                            if (onNotificationClick) {
                              onNotificationClick(n);
                            } else {
                              go("notifications");
                            }
                          }}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f6f9fc] ${
                            !n.read ? "bg-[#fffdf4]" : "bg-white"
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              !n.read ? "bg-[#FEC908]" : "bg-gray-200"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-[#111827]">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-[#657582]">
                              {n.description}
                            </p>
                            <span className="mt-1 block text-[10px] font-semibold text-[#9aa5ad]">
                              {n.timeAgo}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-[#7a8792]">
                        Nenhuma notificação recente neste perfil.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#edf1f4] bg-[#f8fafc] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifPreviewOpen(false);
                        go("notifications");
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold text-[#111827] transition hover:bg-white"
                    >
                      Ver todas as notificações <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  {startupName || (isProvider ? "Meu perfil" : isCompany ? "Minha Empresa" : "Minha Startup")}
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
                        Fluxo {isProvider ? "Prestador de Serviços" : isCompany ? "Empresa Contratante" : "Startup"}
                      </p>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go("dashboard");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                    >
                      <HomeIcon size={15} className="text-[#111827]" />
                      Home
                    </button>

                    {isProvider ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("for-you");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <Rocket size={15} className="text-[#111827]" />
                          Recomendações
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("connections");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <Briefcase size={15} className="text-[#111827]" />
                          Conexões & Solicitações
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            go("provider-profile");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <UserRound size={15} className="text-[#111827]" />
                          Meu perfil de prestador
                        </button>
                      </>
                    ) : isCompany ? (
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
                      </>
                    )}

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
                    {!isCompany && (
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
                    )}
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
