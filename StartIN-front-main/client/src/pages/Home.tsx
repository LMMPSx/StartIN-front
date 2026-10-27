import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/startin/ShellLayout";
import {
  api,
  clearSession,
  getSession,
  type CompanyMatchItem,
  type CompanyProfileData,
  type MatchItem,
  type OpportunityItem,
  type StartupMatchItem,
  type StartupProfileData,
} from "@/lib/api";
import {
  Assistant,
  CompanyMatchDetailScreen,
  CompanyProfileScreen,
  CreateForm,
  Dashboard,
  getLocalSavedOpportunities,
  Login,
  MatchDetail,
  Matches,
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
  Startup,
  StartupMatchDetailScreen,
  SubSettings,
  Verify,
} from "@/screens";
import type { AccountType, Screen } from "@/types/startin";

export default function Home() {
  const session = getSession();
  const initialAccountType: AccountType =
    session?.accountType === "COMPANY" ? "COMPANY" : "STARTUP";

  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [screen, setScreen] = useState<Screen>(() => {
    const isAuth = Boolean(session || localStorage.getItem("startin-auth"));
    if (!isAuth) return "login";
    return initialAccountType === "COMPANY" ? "search-startups" : "dashboard";
  });
  const [selectedScreen, setSelectedScreen] = useState<Screen>(screen);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [selectedStartupMatch, setSelectedStartupMatch] = useState<StartupMatchItem | null>(null);
  const [selectedCompanyMatch, setSelectedCompanyMatch] = useState<CompanyMatchItem | null>(null);

  const [profile, setProfile] = useState<StartupProfileData | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);
  const [matchesCount, setMatchesCount] = useState<number>(2);
  const [savedCount, setSavedCount] = useState<number>(() => getLocalSavedOpportunities().length);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [authVersion, setAuthVersion] = useState(0);

  const activeStartupId = profile?.id || session?.startupProfileId;
  const activeCompanyId = companyProfile?.id || session?.companyId;

  const refreshSavedCount = (matchesFromApi?: MatchItem[]) => {
    const localItems = getLocalSavedOpportunities();
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

    // Se não há sessão, limpa completamente os estados de perfil para não vazar avatar/dados
    if (!currentSession && !localStorage.getItem("startin-auth")) {
      setProfile(null);
      setCompanyProfile(null);
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
            if (p) setProfile(p);
          })
          .catch(() => {});
      } else if (userId) {
        api
          .getProfileByUser(userId)
          .then((p) => {
            if (p) setProfile(p);
          })
          .catch(() => {});
      } else {
        setProfile(null);
      }

      api
        .getMatches(startupId)
        .then((m) => {
          if (Array.isArray(m)) {
            if (m.length > 0) setMatchesCount(m.length);
            refreshSavedCount(m);
          } else {
            refreshSavedCount();
          }
        })
        .catch(() => {
          refreshSavedCount();
        });
    } else {
      // Carrega dados da Empresa do usuário ativo
      setProfile(null);
      const companyId = currentSession?.companyId;
      const userId = currentSession?.userId;

      if (companyId) {
        api
          .getCompany(companyId)
          .then((c) => {
            if (c) setCompanyProfile(c);
          })
          .catch(() => {});
      } else if (userId) {
        api
          .getCompanyByUser(userId)
          .then((c) => {
            if (c) setCompanyProfile(c);
          })
          .catch(() => {});
      } else {
        setCompanyProfile(null);
      }
    }
  }, [authVersion, screen]);

  const handleLogout = () => {
    clearSession();
    setProfile(null);
    setCompanyProfile(null);
    setSelectedMatch(null);
    setSelectedOpportunity(null);
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
      const opp = await api.getOpportunity(id);
      setSelectedOpportunity({
        ...opp,
        short: opp.shortDescription || opp.short || opp.description,
        match: opp.match || opp.matchScore || 96,
        meta: opp.meta || opp.metaInfo || "Prazo 15/10/2026 · Brasil · Remoto",
      });
    } catch {}
    go("opportunity");
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

  // Segregação de Fluxo em Tempo de Renderização
  const isCompany = accountType === "COMPANY";

  const displayName = isCompany
    ? companyProfile?.name || session?.name || "Empresa Alpha"
    : profile?.name || session?.name || "Nexa Health";
  const displayAvatarUrl = isCompany
    ? companyProfile?.avatarUrl || session?.avatarUrl
    : profile?.avatarUrl || session?.avatarUrl;

  let page: React.ReactNode = null;

  // Telas Exclusivas do Fluxo Empresa
  if (isCompany) {
    if (screen === "search-startups") {
      page = (
        <SearchStartupsScreen
          go={go}
          companyId={activeCompanyId}
          onSelectStartup={setSelectedStartupMatch}
        />
      );
    } else if (screen === "startup-detail") {
      page = <StartupMatchDetailScreen go={go} startup={selectedStartupMatch} />;
    } else if (screen === "my-opportunities") {
      page = (
        <MyOpportunities go={go} onSelectOpportunity={setSelectedOpportunity} />
      );
    } else if (screen === "create-opportunity") {
      page = <CreateForm go={go} opportunity />;
    } else if (screen === "company-profile") {
      page = (
        <CompanyProfileScreen
          go={go}
          companyId={activeCompanyId}
          company={companyProfile}
          onCompanyUpdated={setCompanyProfile}
        />
      );
    } else if (screen === "assistant") {
      page = <Assistant go={go} profile={profile} startupId={activeStartupId} />;
    } else if (screen === "settings") {
      page = (
        <SettingsPage
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
        />
      );
    } else if (["account", "privacy", "preferences", "notifications"].includes(screen)) {
      page = (
        <SubSettings
          screen={screen}
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
        />
      );
    } else {
      // Fallback para Empresa é sempre a busca de startups
      page = (
        <SearchStartupsScreen
          go={go}
          companyId={activeCompanyId}
          onSelectStartup={setSelectedStartupMatch}
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
      page = <CompanyMatchDetailScreen go={go} company={selectedCompanyMatch} />;
    } else if (screen === "saved-opportunities") {
      page = (
        <SavedOpportunities
          go={go}
          startupId={activeStartupId}
          onSelectOpportunity={setSelectedOpportunity}
          onSavedChange={() => refreshSavedCount()}
        />
      );
    } else if (screen === "opportunity") {
      page = (
        <OpportunityDetail
          go={go}
          selectedOpportunity={selectedOpportunity}
          startupId={activeStartupId}
          profile={profile}
          onSavedChange={() => refreshSavedCount()}
        />
      );
    } else if (screen === "match") {
      page = (
        <MatchDetail
          go={go}
          selectedMatch={selectedMatch}
          onOpenOpportunity={handleOpenOpportunityById}
          onSavedChange={() => refreshSavedCount()}
        />
      );
    } else if (screen === "assistant") {
      page = <Assistant go={go} profile={profile} startupId={activeStartupId} />;
    } else if (screen === "startup" || screen === "account") {
      page = (
        <SubSettings
          screen="account"
          go={go}
          startupId={activeStartupId}
          profile={profile}
          onProfileUpdated={setProfile}
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
        />
      );
    } else {
      // Fallback para Startup é o Dashboard
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
      onLogout={handleLogout}
    >
      {page}
    </AppShell>
  );
}
