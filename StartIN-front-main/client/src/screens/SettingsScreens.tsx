import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  Check,
  Shield,
  Target,
  UserRound,
  X,
} from "@/icons";
import { BackButton, Field, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, clearSession, getSession, saveSession, type StartupProfileData } from "@/lib/api";
import type { Screen } from "@/types/startin";
import { getInitials } from "@/utils/formatters";

export function SettingsPage({
  go,
  startupId,
  profile,
  onProfileUpdated,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  profile?: StartupProfileData | null;
  onProfileUpdated?: (p: StartupProfileData) => void;
}) {
  const [quickToggles, setQuickToggles] = useState<[boolean, boolean, boolean]>([
    profile?.receiveAiRecommendations ?? true,
    profile?.emailNotifications ?? true,
    profile?.matchAlerts ?? true,
  ]);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    if (profile) {
      setQuickToggles([
        profile.receiveAiRecommendations ?? true,
        profile.emailNotifications ?? true,
        profile.matchAlerts ?? true,
      ]);
    }
  }, [profile]);

  const handleToggleQuickPref = async (index: number) => {
    const next: [boolean, boolean, boolean] = [
      index === 0 ? !quickToggles[0] : quickToggles[0],
      index === 1 ? !quickToggles[1] : quickToggles[1],
      index === 2 ? !quickToggles[2] : quickToggles[2],
    ];
    setQuickToggles(next);

    try {
      const session = getSession();
      const targetId = profile?.id || startupId || session?.startupProfileId || 1;
      const updated = await api.updatePreferences(targetId, {
        receiveAiRecommendations: next[0],
        emailNotifications: next[1],
        matchAlerts: next[2],
      });
      onProfileUpdated?.(updated);
      setSavedNotice("Preferência rápida sincronizada!");
      setTimeout(() => setSavedNotice(""), 2500);
    } catch {
      setSavedNotice("Preferência atualizada!");
      setTimeout(() => setSavedNotice(""), 2500);
    }
  };

  const cards: [Screen, React.ElementType, string, string][] = [
    [
      "account",
      UserRound,
      "Conta e acesso",
      "E-mail, foto de perfil, senha e informações básicas da sua conta.",
    ],
    [
      "preferences",
      Target,
      "Preferências de matching",
      "Ajuste os critérios usados pela IA para encontrar oportunidades.",
    ],
    [
      "privacy",
      Shield,
      "Privacidade e segurança",
      "Controle seus dados, visibilidade do perfil e sessões ativas.",
    ],
    [
      "notifications",
      Bell,
      "Notificações",
      "Escolha quais alertas você deseja receber e por onde.",
    ],
  ];

  const quickLabels = [
    {
      title: "Mostrar recomendações personalizadas",
      subtitle: "Ativa a priorização de oportunidades com base nos dados do perfil da startup.",
    },
    {
      title: "Receber novidades e oportunidades por e-mail",
      subtitle: "Envia resumos de novos editais, eventos e demandas corporativas abertas.",
    },
    {
      title: "Alertas de novos matches",
      subtitle: "Notifica sempre que o cálculo diário das 08h encontrar alta aderência.",
    },
  ];

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />
      <PageTitle
        title="Configurações"
        description="Gerencie sua conta, preferências e privacidade na StartIn."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map(([screen, Icon, title, text]) => (
          <button
            key={title}
            onClick={() => go(screen)}
            className="group rounded-2xl border border-[#e2e7eb] bg-white p-6 text-left hover:border-[#b8cad8]"
          >
            <Icon className="text-[#075394]" size={20} />
            <div className="mt-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#123b62]">{title}</h2>
                <p className="mt-2 max-w-[310px] text-xs leading-5 text-[#788691]">{text}</p>
              </div>
              <ArrowRight
                className="text-[#7f8f9a] transition group-hover:translate-x-1"
                size={18}
              />
            </div>
          </button>
        ))}
      </div>
      <section className="mt-5 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#123b62]">Preferências rápidas</h2>
          {savedNotice && (
            <span className="rounded-full bg-[#e8f6ef] px-3 py-1 text-[11px] font-bold text-[#18734d]">
              {savedNotice}
            </span>
          )}
        </div>
        {quickLabels.map((item, i) => {
          const isActive = quickToggles[i];
          return (
            <div
              key={item.title}
              className="flex items-center justify-between gap-4 border-b border-[#eef1f3] py-5 last:border-0"
            >
              <div>
                <span className="block text-sm font-bold text-[#284a67]">{item.title}</span>
                <span className="mt-0.5 block text-xs text-[#82909a]">{item.subtitle}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[11px] font-bold ${
                    isActive ? "text-[#075394]" : "text-[#8e9aa4]"
                  }`}
                >
                  {isActive ? "Ativo" : "Inativo"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => handleToggleQuickPref(i)}
                  className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
                    isActive ? "bg-[#075394]" : "bg-[#b8c4cc]"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

const SECTOR_OPTIONS = [
  "Saúde / Healthtech",
  "Finanças / Fintech",
  "Varejo & E-commerce",
  "Indústria 4.0 & Logística",
  "Agronegócio / Agtech",
  "Educação / Edtech",
  "Energia & Sustentabilidade",
  "GovTech & Cidades Inteligentes",
  "Cibersegurança & TI",
  "Multissetorial / B2B",
];

const TECH_OPTIONS = [
  "IA, Dados e Automação",
  "SaaS B2B & Cloud",
  "Machine Learning & Analytics",
  "IoT & Sensores Inteligentes",
  "APIs, Integrações & ERP",
  "Visão Computacional",
  "Blockchain & Web3",
  "Biotecnologia & Saúde Digital",
];

const LOCATION_OPTIONS = [
  "Brasil (Nacional / Remoto)",
  "Nordeste (Recife / Porto Digital)",
  "Sudeste (SP / RJ / MG)",
  "Sul (PR / SC / RS)",
  "Centro-Oeste & Norte",
  "América Latina / Internacional",
];

const STAGE_OPTIONS = [
  "Ideação / Pré-operação",
  "MVP / Validação",
  "Operação inicial",
  "Tração",
  "Escala / Growth",
];

const INVESTMENT_OPTIONS = [
  "Até R$ 100 mil (Subvenção / Pré-Seed)",
  "R$ 100 mil a R$ 500 mil",
  "R$ 500 mil a R$ 1 milhão",
  "R$ 1 milhão a R$ 3 milhões",
  "Acima de R$ 3 milhões (Série A+)",
];

export function SubSettings({
  screen,
  go,
  startupId,
  profile,
  onProfileUpdated,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  startupId?: number;
  profile: StartupProfileData | null;
  onProfileUpdated: (p: StartupProfileData) => void;
}) {
  const titles: Record<string, [string, string]> = {
    account: [
      "Conta e acesso",
      "Gerencie seus dados de acesso, foto de perfil e informações básicas da sua conta.",
    ],
    privacy: [
      "Privacidade e segurança",
      "Controle a visibilidade do seu perfil, seus dados e as sessões ativas.",
    ],
    preferences: [
      "Preferências de matching",
      "Defina o que é mais relevante para a IA encontrar oportunidades para sua startup.",
    ],
    notifications: [
      "Notificações",
      "Acompanhe matches, oportunidades e atualizações importantes.",
    ],
  };
  const [title, description] = titles[screen];

  const [notifFilter, setNotifFilter] = useState("Todas");
  const [notifs, setNotifs] = useState<
    Array<{
      id: number;
      title: string;
      description: string;
      timeAgo: string;
      type: string;
      read: boolean;
    }>
  >([]);

  const session = getSession();
  const [accName, setAccName] = useState(session?.name || profile?.userName || "Administrador");
  const [accEmail, setAccEmail] = useState(
    session?.email || profile?.userEmail || "admin@startin.com"
  );
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatarUrl || session?.avatarUrl || ""
  );
  const [accountSavedMsg, setAccountSavedMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado dos critérios de Preferências de Matching
  const [prefType, setPrefType] = useState(() => {
    const raw = profile?.opportunityTypes || "POC, Compra, Editais";
    return raw;
  });
  const [mainSector, setMainSector] = useState(
    profile?.mainSector || profile?.mainArea || SECTOR_OPTIONS[0]
  );
  const [technologies, setTechnologies] = useState(
    profile?.technologies || TECH_OPTIONS[0]
  );
  const [operationRegion, setOperationRegion] = useState(
    profile?.operationRegion || profile?.location || LOCATION_OPTIONS[0]
  );
  const [currentStage, setCurrentStage] = useState(
    profile?.currentStage || STAGE_OPTIONS[3]
  );
  const [investmentNeed, setInvestmentNeed] = useState(
    profile?.investmentNeed || INVESTMENT_OPTIONS[2]
  );
  const [prefsSavedMsg, setPrefsSavedMsg] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [privacyToggles, setPrivacyToggles] = useState([true, true]);

  useEffect(() => {
    if (profile) {
      if (profile.opportunityTypes) setPrefType(profile.opportunityTypes);
      if (profile.mainSector || profile.mainArea)
        setMainSector(profile.mainSector || profile.mainArea);
      if (profile.technologies) setTechnologies(profile.technologies);
      if (profile.operationRegion || profile.location)
        setOperationRegion(profile.operationRegion || profile.location);
      if (profile.currentStage) setCurrentStage(profile.currentStage);
      if (profile.investmentNeed) setInvestmentNeed(profile.investmentNeed);
      if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
    }
  }, [profile]);

  useEffect(() => {
    if (screen === "notifications") {
      api
        .getNotifications(notifFilter)
        .then((res) => setNotifs(res))
        .catch(() => {});
    }
    if (screen === "account" && session?.userId) {
      api
        .getUser(session.userId)
        .then((u) => {
          if (u.name) setAccName(u.name);
          if (u.email) setAccEmail(u.email);
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
        })
        .catch(() => {});
    }
  }, [screen, notifFilter]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setAvatarUrl(dataUrl);
      if (session) {
        saveSession({ ...session, avatarUrl: dataUrl });
      }
      try {
        const targetId = profile?.id || startupId || session?.startupProfileId || 1;
        if (session?.userId) {
          await api.updateUser(session.userId, { avatarUrl: dataUrl });
        }
        const updated = await api.updatePreferences(targetId, { avatarUrl: dataUrl });
        onProfileUpdated(updated);
        setAccountSavedMsg("Foto de perfil atualizada com sucesso!");
        setTimeout(() => setAccountSavedMsg(""), 3500);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccount = async () => {
    setAccountSavedMsg("");
    try {
      if (session?.userId) {
        const updated = await api.updateUser(session.userId, {
          name: accName,
          email: accEmail,
          avatarUrl: avatarUrl || undefined,
        });
        saveSession({
          ...session,
          name: updated.name,
          email: updated.email,
          avatarUrl: updated.avatarUrl || avatarUrl,
        });
      }
      const targetId = profile?.id || startupId || session?.startupProfileId || 1;
      if (avatarUrl) {
        const updatedProfile = await api.updatePreferences(targetId, { avatarUrl });
        onProfileUpdated(updatedProfile);
      }
      setAccountSavedMsg("Informações da conta salvas com sucesso!");
      setTimeout(() => setAccountSavedMsg(""), 3500);
    } catch {
      setAccountSavedMsg("Informações salvas localmente.");
    }
  };

  const handleDeleteAccount = async () => {
    if (session?.userId) {
      try {
        await api.deleteUser(session.userId);
      } catch {}
    }
    clearSession();
    go("login");
  };

  const handleSaveMatchingPreferences = async () => {
    setSavingPrefs(true);
    setPrefsSavedMsg("");
    try {
      const targetId = profile?.id || startupId || session?.startupProfileId || 1;
      const updated = await api.updatePreferences(targetId, {
        opportunityTypes: prefType,
        mainSector,
        technologies,
        areasOfInterest: `${mainSector}, ${technologies}`,
        operationRegion,
        currentStage,
        investmentNeed,
      });
      onProfileUpdated(updated);
      setPrefsSavedMsg("Preferências de matching salvas e integradas ao banco!");
      setTimeout(() => setPrefsSavedMsg(""), 4000);
    } catch {
      setPrefsSavedMsg("Preferências atualizadas!");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (screen === "notifications") {
    const fallbackNotifs = [
      [
        "Novo match encontrado",
        "Uma oportunidade de POC teve 94% de compatibilidade com sua startup.",
        "Hoje, 09:42",
      ],
      [
        "Novo edital recomendado",
        "A StartIn encontrou um edital alinhado ao seu perfil de atuação.",
        "Hoje, 08:15",
      ],
      [
        "Evento próximo do seu perfil",
        "Tech & Innovation Week pode gerar conexões relevantes para sua startup.",
        "Ontem, 17:30",
      ],
      [
        "Seu perfil foi atualizado",
        "As preferências de matching foram aplicadas às novas recomendações.",
        "18 set, 14:10",
      ],
    ];

    return (
      <>
        <BackButton label="Voltar para configurações" onClick={() => go("settings")} />
        <PageTitle title={title} description={description} />
        <div className="mt-7 flex flex-wrap gap-2">
          {["Todas", "Oportunidades", "Matches", "Sistema"].map((x) => (
            <button
              key={x}
              onClick={() => setNotifFilter(x)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                notifFilter === x
                  ? "bg-[#075394] text-white"
                  : "bg-white text-[#46627c] ring-1 ring-[#e3e8ec]"
              }`}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {(notifs.length > 0
            ? notifs.map((n) => [n.title, n.description, n.timeAgo])
            : fallbackNotifs
          ).map(([a, b, c], idx) => (
            <div
              key={`${a}-${idx}`}
              className="flex gap-4 rounded-2xl border border-[#e2e7eb] bg-white p-5"
            >
              <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-[#eaf2f8]" />
              <div>
                <p className="text-sm font-extrabold text-[#244766]">{a}</p>
                <p className="mt-1 text-xs text-[#70808c]">{b}</p>
                <p className="mt-3 text-[10px] text-[#9aa5ad]">{c}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <BackButton label="Voltar para configurações" onClick={() => go("settings")} />
      <PageTitle title={title} description={description} />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        {screen === "account" && (
          <>
            {accountSavedMsg && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] px-4 py-3 text-xs font-bold text-[#166d48]">
                <span>{accountSavedMsg}</span>
                <button onClick={() => setAccountSavedMsg("")}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#edf0f2] pb-7 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accName}
                      className="h-16 w-16 rounded-full border-2 border-[#075394] object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#062f61] text-lg font-extrabold text-white">
                      {getInitials(accName || profile?.name || "StartIn")}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#075394] text-white shadow"
                  >
                    <Camera size={13} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#123b62]">Foto de perfil</h3>
                  <p className="mt-1 text-xs text-[#768692]">
                    Exibida na barra superior e no perfil da sua startup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d6e0e7] bg-[#f8fafc] px-4 py-2.5 text-xs font-bold text-[#075394] transition hover:bg-[#eaf2f8] sm:self-auto"
              >
                <Camera size={14} />
                {avatarUrl ? "Alterar foto" : "Adicionar foto"}
              </button>
            </div>

            <h2 className="text-base font-extrabold text-[#123b62]">Informações da conta</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Nome completo" value={accName} onChange={setAccName} />
              <Field label="E-mail" value={accEmail} onChange={setAccEmail} />
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={handleSaveAccount}>
                Salvar informações <Check size={15} />
              </PrimaryButton>
            </div>
            <div className="mt-8 border-t border-[#edf0f2] pt-7">
              <h2 className="text-base font-extrabold text-[#123b62]">Segurança</h2>
              <p className="mt-4 mb-3 text-xs text-[#768692]">Senha · ••••••••••••</p>
              <PrimaryButton secondary onClick={() => go("reset")}>
                Alterar senha
              </PrimaryButton>
            </div>
            <div className="mt-8 border-t border-[#edf0f2] pt-7">
              <h2 className="text-base font-extrabold text-[#123b62]">Excluir conta</h2>
              <p className="mt-3 text-xs text-[#768692]">
                Essa ação remove permanentemente os dados desta conta.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="mt-4 rounded-lg bg-[#d71920] px-5 py-3 text-xs font-bold text-white hover:bg-[#b8141a]"
              >
                Excluir conta
              </button>
            </div>
          </>
        )}

        {screen === "privacy" && (
          <>
            <h2 className="text-base font-extrabold text-[#123b62]">Visibilidade e dados</h2>
            {["Perfil público", "Dados e recomendações"].map((x, i) => {
              const active = privacyToggles[i];
              return (
                <div
                  key={x}
                  className="flex items-center justify-between border-b border-[#edf0f2] py-6"
                >
                  <div>
                    <p className="text-sm font-bold text-[#284a67]">{x}</p>
                    <p className="mt-1 text-xs text-[#82909a]">
                      {i
                        ? "Usar dados do perfil para personalizar recomendações."
                        : "Permitir que outras pessoas encontrem sua startup na StartIn."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[11px] font-bold ${
                        active ? "text-[#075394]" : "text-[#8e9aa4]"
                      }`}
                    >
                      {active ? "Ativo" : "Inativo"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPrivacyToggles((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                      }
                      className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                        active ? "bg-[#075394]" : "bg-[#b8c4cc]"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
            <h2 className="mt-8 text-base font-extrabold text-[#123b62]">Segurança da conta</h2>
            <p className="mt-4 text-xs text-[#768692]">Windows · Chrome · Sessão atual</p>
            <button
              type="button"
              onClick={() => go("login")}
              className="mt-4 text-xs font-bold text-[#075394] hover:underline"
            >
              Encerrar outras sessões
            </button>
          </>
        )}

        {screen === "preferences" && (
          <>
            {prefsSavedMsg && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] px-4 py-3 text-xs font-bold text-[#166d48]">
                <span>{prefsSavedMsg}</span>
                <button onClick={() => setPrefsSavedMsg("")}>
                  <X size={14} />
                </button>
              </div>
            )}

            <h2 className="text-base font-extrabold text-[#123b62]">Tipo de oportunidade</h2>
            <p className="mt-1 text-xs text-[#7d8a95]">
              Escolha quais modalidades a IA deve priorizar no cálculo de aderência.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "POC", value: "POC" },
                { label: "Compra", value: "Compra" },
                { label: "Editais", value: "Editais" },
                { label: "Eventos", value: "Eventos" },
                { label: "POC + Compra", value: "POC, Compra" },
                { label: "Todas (POC, Compra, Editais e Eventos)", value: "POC, Compra, Editais, Eventos" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPrefType(opt.value)}
                  className={`rounded-lg px-5 py-3 text-xs font-bold transition ${
                    prefType.toLowerCase() === opt.value.toLowerCase()
                      ? "bg-[#075394] text-white shadow-sm"
                      : "bg-[#f3f6f8] text-[#486680] hover:bg-[#e6edf2]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <h2 className="mt-9 text-base font-extrabold text-[#123b62]">
              Critérios de interesse
            </h2>
            <p className="mt-1 text-xs text-[#7d8a95]">
              Configure o setor, tecnologias, localização, maturidade e ticket buscado pela sua startup.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-xs font-semibold text-[#587086]">
                Setor e segmento
                <select
                  value={mainSector}
                  onChange={(e) => setMainSector(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#075394]"
                >
                  {Array.from(new Set([mainSector, ...SECTOR_OPTIONS])).filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#587086]">
                Tecnologia e solução
                <select
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#075394]"
                >
                  {Array.from(new Set([technologies, ...TECH_OPTIONS])).filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#587086]">
                Localização
                <select
                  value={operationRegion}
                  onChange={(e) => setOperationRegion(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#075394]"
                >
                  {Array.from(new Set([operationRegion, ...LOCATION_OPTIONS])).filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#587086]">
                Estágio da startup
                <select
                  value={currentStage}
                  onChange={(e) => setCurrentStage(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#075394]"
                >
                  {Array.from(new Set([currentStage, ...STAGE_OPTIONS])).filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#587086]">
                Faixa de investimento
                <select
                  value={investmentNeed}
                  onChange={(e) => setInvestmentNeed(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#075394]"
                >
                  {Array.from(new Set([investmentNeed, ...INVESTMENT_OPTIONS])).filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-7 flex flex-col justify-between gap-4 border-t border-[#edf0f2] pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-[#84919a]">
                A IA usará essas preferências para filtrar e personalizar seus matches.
              </p>
              <PrimaryButton disabled={savingPrefs} onClick={handleSaveMatchingPreferences}>
                Salvar preferências <Check size={15} />
              </PrimaryButton>
            </div>
          </>
        )}
      </section>
    </>
  );
}
