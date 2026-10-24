import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/startin/ShellLayout";
import {
  api,
  getSession,
  type MatchItem,
  type OpportunityItem,
  type StartupProfileData,
} from "@/lib/api";
import {
  Assistant,
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
  SettingsPage,
  Signup,
  Startup,
  SubSettings,
  Verify,
} from "@/screens";
import type { Screen } from "@/types/startin";

export default function Home() {
  const [screen, setScreen] = useState<Screen>(() =>
    getSession() || localStorage.getItem("startin-auth") ? "dashboard" : "login"
  );
  const [selectedScreen, setSelectedScreen] = useState<Screen>(screen);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [profile, setProfile] = useState<StartupProfileData | null>(null);
  const [matchesCount, setMatchesCount] = useState<number>(2);
  const [savedCount, setSavedCount] = useState<number>(() => getLocalSavedOpportunities().length);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [authVersion, setAuthVersion] = useState(0);

  const session = getSession();
  const activeStartupId = profile?.id || session?.startupProfileId;

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

  useEffect(() => setSelectedScreen(screen), [screen]);

  useEffect(() => {
    const currentSession = getSession();
    const loader = currentSession?.startupProfileId
      ? api.getProfile(currentSession.startupProfileId)
      : currentSession?.userId
      ? api.getProfileByUser(currentSession.userId)
      : api.getDefaultProfile();

    loader
      .then((p) => {
        if (p) setProfile(p);
      })
      .catch(() => {});

    api
      .getMatches(currentSession?.startupProfileId)
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
  }, [authVersion, screen]);

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
      <Onboarding go={go} startupId={activeStartupId} onProfileUpdated={setProfile} />
    );
  }

  const displayStartupName = profile?.name || session?.name || "Nexa Health";
  const displayAvatarUrl = profile?.avatarUrl || session?.avatarUrl;

  let page: React.ReactNode = null;
  if (screen === "dashboard")
    page = (
      <Dashboard
        go={go}
        startupId={activeStartupId}
        startupName={displayStartupName}
        onSelectOpportunityById={handleOpenOpportunityById}
      />
    );
  else if (screen === "for-you")
    page = (
      <Opportunities
        go={go}
        startupId={activeStartupId}
        profile={profile}
        onSelectOpportunity={setSelectedOpportunity}
      />
    );
  else if (screen === "explore")
    page = (
      <Opportunities
        go={go}
        explore
        startupId={activeStartupId}
        profile={profile}
        onSelectOpportunity={setSelectedOpportunity}
      />
    );
  else if (screen === "saved-opportunities")
    page = (
      <SavedOpportunities
        go={go}
        startupId={activeStartupId}
        onSelectOpportunity={setSelectedOpportunity}
        onSavedChange={() => refreshSavedCount()}
      />
    );
  else if (screen === "opportunity")
    page = (
      <OpportunityDetail
        go={go}
        selectedOpportunity={selectedOpportunity}
        startupId={activeStartupId}
        profile={profile}
        onSavedChange={() => refreshSavedCount()}
      />
    );
  else if (screen === "matches")
    page = (
      <Matches
        go={go}
        startupId={activeStartupId}
        onSelectMatch={setSelectedMatch}
      />
    );
  else if (screen === "match")
    page = (
      <MatchDetail
        go={go}
        selectedMatch={selectedMatch}
        onOpenOpportunity={handleOpenOpportunityById}
      />
    );
  else if (screen === "assistant")
    page = <Assistant go={go} profile={profile} startupId={activeStartupId} />;
  else if (screen === "startup")
    page = (
      <Startup
        go={go}
        startupId={activeStartupId}
        profile={profile}
        onProfileUpdated={setProfile}
      />
    );
  else if (screen === "my-opportunities")
    page = (
      <MyOpportunities go={go} onSelectOpportunity={setSelectedOpportunity} />
    );
  else if (screen === "create-company") page = <CreateForm go={go} />;
  else if (screen === "create-opportunity")
    page = <CreateForm go={go} opportunity />;
  else if (screen === "settings")
    page = (
      <SettingsPage
        go={go}
        startupId={activeStartupId}
        profile={profile}
        onProfileUpdated={setProfile}
      />
    );
  else if (["account", "privacy", "preferences", "notifications"].includes(screen))
    page = (
      <SubSettings
        screen={screen}
        go={go}
        startupId={activeStartupId}
        profile={profile}
        onProfileUpdated={setProfile}
      />
    );
  else
    page = (
      <Dashboard
        go={go}
        startupId={activeStartupId}
        startupName={displayStartupName}
        onSelectOpportunityById={handleOpenOpportunityById}
      />
    );

  return (
    <AppShell
      screen={selectedScreen}
      go={go}
      startupName={displayStartupName}
      avatarUrl={displayAvatarUrl}
      matchesCount={matchesCount}
      savedCount={savedCount}
    >
      {page}
    </AppShell>
  );
}
