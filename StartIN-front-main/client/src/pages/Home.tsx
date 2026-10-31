import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/startin/ShellLayout";
import {
  api,
  clearSession,
  getSession,
  type CompanyMatchItem,
  type CompanyProfileData,
  type MatchItem,
  type NotificationItem,
  type OpportunityItem,
  type StartupMatchItem,
  type StartupProfileData,
} from "@/lib/api";
import {
  Assistant,
  CompanyDashboard,
  CompanyMatchDetailScreen,
  CompanyMatchesHistoryScreen,
  CompanyProfileScreen,
  CreateForm,
  Dashboard,
  getLocalSavedOpportunities,
  Login,
  MatchDetail,
  MyOpportunities,
  Onboarding,
  Opportunities,
  OpportunityDetail,
  Recovery,
  Reset,
  SavedOpportunities,
  SearchCompaniesScreen,
  SearchStartupsScreen,
  SettingsPage,
  Signup,
  StartupMatchDetailScreen,
  SubSettings,
  Verify,
} from "@/screens";
import type { AccountType, Screen } from "@/types/startin";
import { computeAuditedClientMatchScore } from "@/utils/formatters";

export default function Home() {
  const session = getSession();
  const initialAccountType: AccountType =
    session?.accountType === "COMPANY" ? "COMPANY" : "STARTUP";

  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [screen, setScreen] = useState<Screen>(() => {
    const isAuth = Boolean(session || localStorage.getItem("startin-auth"));
    if (!isAuth) return "login";
    return "dashboard";
  });
  const [selectedScreen, setSelectedScreen] = useState<Screen>(screen);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityItem | null>(null);
  const [assistantOpportunity, setAssistantOpportunity] = useState<OpportunityItem | null>(null);
  const [selectedStartupMatch, setSelectedStartupMatch] = useState<StartupMatchItem | null>(null);
  const [selectedCompanyMatch, setSelectedCompanyMatch] = useState<CompanyMatchItem | null>(null);

  const [profile, setProfile] = useState<StartupProfileData | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [matchesCount, setMatchesCount] = useState<number>(2);
  const [savedCount, setSavedCount] = useState<number>(() =>
    session?.accountType === "COMPANY"
      ? 0
      : getLocalSavedOpportunities(session?.startupProfileId).length
  );
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [authVersion, setAuthVersion] = useState(0);

  const activeStartupId = profile?.id || session?.startupProfileId;
  const activeCompanyId = companyProfile?.id || session?.companyId;

  const refreshNotifications = useCallback(
    (overrideIds?: { startupId?: number; companyId?: number; role?: AccountType }) => {
      const currentSession = getSession();
      if (!currentSession && !localStorage.getItem("startin-auth")) {
        setNotifications([]);
        return;
      }
      const role: AccountType =
        overrideIds?.role ||
        (currentSession?.accountType === "COMPANY" ? "COMPANY" : "STARTUP");
      const targetStartupId =
        overrideIds?.startupId ?? profile?.id ?? currentSession?.startupProfileId;
      const targetCompanyId =
        overrideIds?.companyId ?? companyProfile?.id ?? currentSession?.companyId;

      api
        .getNotifications({
          type: "Todas",
          role,
          userId: currentSession?.userId,
          startupId: role === "STARTUP" ? targetStartupId : undefined,
          companyId: role === "COMPANY" ? targetCompanyId : undefined,
        })
        .then((list) => {
          if (Array.isArray(list)) {
            setNotifications(list);
          }
        })
        .catch(() => {});
    },
    [profile?.id, companyProfile?.id]
  );

  const refreshSavedCount = (matchesFromApi?: MatchItem[], targetStartupId?: number) => {
    const currentSession = getSession();
    if ((currentSession?.accountType || accountType) === "COMPANY") {
      setSavedCount(0);
      return;
    }
    const resolvedId =
      targetStartupId ?? activeStartupId ?? currentSession?.startupProfileId;
    const localItems = getLocalSavedOpportunities(resolvedId);
    const titles = new Set(localItems.map((i) => i.title.toLowerCase()));
    if (Array.isArray(matchesFromApi)) {
      matchesFromApi
        .filter((m) => m.status === "INTERESSE_ENVIADO" || m.status === "SALVO")
        .forEach((m) => {
          if (m.opportunityTitle) titles.add(m.opportunityTitle.toLowerCase());
        });
    }
    setSavedCount(titles.size);
  };

  useEffect(() => {
    setSelectedScreen(screen);
  }, [screen]);

  useEffect(() => {
    const currentSession = getSession();
    const currentType: AccountType =
      currentSession?.accountType === "COMPANY" ? "COMPANY" : "STARTUP";
    setAccountType(currentType);

    if (!currentSession && !localStorage.getItem("startin-auth")) {
      setProfile(null);
      setCompanyProfile(null);
      setNotifications([]);
      setSavedCount(0);
      return;
    }

    if (currentType === "STARTUP") {
      setCompanyProfile(null);
      const startupId = currentSession?.startupProfileId;
      const userId = currentSession?.userId;

      if (startupId) {
        api
          .getProfile(startupId)
          .then((p) => {
            if (p) {
              setProfile(p);
              refreshNotifications({ startupId: p.id || startupId, role: "STARTUP" });
            }
          })
          .catch(() => {});
      } else if (userId) {
        api
          .getProfileByUser(userId)
          .then((p) => {
            if (p) {
              setProfile(p);
              refreshNotifications({ startupId: p.id, role: "STARTUP" });
              if (p.id) {
                api
                  .getMatches(p.id)
                  .then((m) => refreshSavedCount(m, p.id))
                  .catch(() => refreshSavedCount(undefined, p.id));
              }
            }
          })
          .catch(() => {});
      } else {
        setProfile(null);
      }

      refreshNotifications({ startupId, role: "STARTUP" });

      api
        .getMatches(startupId)
        .then((m) => {
          if (Array.isArray(m)) {
            if (m.length > 0) setMatchesCount(m.length);
            refreshSavedCount(m, startupId);
          } else {
            refreshSavedCount(undefined, startupId);
          }
        })
        .catch(() => {
          refreshSavedCount(undefined, startupId);
        });
    } else {
      setProfile(null);
      setSavedCount(0);
      const companyId = currentSession?.companyId;
      const userId = currentSession?.userId;

      if (companyId) {
        api
          .getCompany(companyId)
          .then((c) => {
            if (c) {
              setCompanyProfile(c);
              refreshNotifications({ companyId: c.id || companyId, role: "COMPANY" });
            }
          })
          .catch(() => {});
      } else if (userId) {
        api
          .getCompanyByUser(userId)
          .then((c) => {
            if (c) {
              setCompanyProfile(c);
              refreshNotifications({ companyId: c.id, role: "COMPANY" });
            }
          })
          .catch(() => {});
      } else {
        setCompanyProfile(null);
      }

      refreshNotifications({ companyId, role: "COMPANY" });
    }
  }, [authVersion, screen, refreshNotifications]);

  const handleLogout = () => {
    clearSession();
    setProfile(null);
    setCompanyProfile(null);
    setNotifications([]);
    setSavedCount(0);
    setSelectedMatch(null);
    setSelectedOpportunity(null);
    setEditingOpportunity(null);
    setAssistantOpportunity(null);
    setSelectedStartupMatch(null);
    setSelectedCompanyMatch(null);
    setAuthVersion((v) => v + 1);
    go("login");
  };

  const go = (next: Screen) => {
    setScreen(next);
    setSelectedScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenOpportunityById = async (id: string | number) => {
    try {
      const [opp, matches] = await Promise.all([
        api.getOpportunity(id),
        api.getMatches(activeStartupId).catch(() => [] as MatchItem[]),
      ]);
      const matched = matches.find(
        (m) =>
          String(m.opportunityId) === String(opp.id) ||
          (opp.code && String(m.opportunityCode) === String(opp.code))
      );
      setSelectedOpportunity({
        ...opp,
        short: opp.shortDescription || opp.short || opp.description,
        match: matched?.matchScore ?? computeAuditedClientMatchScore(profile, opp),
        meta: opp.meta || opp.metaInfo || "Prazo 15/10/2026 · Brasil · Remoto",
      });
    } catch {}
    go("opportunity");
  };

  const handleOpenCompanyById = async (companyId?: number, companyName?: string) => {
    try {
      const matches = await api.getStartupCompaniesMatches(activeStartupId);
      const found = matches.find(
        (c) =>
          (companyId && String(c.companyId || c.id) === String(companyId)) ||
          (companyName &&
            (c.companyName || c.name || "").toLowerCase() === companyName.toLowerCase())
      );
      if (found) {
        setSelectedCompanyMatch(found);
        go("company-detail");
        return;
      }
    } catch {}

    try {
      const comp = companyId ? await api.getCompany(companyId) : await api.getDefaultCompany();
      if (comp) {
        const computedScore = computeAuditedClientMatchScore(profile, comp);
        setSelectedCompanyMatch({
          id: comp.id,
          companyId: comp.id || companyId || 1,
          companyName: comp.name || companyName || "Empresa Alpha",
          companyType: comp.type || "Empresa",
          sector: comp.sector || "Inovação Corporativa",
          description: comp.description || "",
          demands: comp.demands || "",
          tags: comp.tags || "Inovação",
          location: comp.location || "Brasil",
          website: comp.website,
          phone: comp.phone,
          cnpj: comp.cnpj,
          operationMode: comp.operationMode || "POC + Compra",
          preferredStage: comp.preferredStage,
          avatarUrl: comp.avatarUrl,
          matchScore: computedScore,
          justification:
            "Empresa responsável pela oportunidade corporativa avaliada conforme a balança auditada de área (40%), tecnologias (30%) e critérios operacionais (30%).",
          recommendedAction: "Confira as demandas abertas e envie interesse para POC ou Compra.",
          reasons: {
            perfil: `${comp.sector || "Corporativo"} · ${comp.operationMode || "POC / Compra"}`,
            requisitos: comp.tags || "Tecnologias informadas pela empresa",
            objetivo: comp.operationMode || "Contratação de Startup",
            contexto: comp.location || "Brasil",
          },
        });
        go("company-detail");
      }
    } catch {}
  };

  const handleOpenInAssistant = (opp: OpportunityItem) => {
    setAssistantOpportunity(opp);
    go("assistant");
  };

  const handleOpenStartupById = async (targetStartupId?: number) => {
    if (!targetStartupId) {
      go("search-startups");
      return;
    }
    try {
      const startups = await api.getCompanyStartupsMatches(activeCompanyId);
      const found = startups.find(
        (s) => String(s.startupId || s.id) === String(targetStartupId)
      );
      if (found) {
        setSelectedStartupMatch(found);
        go("startup-detail");
        return;
      }
    } catch {}

    try {
      const sp = await api.getProfile(targetStartupId);
      if (sp) {
        const computedScore = computeAuditedClientMatchScore(sp, companyProfile);
        setSelectedStartupMatch({
          id: sp.id || targetStartupId,
          startupId: sp.id || targetStartupId,
          startupName: sp.name || "Startup",
          mainArea: sp.mainArea || sp.mainSector || "Inovação",
          currentStage: sp.currentStage || "Validação",
          description: sp.description || "",
          problem: sp.problem || "",
          technologies: sp.technologies || sp.areasOfInterest || "Tecnologia",
          businessModel: sp.businessModel || "B2B",
          location: sp.location || sp.operationRegion || "Brasil",
          website: sp.website,
          phone: sp.phone,
          cnpj: sp.cnpj,
          email: sp.userEmail,
          avatarUrl: sp.avatarUrl,
          matchScore: computedScore,
          justification:
            "Startup avaliada conforme a balança auditada de área de atuação (40%), tecnologias (30%) e maturidade/operação (30%).",
          recommendedAction: "Entre em contato para alinhar POC ou contratação.",
          reasons: {
            perfil: `${sp.mainArea || "Inovação"} · ${sp.businessModel || "B2B"}`,
            requisitos: sp.technologies || sp.areasOfInterest || "Tecnologias da startup",
            objetivo: "POC / Contratação Corporativa",
            contexto: `${sp.location || "Brasil"} · ${sp.currentStage || "Validação"}`,
          },
        });
        go("startup-detail");
        return;
      }
    } catch {}
    go("search-startups");
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    // 1. Marca imediatamente como vista (remove indicador amarelo e reduz contador)
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    if (n.id) {
      api.markNotificationRead(n.id).catch(() => {});
    }

    const currentSession = getSession();
    const isComp =
      (currentSession?.accountType || accountType) === "COMPANY";
    const dest = n.targetScreen || "";

    if (isComp) {
      if (dest === "startup-detail") {
        await handleOpenStartupById(n.targetId ? Number(n.targetId) : undefined);
        return;
      }
      if (dest === "edit-opportunity" && n.targetId) {
        try {
          const opp = await api.getOpportunity(n.targetId);
          if (opp) {
            setEditingOpportunity(opp);
            go("edit-opportunity");
            return;
          }
        } catch {}
        go("my-opportunities");
        return;
      }
      if (dest === "my-opportunities") {
        go("my-opportunities");
        return;
      }
      if (dest === "company-matches-history") {
        go("company-matches-history");
        return;
      }
      if (dest === "search-startups") {
        go("search-startups");
        return;
      }
      if (dest === "company-profile" || dest === "account") {
        go("company-profile");
        return;
      }
      const lowerType = (n.type || "").toLowerCase();
      if (lowerType.includes("match")) {
        go("search-startups");
      } else if (lowerType.includes("oportunidade")) {
        go("my-opportunities");
      } else {
        go("company-profile");
      }
      return;
    }

    // Fluxo Startup
    if (dest === "opportunity" && n.targetId) {
      await handleOpenOpportunityById(n.targetId);
      return;
    }
    if (dest === "company-detail") {
      if (n.targetId) {
        await handleOpenCompanyById(Number(n.targetId));
      } else {
        go("search-companies");
      }
      return;
    }
    if (dest === "saved-opportunities") {
      go("saved-opportunities");
      return;
    }
    if (dest === "search-companies") {
      go("search-companies");
      return;
    }
    if (dest === "account" || dest === "startup") {
      go("account");
      return;
    }
    if (dest === "for-you") {
      go("for-you");
      return;
    }

    const lowerType = (n.type || "").toLowerCase();
    if (lowerType.includes("oportunidade") || lowerType.includes("match")) {
      go("for-you");
    } else {
      go("account");
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    const currentSession = getSession();
    const role: AccountType =
      currentSession?.accountType === "COMPANY" ? "COMPANY" : "STARTUP";
    api
      .markAllNotificationsRead({
        role,
        userId: currentSession?.userId,
        startupId: role === "STARTUP" ? activeStartupId : undefined,
        companyId: role === "COMPANY" ? activeCompanyId : undefined,
      })
      .catch(() => {});
  };

  if (["login", "signup", "recovery", "reset", "verify", "onboarding"].includes(screen)) {
    if (screen === "login")
      return <Login go={go} onAuthSuccess={() => setAuthVersion((v) => v + 1)} />;
    if (screen === "signup")
      return <Signup go={go} onAuthSuccess={() => setAuthVersion((v) => v + 1)} />;
    if (screen === "recovery")
      return <Recovery go={go} onSetRecoveryEmail={setRecoveryEmail} />;
    if (screen === "reset")
      return <Reset go={go} recoveryEmail={recoveryEmail} />;
    if (screen === "verify") return <Verify go={go} />;
    return (
      <Onboarding
        go={go}
        startupId={activeStartupId}
        companyId={activeCompanyId}
        onProfileUpdated={setProfile}
        onCompanyUpdated={setCompanyProfile}
      />
    );
  }

  const isCompany = accountType === "COMPANY";

  const displayName = isCompany
    ? companyProfile?.name || session?.name || "Empresa Alpha"
    : profile?.name || session?.name || "Nexa Health";
  const displayAvatarUrl = isCompany
    ? companyProfile?.avatarUrl || session?.avatarUrl
    : profile?.avatarUrl || session?.avatarUrl;

  let page: React.ReactNode = null;

  // Telas Exclusivas do Fluxo Empresa (sem Assistente IA!)
  if (isCompany) {
    if (screen === "dashboard") {
      page = (
        <CompanyDashboard
          go={go}
          companyId={activeCompanyId}
          companyName={displayName}
          onEditOpportunity={(opp) => setEditingOpportunity(opp)}
        />
      );
    } else if (screen === "company-matches-history") {
      page = (
        <CompanyMatchesHistoryScreen
          go={go}
          companyId={activeCompanyId}
          onSelectStartup={setSelectedStartupMatch}
        />
      );
    } else if (screen === "search-startups") {
      page = (
        <SearchStartupsScreen
          go={go}
          companyId={activeCompanyId}
          onSelectStartup={setSelectedStartupMatch}
        />
      );
    } else if (screen === "startup-detail") {
      page = (
        <StartupMatchDetailScreen
          go={go}
          startup={selectedStartupMatch}
          companyId={activeCompanyId}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else if (screen === "my-opportunities") {
      page = (
        <MyOpportunities
          go={go}
          onSelectOpportunity={(o) => setEditingOpportunity(o)}
          onEditOpportunity={(o) => setEditingOpportunity(o)}
        />
      );
    } else if (screen === "create-opportunity") {
      page = (
        <CreateForm
          go={go}
          opportunity
          editingOpportunity={null}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else if (screen === "edit-opportunity") {
      page = (
        <CreateForm
          go={go}
          opportunity
          editingOpportunity={editingOpportunity}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else if (screen === "company-profile" || screen === "account") {
      page = (
        <CompanyProfileScreen
          go={go}
          companyId={activeCompanyId}
          company={companyProfile}
          onCompanyUpdated={setCompanyProfile}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else if (screen === "settings") {
      page = (
        <SettingsPage
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
        />
      );
    } else if (["privacy", "notifications"].includes(screen)) {
      page = (
        <SubSettings
          screen={screen}
          go={go}
          startupId={activeStartupId}
          companyId={activeCompanyId}
          profile={profile}
          onProfileUpdated={setProfile}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else {
      page = (
        <CompanyDashboard
          go={go}
          companyId={activeCompanyId}
          companyName={displayName}
          onEditOpportunity={(opp) => setEditingOpportunity(opp)}
        />
      );
    }
  } else {
    // Telas do Fluxo Startup
    if (screen === "dashboard") {
      page = (
        <Dashboard
          go={go}
          startupId={activeStartupId}
          startupName={displayName}
          onSelectOpportunityById={handleOpenOpportunityById}
        />
      );
    } else if (screen === "for-you" || screen === "explore" || screen === "matches") {
      page = (
        <Opportunities
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onSelectOpportunity={setSelectedOpportunity}
        />
      );
    } else if (screen === "search-companies") {
      page = (
        <SearchCompaniesScreen
          go={go}
          startupId={activeStartupId}
          onSelectCompany={setSelectedCompanyMatch}
        />
      );
    } else if (screen === "company-detail") {
      page = (
        <CompanyMatchDetailScreen
          go={go}
          company={selectedCompanyMatch}
          startupId={activeStartupId}
          onSelectOpportunity={setSelectedOpportunity}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else if (screen === "saved-opportunities") {
      page = (
        <SavedOpportunities
          go={go}
          startupId={activeStartupId}
          onSelectOpportunity={setSelectedOpportunity}
          onSavedChange={() => {
            refreshSavedCount();
            refreshNotifications();
          }}
          onOpenInAssistant={handleOpenInAssistant}
        />
      );
    } else if (screen === "opportunity") {
      page = (
        <OpportunityDetail
          go={go}
          selectedOpportunity={selectedOpportunity}
          startupId={activeStartupId}
          profile={profile}
          onSavedChange={() => {
            refreshSavedCount();
            refreshNotifications();
          }}
          onOpenCompanyById={handleOpenCompanyById}
          onOpenInAssistant={handleOpenInAssistant}
        />
      );
    } else if (screen === "match") {
      page = (
        <MatchDetail
          go={go}
          startupId={activeStartupId}
          selectedMatch={selectedMatch}
          onOpenOpportunity={handleOpenOpportunityById}
          onSavedChange={() => {
            refreshSavedCount();
            refreshNotifications();
          }}
        />
      );
    } else if (screen === "assistant") {
      page = (
        <Assistant
          go={go}
          profile={profile}
          startupId={activeStartupId}
          selectedOpportunity={assistantOpportunity}
          onSelectOpportunity={setAssistantOpportunity}
        />
      );
    } else if (screen === "startup" || screen === "account") {
      page = (
        <SubSettings
          screen="account"
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else if (screen === "settings") {
      page = (
        <SettingsPage
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
        />
      );
    } else if (["privacy", "preferences", "notifications"].includes(screen)) {
      page = (
        <SubSettings
          screen={screen}
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onNotificationTrigger={() => refreshNotifications()}
        />
      );
    } else {
      page = (
        <Dashboard
          go={go}
          startupId={activeStartupId}
          startupName={displayName}
          onSelectOpportunityById={handleOpenOpportunityById}
        />
      );
    }
  }

  return (
    <AppShell
      screen={selectedScreen}
      go={go}
      accountType={accountType}
      startupName={displayName}
      avatarUrl={displayAvatarUrl}
      matchesCount={matchesCount}
      savedCount={savedCount}
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onLogout={handleLogout}
    >
      {page}
    </AppShell>
  );
}
