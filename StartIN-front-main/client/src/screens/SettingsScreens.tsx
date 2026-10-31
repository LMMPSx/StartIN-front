import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Plus,
  Shield,
  Sparkles,
  Target,
  Upload,
  UserRound,
  X,
} from "@/icons";
import { BackButton, Field, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import {
  api,
  clearSession,
  getSession,
  saveSession,
  type NotificationItem,
  type StartupProfileData,
} from "@/lib/api";
import type { Screen } from "@/types/startin";
import { getInitials } from "@/utils/formatters";
import {
  calculateTrlFromAnswers,
  MAIN_TECH_AREAS,
  NASA_TRL_QUESTIONS,
} from "./OnboardingScreen";

const DEFAULT_INTEREST_AREAS = [
  "IA",
  "Saúde",
  "Dados",
  "Automação",
  "SaaS B2B",
  "FinTech",
  "Cloud",
  "IoT",
  "Analytics",
  "Educação",
];

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
  const session = getSession();
  const isCompany = session?.accountType === "COMPANY";

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

    if (isCompany) {
      setSavedNotice("Preferência atualizada!");
      setTimeout(() => setSavedNotice(""), 2500);
      return;
    }

    try {
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

  const cards: [Screen, React.ElementType, string, string][] = isCompany
    ? [
        [
          "company-profile",
          UserRound,
          "Minha empresa & Conta",
          "Foto corporativa, CNPJ, telefone, demandas abertas e dados da empresa.",
        ],
        [
          "privacy",
          Shield,
          "Privacidade e segurança",
          "Controle seus dados corporativos, visibilidade do perfil e sessões ativas.",
        ],
        [
          "notifications",
          Bell,
          "Notificações",
          "Escolha quais alertas de startups e matches você deseja receber.",
        ],
      ]
    : [
        [
          "account",
          UserRound,
          "Conta e acesso",
          "Foto, CNPJ, telefone, estágio (Validação/Tração) e dados da sua startup.",
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
      subtitle: "Ativa a priorização inteligente com base nos dados cadastrados do perfil.",
    },
    {
      title: "Receber novidades e oportunidades por e-mail",
      subtitle: "Envia resumos de novos matches e demandas corporativas compatíveis.",
    },
    {
      title: "Alertas de novos matches",
      subtitle: "Notifica sempre que o motor de IA identificar alta aderência.",
    },
  ];

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Configurações"
        description="Gerencie sua conta, preferências e privacidade na StartIn."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map(([targetScreen, Icon, title, text]) => (
          <button
            key={title}
            onClick={() => go(targetScreen)}
            className="group rounded-2xl border border-[#e2e7eb] bg-white p-6 text-left hover:border-[#b8cad8]"
          >
            <Icon className="text-[#111827]" size={20} />
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
                    isActive ? "text-[#111827]" : "text-[#8e9aa4]"
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
                    isActive ? "bg-[#111827]" : "bg-[#b8c4cc]"
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

const STAGE_OPTIONS = ["Validação", "Tração"];

const INVESTMENT_OPTIONS = [
  "Até R$ 100 mil (Subvenção / Pré-Seed)",
  "R$ 100 mil a R$ 500 mil",
  "R$ 500 mil a R$ 1 milhão",
  "R$ 1 milhão a R$ 3 milhões",
  "Acima de R$ 3 milhões (Série A+)",
];

function normalizeStageLabel(stage?: string): "Validação" | "Tração" {
  const s = (stage || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return s.includes("tracao") ? "Tração" : "Validação";
}

export function SubSettings({
  screen,
  go,
  startupId,
  companyId,
  profile,
  onProfileUpdated,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  onNotificationTrigger,
}: {
  screen: Screen;
  go: (s: Screen) => void;
  startupId?: number;
  companyId?: number;
  profile: StartupProfileData | null;
  onProfileUpdated: (p: StartupProfileData) => void;
  notifications?: NotificationItem[];
  onNotificationClick?: (n: NotificationItem) => void;
  onMarkAllRead?: () => void;
  onNotificationTrigger?: () => void;
}) {
  const titles: Record<string, [string, string]> = {
    account: [
      "Conta e acesso",
      "Gerencie CNPJ, telefone, estágio atual (Validação ou Tração), problema estruturado por IA e credenciais.",
    ],
    privacy: [
      "Privacidade e segurança",
      "Controle a visibilidade do seu perfil, seus dados e as sessões ativas.",
    ],
    preferences: [
      "Preferências de matching",
      "Defina os critérios e o estágio usados pela IA para filtrar oportunidades na plataforma.",
    ],
    notifications: [
      "Notificações",
      "Clique em qualquer notificação para acessar diretamente o item e marcá-la automaticamente como vista.",
    ],
  };
  const [title, description] = titles[screen] || titles.account;

  const [notifFilter, setNotifFilter] = useState("Todas");
  const [notifs, setNotifs] = useState<NotificationItem[]>(notifications);

  useEffect(() => {
    setNotifs(notifications);
  }, [notifications]);

  const session = getSession();
  const [accName, setAccName] = useState(session?.name || profile?.userName || "Administrador");
  const [accEmail, setAccEmail] = useState(
    session?.email || profile?.userEmail || "admin@startin.com"
  );
  const [accPhone, setAccPhone] = useState(profile?.phone || session?.phone || "");
  const [accCnpj, setAccCnpj] = useState(profile?.cnpj || session?.cnpj || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || session?.avatarUrl || "");
  const [accountSavedMsg, setAccountSavedMsg] = useState("");
  const [accountErrorMsg, setAccountErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dados da Startup em Conta e Acesso (sem descrição curta!)
  const [startupName, setStartupName] = useState(profile?.name || session?.name || "Nexa Health");
  const [startupWebsite, setStartupWebsite] = useState(profile?.website || "");
  const [startupProblem, setStartupProblem] = useState(profile?.problem || "");
  const [enhancingProblem, setEnhancingProblem] = useState(false);

  // Área Principal (Dropdown + Outro)
  const initialArea = profile?.mainArea || profile?.mainSector || MAIN_TECH_AREAS[0];
  const isInitialKnown =
    (MAIN_TECH_AREAS as readonly string[]).includes(initialArea) && initialArea !== "Outro";
  const [selectedMainArea, setSelectedMainArea] = useState<string>(
    isInitialKnown ? initialArea : "Outro"
  );
  const [customMainArea, setCustomMainArea] = useState<string>(isInitialKnown ? "" : initialArea);

  // Estágio (Validação vs Tração + TRL + PDF)
  const [currentStage, setCurrentStage] = useState<"Validação" | "Tração">(
    normalizeStageLabel(profile?.currentStage)
  );
  const [trlScore, setTrlScore] = useState<number>(profile?.trlScore ?? 4);
  const [tractionAttested, setTractionAttested] = useState<boolean>(
    Boolean(profile?.tractionAttested)
  );
  const [tractionAttestationInfo, setTractionAttestationInfo] = useState<string>(
    profile?.tractionAttestationInfo || ""
  );
  const [trlAnswers, setTrlAnswers] = useState<Record<string, "SIM" | "NAO">>({});
  const [verifyingPdf, setVerifyingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [receiveRecs, setReceiveRecs] = useState(profile?.receiveAiRecommendations ?? true);
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [selectedOppTypes, setSelectedOppTypes] = useState<string[]>(() => {
    const stg = normalizeStageLabel(profile?.currentStage);
    const defaultForStage =
      stg === "Tração"
        ? ["Compra", "Editais", "Eventos"]
        : ["POC", "Primeira Compra", "Editais", "Eventos"];
    const raw = profile?.opportunityTypes || "";
    const parsed = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : defaultForStage;
  });

  const [selectedAreas, setSelectedAreas] = useState<string[]>(() => {
    const raw = profile?.areasOfInterest || profile?.technologies || "IA, Saúde, Dados, Automação";
    const parsed = raw
      .split(/[,•]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : ["IA", "Saúde", "Dados", "Automação"];
  });

  // Preferências de Matching (tela separada)
  const [prefType, setPrefType] = useState(() => {
    return (
      profile?.opportunityTypes ||
      (normalizeStageLabel(profile?.currentStage) === "Tração"
        ? "Compra, Editais, Eventos"
        : "POC, Primeira Compra, Editais, Eventos")
    );
  });
  const [technologies, setTechnologies] = useState(profile?.technologies || TECH_OPTIONS[0]);
  const [operationRegion, setOperationRegion] = useState(
    profile?.location || profile?.operationRegion || "Recife, PE"
  );
  const [investmentNeed, setInvestmentNeed] = useState(
    profile?.investmentNeed || INVESTMENT_OPTIONS[2]
  );
  const [prefsSavedMsg, setPrefsSavedMsg] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [privacyToggles, setPrivacyToggles] = useState([true, true]);

  useEffect(() => {
    if (profile) {
      if (profile.name) setStartupName(profile.name);
      if (profile.cnpj) setAccCnpj(profile.cnpj);
      if (profile.phone) setAccPhone(profile.phone);
      if (profile.website !== undefined) setStartupWebsite(profile.website || "");
      if (profile.problem !== undefined) setStartupProblem(profile.problem || "");

      const area = profile.mainArea || profile.mainSector || MAIN_TECH_AREAS[0];
      if ((MAIN_TECH_AREAS as readonly string[]).includes(area) && area !== "Outro") {
        setSelectedMainArea(area);
        setCustomMainArea("");
      } else if (area) {
        setSelectedMainArea("Outro");
        setCustomMainArea(area);
      }

      const normStage = normalizeStageLabel(profile.currentStage);
      setCurrentStage(normStage);
      setTrlScore(profile.trlScore ?? (normStage === "Tração" ? 8 : 4));
      setTractionAttested(Boolean(profile.tractionAttested));
      setTractionAttestationInfo(profile.tractionAttestationInfo || "");

      setReceiveRecs(profile.receiveAiRecommendations ?? true);
      if (profile.opportunityTypes) {
        setPrefType(profile.opportunityTypes);
        const parsed = profile.opportunityTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (parsed.length > 0) setSelectedOppTypes(parsed);
      }
      const rawAreas = profile.areasOfInterest || profile.technologies;
      if (rawAreas) {
        const parsed = rawAreas
          .split(/[,•]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parsed.length > 0) setSelectedAreas(parsed);
      }
      if (profile.technologies) setTechnologies(profile.technologies);
      if (profile.location || profile.operationRegion) {
        setOperationRegion(profile.location || profile.operationRegion);
      }
      if (profile.investmentNeed) setInvestmentNeed(profile.investmentNeed);
      if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
    }
  }, [profile]);

  const effectiveMainArea =
    selectedMainArea === "Outro"
      ? customMainArea.trim() || "Tecnologia & Inovação"
      : selectedMainArea;

  const allowedOppOptions =
    currentStage === "Tração"
      ? ["Compra", "Editais", "Eventos"]
      : ["POC", "Primeira Compra", "Editais", "Eventos"];

  const handleStageSwitch = (stage: "Validação" | "Tração") => {
    setCurrentStage(stage);
    if (stage === "Validação") {
      setSelectedOppTypes(["POC", "Primeira Compra", "Editais", "Eventos"]);
      setPrefType("POC, Primeira Compra, Editais, Eventos");
    } else {
      setSelectedOppTypes(["Compra", "Editais", "Eventos"]);
      setPrefType("Compra, Editais, Eventos");
    }
  };

  const toggleOppType = (t: string) => {
    setSelectedOppTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]
    );
  };

  const handleAddCustomArea = () => {
    const clean = customAreaInput.trim();
    if (!clean) return;
    if (!selectedAreas.includes(clean)) {
      setSelectedAreas((prev) => [...prev, clean]);
    }
    setCustomAreaInput("");
  };

  const allAvailableAreas = Array.from(new Set([...DEFAULT_INTEREST_AREAS, ...selectedAreas]));

  useEffect(() => {
    if (screen === "notifications" && notifications.length === 0) {
      const role = session?.accountType === "COMPANY" ? "COMPANY" : "STARTUP";
      api
        .getNotifications({
          type: "Todas",
          role,
          userId: session?.userId,
          startupId: startupId || profile?.id || session?.startupProfileId,
          companyId: companyId || session?.companyId,
        })
        .then((res) => setNotifs(res))
        .catch(() => {});
    }
    if (screen === "account" && session?.userId) {
      api
        .getUser(session.userId)
        .then((u) => {
          if (u.name) setAccName(u.name);
          if (u.email) setAccEmail(u.email);
          if (u.phone) setAccPhone((prev) => prev || u.phone || "");
          if (u.cnpj) setAccCnpj((prev) => prev || u.cnpj || "");
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

  const handleEnhanceProblemInAccount = async () => {
    setAccountErrorMsg("");
    if (!startupProblem.trim() || startupProblem.trim().length < 10) {
      setAccountErrorMsg("Descreva o problema que sua startup resolve antes de melhorar com IA.");
      return;
    }
    setEnhancingProblem(true);
    try {
      const res = await api.enhanceProblemAI({
        text: startupProblem,
        mainArea: effectiveMainArea,
        startupName,
      });
      setStartupProblem(res.enhancedText || startupProblem);
      if (Array.isArray(res.tags) && res.tags.length > 0) {
        setSelectedAreas((prev) => Array.from(new Set([...res.tags, ...prev])));
      }
      setAccountSavedMsg("Texto estruturado com IA! Clique em Salvar dados abaixo para confirmar.");
      setTimeout(() => setAccountSavedMsg(""), 4000);
    } catch (err: any) {
      setAccountErrorMsg(err.message || "Falha ao melhorar o texto com IA.");
    } finally {
      setEnhancingProblem(false);
    }
  };

  const allTrlAnswered = Object.keys(trlAnswers).length === NASA_TRL_QUESTIONS.length;
  const computedTrlScore = calculateTrlFromAnswers(trlAnswers);

  const handleTractionPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAccountErrorMsg("");
    setPdfFileName(file.name);
    setVerifyingPdf(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resultStr = String(reader.result || "");
        const base64 = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
        const answersList = NASA_TRL_QUESTIONS.map((q) => ({
          question: q.question,
          answer: trlAnswers[q.id] || "SIM",
          level: q.level,
        }));
        const res = await api.verifyTractionPdfAI({
          fileName: file.name,
          fileBase64: base64,
          trlScore: computedTrlScore,
          trlAnswers: answersList,
          startupName,
          mainArea: effectiveMainArea,
        });
        if (!res.attested) {
          setAccountErrorMsg(
            res.attestationSummary || "Não foi possível atestar tração com o PDF enviado."
          );
          return;
        }
        setTractionAttested(true);
        setTrlScore(res.trlLevel || Math.max(7, computedTrlScore));
        setTractionAttestationInfo(res.attestationSummary);
        setAccountSavedMsg("Atestado Técnico verificado pela IA! Salve abaixo para aplicar.");
      } catch (err: any) {
        setAccountErrorMsg(err.message || "Erro ao verificar PDF com IA.");
      } finally {
        setVerifyingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccount = async () => {
    setAccountSavedMsg("");
    setAccountErrorMsg("");

    if (currentStage === "Tração" && !tractionAttested) {
      setAccountErrorMsg(
        "Para salvar o estágio Tração, responda às perguntas TRL da NASA e anexe o Atestado de Capacidade Técnica em PDF."
      );
      return;
    }

    try {
      if (session?.userId) {
        const updatedUser = await api.updateUser(session.userId, {
          name: accName,
          email: accEmail,
          phone: accPhone,
          cnpj: accCnpj,
          avatarUrl: avatarUrl || undefined,
        });
        saveSession({
          ...session,
          name: startupName || updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || accPhone,
          cnpj: updatedUser.cnpj || accCnpj,
          avatarUrl: updatedUser.avatarUrl || avatarUrl,
        });
      }

      const targetId = profile?.id || startupId || session?.startupProfileId || 1;
      const filteredTypes = selectedOppTypes.filter((t) => allowedOppOptions.includes(t));
      const finalOppTypes =
        filteredTypes.length > 0 ? filteredTypes.join(", ") : allowedOppOptions.join(", ");

      const updatedProfile = await api.updateProfile(targetId, {
        ...(profile || {}),
        name: startupName,
        cnpj: accCnpj,
        phone: accPhone,
        website: startupWebsite,
        location: operationRegion,
        operationRegion,
        mainArea: effectiveMainArea,
        mainSector: effectiveMainArea,
        description: "",
        problem: startupProblem,
        currentStage,
        trlScore,
        tractionAttested,
        tractionAttestationInfo,
        avatarUrl: avatarUrl || undefined,
        opportunityTypes: finalOppTypes,
        areasOfInterest: selectedAreas.join(", "),
        technologies: selectedAreas.join(", "),
        receiveAiRecommendations: receiveRecs,
      });

      onProfileUpdated(updatedProfile);
      await api.recalculateMatches(updatedProfile.id || targetId, false).catch(() => {});
      onNotificationTrigger?.();
      setAccountSavedMsg("Dados da conta e da startup salvos com sucesso no banco de dados!");
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
      const effectiveStage =
        currentStage === "Tração" && !tractionAttested ? "Validação" : currentStage;
      const updated = await api.updatePreferences(targetId, {
        opportunityTypes: prefType,
        mainSector: effectiveMainArea,
        technologies,
        areasOfInterest: `${effectiveMainArea}, ${technologies}`,
        operationRegion,
        currentStage: effectiveStage,
        trlScore,
        tractionAttested,
        tractionAttestationInfo,
        investmentNeed,
      });
      onProfileUpdated(updated);
      await api.recalculateMatches(updated.id || targetId, false).catch(() => {});
      onNotificationTrigger?.();
      setPrefsSavedMsg("Preferências de matching salvas e integradas ao banco!");
      setTimeout(() => setPrefsSavedMsg(""), 4000);
    } catch {
      setPrefsSavedMsg("Preferências atualizadas!");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (screen === "notifications") {
    const isCompanyRole = session?.accountType === "COMPANY";
    const filteredNotifs = notifs.filter((n) => {
      if (notifFilter === "Todas") return true;
      const t = (n.type || "").toLowerCase();
      if (notifFilter === "Oportunidades") return t.includes("oportunidade");
      if (notifFilter === "Matches") return t.includes("match");
      if (notifFilter === "Sistema") return t.includes("sistema");
      return true;
    });
    const unreadTotal = notifs.filter((n) => !n.read).length;

    return (
      <>
        <BackButton label="Voltar para configurações" onClick={() => go("settings")} />
        <PageTitle
          title={title}
          description={description}
          action={
            unreadTotal > 0 ? (
              <PrimaryButton
                secondary
                onClick={() => {
                  setNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
                  onMarkAllRead?.();
                }}
              >
                <Check size={14} /> Marcar todas como vistas ({unreadTotal > 10 ? "10+" : unreadTotal})
              </PrimaryButton>
            ) : undefined
          }
        />

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["Todas", "Oportunidades", "Matches", "Sistema"].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setNotifFilter(x)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  notifFilter === x
                    ? "bg-[#111827] text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {x}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-[#7a8792]">
            Perfil ativo: <strong className="text-[#111827]">{isCompanyRole ? "Empresa" : "Startup"}</strong>
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setNotifs((prev) =>
                    prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                  );
                  if (onNotificationClick) {
                    onNotificationClick(n);
                  } else {
                    api.markNotificationRead(n.id).catch(() => {});
                    go((n.targetScreen as Screen) || "dashboard");
                  }
                }}
                className={`group flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition hover:border-[#111827] hover:shadow-xs ${
                  !n.read
                    ? "border-[#f3dc8a] bg-[#fffdf5]"
                    : "border-[#e2e7eb] bg-white"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div
                    className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      !n.read
                        ? "bg-[#111827] text-[#FEC908]"
                        : "bg-gray-100 text-[#687681]"
                    }`}
                  >
                    <Bell size={16} />
                    {!n.read && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FEC908]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-[#111827] break-words [overflow-wrap:anywhere] group-hover:underline">
                        {n.title}
                      </p>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-[#4b5563]">
                        {n.type || "Sistema"}
                      </span>
                      {!n.read && (
                        <span className="rounded-full bg-[#FEC908] px-2 py-0.5 text-[9.5px] font-black uppercase text-[#111827]">
                          Nova
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-[#657582] break-words [overflow-wrap:anywhere]">
                      {n.description}
                    </p>
                    <p className="mt-2.5 text-[10.5px] font-semibold text-[#9aa5ad]">
                      {n.timeAgo}
                    </p>
                  </div>
                </div>

                <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-extrabold text-[#111827] transition group-hover:bg-[#111827] group-hover:text-[#FEC908]">
                  Acessar <ArrowRight size={13} />
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-14 text-center">
              <Bell className="mx-auto text-[#9aa5ad]" size={26} />
              <p className="mt-3 text-sm font-bold text-[#111827]">
                Nenhuma notificação nesta categoria
              </p>
              <p className="mt-1 text-xs text-[#7a8792]">
                Novas oportunidades, matches e atualizações deste perfil aparecerão automaticamente aqui.
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <BackButton label="Voltar para configurações" onClick={() => go("settings")} />
      <PageTitle
        title={title}
        description={description}
        action={
          screen === "account" ? (
            <PrimaryButton secondary onClick={() => go("onboarding")}>
              Revisar onboarding em 3 etapas
            </PrimaryButton>
          ) : undefined
        }
      />
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
            {accountErrorMsg && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                <span>{accountErrorMsg}</span>
                <button onClick={() => setAccountErrorMsg("")}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Resumo da Startup Vinculada */}
            <div className="mb-7 flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  Startup Vinculada · Estágio {currentStage}
                </span>
                <h3 className="text-base font-extrabold text-[#111827]">
                  {startupName || "Nexa Health"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-600">
                  {[effectiveMainArea, accCnpj ? `CNPJ ${accCnpj}` : "", operationRegion]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => go("onboarding")}
                className="inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-[#111827] shadow-xs transition hover:bg-gray-100 sm:self-auto"
              >
                Revisar etapas do perfil <ArrowRight size={13} />
              </button>
            </div>

            {/* Foto de Perfil */}
            <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#edf0f2] pb-7 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accName}
                      className="h-16 w-16 rounded-full border-2 border-[#111827] object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111827] text-lg font-extrabold text-white">
                      {getInitials(startupName || accName || "StartIn")}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Alterar foto de perfil"
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#111827] text-[#FEC908] shadow transition hover:bg-black"
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
                  <h3 className="text-sm font-extrabold text-[#111827]">Foto de perfil</h3>
                  <p className="mt-1 text-xs text-[#768692]">
                    Exibida na barra superior, no menu e no perfil público da sua startup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-bold text-[#111827] transition hover:bg-gray-100 sm:self-auto"
              >
                <Camera size={14} />
                {avatarUrl ? "Alterar foto" : "Adicionar foto"}
              </button>
            </div>

            {/* Informações da Conta e da Startup (Único local editável de Nome, Telefone e CNPJ) */}
            <h2 className="text-base font-extrabold text-[#111827]">
              Dados Cadastrais da Conta e da Startup
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Nome da startup" value={startupName} onChange={setStartupName} />
              <Field
                label="CNPJ"
                placeholder="AA.AAA.AAA/AAAA-DV"
                value={accCnpj}
                onChange={setAccCnpj}
              />
              <Field
                label="Telefone / WhatsApp"
                placeholder="(00) 00000-0000"
                value={accPhone}
                onChange={setAccPhone}
              />
              <Field label="E-mail de acesso" value={accEmail} onChange={setAccEmail} />
              <Field label="Nome do responsável" value={accName} onChange={setAccName} />
              <Field
                label="Site"
                placeholder="https://suastartup.com.br"
                value={startupWebsite}
                onChange={setStartupWebsite}
              />

              <div>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#203754]">
                    Área principal de tecnologia
                  </span>
                  {selectedMainArea === "Outro" ? (
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Digite a área principal (ex: Biotech, Legaltech, Aeroespacial)..."
                        value={customMainArea}
                        onChange={(e) => setCustomMainArea(e.target.value)}
                        className="h-11 w-full rounded-lg border border-[#111827] bg-white pl-3 pr-24 text-xs font-semibold text-[#111827] outline-none focus:border-[#111827] placeholder:font-normal placeholder:text-[#98a2ab]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMainArea(MAIN_TECH_AREAS[0]);
                          setCustomMainArea("");
                        }}
                        className="absolute right-1.5 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-[#111827] transition hover:bg-gray-200"
                        title="Voltar para a lista de áreas"
                      >
                        Ver lista <ChevronDown size={12} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedMainArea}
                      onChange={(e) => setSelectedMainArea(e.target.value)}
                      className="h-11 w-full rounded-lg border border-[#d9e1e7] bg-white px-3 text-xs font-semibold text-[#111827] outline-none focus:border-[#111827]"
                    >
                      {MAIN_TECH_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              </div>

              <Field
                label="Localização"
                placeholder="Recife, PE"
                value={operationRegion}
                onChange={setOperationRegion}
              />

              {/* Problema que resolve com IA (sem descrição curta!) */}
              <div className="md:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#203754]">
                    Problema que resolve (estruturado para o matchmaking da IA)
                  </span>
                  <button
                    type="button"
                    disabled={enhancingProblem}
                    onClick={handleEnhanceProblemInAccount}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-[11px] font-extrabold text-[#FEC908] transition hover:bg-black disabled:opacity-60"
                  >
                    <Sparkles size={12} />
                    {enhancingProblem ? "Estruturando..." : "Melhorar texto com IA"}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={startupProblem}
                  onChange={(e) => setStartupProblem(e.target.value)}
                  placeholder="Descreva o problema central e clique em 'Melhorar texto com IA'."
                  className="w-full rounded-xl border border-[#d9e1e7] bg-[#fcfdfe] p-3.5 text-xs leading-6 text-[#111827] outline-none focus:border-[#111827]"
                />
              </div>
            </div>

            {/* Estágio Atual da Startup (Validação vs Tração) */}
            <div className="mt-9 border-t border-[#edf0f2] pt-8">
              <h2 className="text-base font-extrabold text-[#111827]">
                Momento / Estágio Atual da Startup
              </h2>
              <p className="mt-1 text-xs text-[#7d8a95]">
                Startups em <strong>Validação</strong> acessam POCs e Primeira Compra; startups em{" "}
                <strong>Tração</strong> acessam Compras diretas (sem POCs), mediante comprovação TRL + Atestado PDF.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["Validação", "Tração"] as const).map((stg) => {
                  const active = currentStage === stg;
                  return (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => handleStageSwitch(stg)}
                      className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition ${
                        active
                          ? "border-[#111827] bg-[#111827] text-white"
                          : "border-[#e2e8f0] bg-white text-[#111827] hover:border-[#9fb0bf]"
                      }`}
                    >
                      <div>
                        <span className="block text-sm font-extrabold">{stg}</span>
                        <span
                          className={`mt-1 block text-[11px] ${
                            active ? "text-gray-300" : "text-[#64748b]"
                          }`}
                        >
                          {stg === "Validação"
                            ? "Exibe POCs, Primeira Compra, Editais e Eventos"
                            : "Exibe Compras Corporativas (sem POCs), Editais e Eventos"}
                        </span>
                      </div>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          active
                            ? "bg-[#FEC908] text-[#111827]"
                            : "border border-gray-300 bg-white"
                        }`}
                      >
                        {active && <Check size={12} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {currentStage === "Tração" && tractionAttested && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#166d48]">
                    <CheckCircle2 size={16} />
                    <span>
                      Tração atestada via IA (TRL {trlScore}/9) —{" "}
                      {tractionAttestationInfo || "Atestado de Capacidade Técnica validado."}
                    </span>
                  </div>
                </div>
              )}

              {currentStage === "Tração" && !tractionAttested && (
                <div className="mt-4 space-y-4 rounded-xl border border-[#dbe3ea] bg-[#f8fafc] p-4">
                  <p className="text-xs font-extrabold text-[#111827]">
                    Comprovação de Tração — Responda à Escala TRL da NASA e anexe seu Atestado Técnico (PDF)
                  </p>
                  <div className="space-y-2.5">
                    {NASA_TRL_QUESTIONS.map((q) => {
                      const ans = trlAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="flex flex-col justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white p-3 sm:flex-row sm:items-center"
                        >
                          <span className="text-xs text-[#334155]">
                            <strong>{q.badge}:</strong> {q.question}
                          </span>
                          <div className="flex shrink-0 gap-1.5">
                            {(["SIM", "NAO"] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setTrlAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                }
                                className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
                                  ans === opt
                                    ? opt === "SIM"
                                      ? "bg-[#111827] text-[#FEC908]"
                                      : "bg-red-600 text-white"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {opt === "SIM" ? "Sim" : "Não"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {allTrlAnswered && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cbd5e1] bg-white p-3.5">
                      <span className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                        <FileText size={15} /> Anexe o PDF do Atestado de Capacidade Técnica
                        {pdfFileName ? ` (${pdfFileName})` : ""}
                      </span>
                      <div>
                        <input
                          ref={pdfInputRef}
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleTractionPdfUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={verifyingPdf}
                          onClick={() => pdfInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3.5 py-2 text-xs font-extrabold text-[#FEC908]"
                        >
                          <Upload size={13} />
                          {verifyingPdf ? "Atestando PDF com IA..." : "Enviar PDF"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preferências de Matching da IA */}
            <div className="mt-9 border-t border-[#edf0f2] pt-8">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-extrabold text-[#111827]">
                    Preferências de Matching da IA
                  </h2>
                  <p className="mt-1 text-xs text-[#7d8a95]">
                    Defina as áreas de interesse e os tipos de oportunidade compatíveis com seu estágio.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#111827]">
                  {selectedAreas.length} áreas · Estágio {currentStage}
                </span>
              </div>

              <div className="mt-6 grid gap-7 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-[#50697f]">
                    Áreas e tags de interesse (clique para ativar/desativar)
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allAvailableAreas.map((area) => {
                      const isSelected = selectedAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                            isSelected
                              ? "bg-[#111827] text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={customAreaInput}
                      onChange={(e) => setCustomAreaInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), handleAddCustomArea())
                      }
                      placeholder="Adicionar nova tag (ex: Biotecnologia)..."
                      className="h-9 flex-1 rounded-lg border border-[#d9e1e7] bg-[#f9fbfc] px-3 text-xs outline-none focus:border-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomArea}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#111827] px-3 text-xs font-bold text-white transition hover:bg-black"
                    >
                      <Plus size={13} /> Adicionar
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#50697f]">
                    Tipos de oportunidade habilitados no estágio {currentStage}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allowedOppOptions.map((x) => {
                      const active = selectedOppTypes.includes(x);
                      return (
                        <button
                          key={x}
                          type="button"
                          onClick={() => toggleOppType(x)}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                            active
                              ? "bg-[#111827] text-white shadow-sm"
                              : "bg-[#f3f5f6] text-[#557086] hover:bg-[#e5ebef]"
                          }`}
                        >
                          {x}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] leading-4 text-[#83919c]">
                    A aba <strong>Para você</strong> filtra automaticamente as oportunidades conforme o estágio ({currentStage}) da sua startup.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-[#edf0f2] pt-6">
                <div>
                  <p className="text-sm font-bold text-[#284a67]">Receber recomendações da IA</p>
                  <p className="mt-1 text-xs text-[#82909a]">
                    Use seu perfil para personalizar novas oportunidades automaticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiveRecs(!receiveRecs)}
                  className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                    receiveRecs ? "bg-[#111827]" : "bg-[#b8c4cc]"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      receiveRecs ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <PrimaryButton onClick={handleSaveAccount}>
                Salvar dados da conta e da startup <Check size={15} />
              </PrimaryButton>
            </div>

            <div className="mt-9 border-t border-[#edf0f2] pt-7">
              <h2 className="text-base font-extrabold text-[#111827]">Segurança</h2>
              <p className="mt-4 mb-3 text-xs text-[#768692]">Senha de acesso · ••••••••••••</p>
              <PrimaryButton secondary onClick={() => go("reset")}>
                Alterar senha
              </PrimaryButton>
            </div>

            <div className="mt-8 border-t border-[#edf0f2] pt-7">
              <h2 className="text-base font-extrabold text-[#111827]">Excluir conta</h2>
              <p className="mt-3 text-xs text-[#768692]">
                Essa ação remove permanentemente os dados desta conta e do perfil associado.
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
                        : "Permitir que outras organizações encontrem seu perfil na StartIn."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[11px] font-bold ${
                        active ? "text-[#111827]" : "text-[#8e9aa4]"
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
                        active ? "bg-[#111827]" : "bg-[#b8c4cc]"
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
              className="mt-4 text-xs font-bold text-[#111827] hover:underline"
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

            <h2 className="text-base font-extrabold text-[#123b62]">
              Modalidades compatíveis com seu estágio ({currentStage})
            </h2>
            <p className="mt-1 text-xs text-[#7d8a95]">
              Escolha quais modalidades a IA deve priorizar no cálculo de aderência.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(currentStage === "Tração"
                ? [
                    { label: "Compra Corporativa", value: "Compra" },
                    { label: "Editais", value: "Editais" },
                    { label: "Eventos", value: "Eventos" },
                    { label: "Todas de Tração (Compra, Editais e Eventos)", value: "Compra, Editais, Eventos" },
                  ]
                : [
                    { label: "POC", value: "POC" },
                    { label: "Primeira Compra", value: "Primeira Compra" },
                    { label: "Editais", value: "Editais" },
                    { label: "Eventos", value: "Eventos" },
                    {
                      label: "Todas de Validação (POC, Primeira Compra, Editais e Eventos)",
                      value: "POC, Primeira Compra, Editais, Eventos",
                    },
                  ]
              ).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPrefType(opt.value)}
                  className={`rounded-lg px-5 py-3 text-xs font-bold transition ${
                    prefType.toLowerCase() === opt.value.toLowerCase()
                      ? "bg-[#111827] text-white shadow-sm"
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
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-xs font-semibold text-[#587086]">
                Área principal
                <select
                  value={selectedMainArea}
                  onChange={(e) => setSelectedMainArea(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#111827]"
                >
                  {MAIN_TECH_AREAS.map((opt) => (
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
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#111827]"
                >
                  {Array.from(new Set([technologies, ...TECH_OPTIONS]))
                    .filter(Boolean)
                    .map((opt) => (
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
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#111827]"
                >
                  {Array.from(new Set([operationRegion, ...LOCATION_OPTIONS]))
                    .filter(Boolean)
                    .map((opt) => (
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
                  onChange={(e) =>
                    handleStageSwitch(e.target.value === "Tração" ? "Tração" : "Validação")
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#111827]"
                >
                  {STAGE_OPTIONS.map((opt) => (
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
                  className="mt-2 h-10 w-full rounded-lg border border-[#dce3e8] bg-[#f3f6f8] px-3 text-xs font-medium text-[#244766] outline-none focus:border-[#111827]"
                >
                  {Array.from(new Set([investmentNeed, ...INVESTMENT_OPTIONS]))
                    .filter(Boolean)
                    .map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="mt-7 flex flex-col justify-between gap-4 border-t border-[#edf0f2] pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-[#84919a]">
                Para comprovar o estágio Tração (TRL + PDF), utilize a seção Conta e acesso.
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
