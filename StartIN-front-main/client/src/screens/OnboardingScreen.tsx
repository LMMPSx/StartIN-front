import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Logo,
  Sparkles,
  Upload,
} from "@/icons";
import { Field, PrimaryButton } from "@/components/startin/CommonUI";
import {
  api,
  getSession,
  saveSession,
  type CompanyProfileData,
  type StartupProfileData,
} from "@/lib/api";
import type { AccountType, Screen } from "@/types/startin";

export const MAIN_TECH_AREAS = [
  "Inteligência Artificial & Dados",
  "Healthtech / Saúde Digital",
  "Fintech / Serviços Financeiros",
  "SaaS B2B & Cloud",
  "Agtech / Agronegócio",
  "Edtech / Educação",
  "Indústria 4.0 & IoT",
  "Cibersegurança",
  "Varejo & E-commerce",
  "CleanTech & Energia",
  "GovTech & Cidades Inteligentes",
  "Logística & Mobilidade",
  "Outro",
] as const;

export const NASA_TRL_QUESTIONS = [
  {
    id: "trl_1_3",
    level: 3,
    badge: "TRL 1–3",
    title: "Concepção e Prova de Conceito Experimental",
    question:
      "Os princípios tecnológicos da solução já foram formulados e validados experimentalmente em prova de conceito?",
  },
  {
    id: "trl_4_5",
    level: 5,
    badge: "TRL 4–5",
    title: "Integração de Componentes em Ambiente Relevante",
    question:
      "Os módulos principais do software/hardware já estão integrados e testados com dados reais ou simulados de mercado?",
  },
  {
    id: "trl_6",
    level: 6,
    badge: "TRL 6",
    title: "MVP / Protótipo Operacional Demonstrado",
    question:
      "A startup já possui MVP completo e funcional demonstrado em ambiente operacional real?",
  },
  {
    id: "trl_7_8",
    level: 8,
    badge: "TRL 7–8",
    title: "Sistema Completo Homologado com Clientes",
    question:
      "O produto completo já foi implantado, qualificado e homologado em produção junto a clientes ou organizações parceiras?",
  },
  {
    id: "trl_9",
    level: 9,
    badge: "TRL 9",
    title: "Operação Comercial Comprovada",
    question:
      "A solução opera comercialmente de forma contínua, com entregas comprováveis por Atestado de Capacidade Técnica?",
  },
] as const;

export function calculateTrlFromAnswers(answers: Record<string, "SIM" | "NAO">): number {
  const yesCount = Object.values(answers).filter((v) => v === "SIM").length;
  if (yesCount === 0) return 1;
  if (yesCount === 1) return 3;
  if (yesCount === 2) return 5;
  if (yesCount === 3) return 6;
  if (yesCount === 4) return 8;
  return 9;
}

export function Onboarding({
  go,
  startupId,
  companyId,
  onProfileUpdated,
  onCompanyUpdated,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  companyId?: number;
  onProfileUpdated: (p: StartupProfileData) => void;
  onCompanyUpdated?: (c: CompanyProfileData) => void;
}) {
  const session = getSession();
  const [accountType] = useState<AccountType>(
    session?.accountType === "COMPANY" ? "COMPANY" : "STARTUP"
  );
  const [step, setStep] = useState(0);
  const [companyStep, setCompanyStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Etapa 01 — Área principal com opção "Outro"
  const [selectedMainArea, setSelectedMainArea] = useState<string>(MAIN_TECH_AREAS[0]);
  const [customMainArea, setCustomMainArea] = useState<string>("");

  // Etapa 02 — Melhoria obrigatória com IA
  const [enhancingAi, setEnhancingAi] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [aiExtractedTags, setAiExtractedTags] = useState<string[]>([]);
  const [aiError, setAiError] = useState("");

  // Etapa 03 — Momento (Validação vs Tração + TRL NASA + PDF Atestado)
  const [trlAnswers, setTrlAnswers] = useState<Record<string, "SIM" | "NAO">>({});
  const [verifyingPdf, setVerifyingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfHighlights, setPdfHighlights] = useState<string[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<StartupProfileData>({
    name: session?.accountType === "STARTUP" && session?.name ? session.name : "Nexa Health",
    phone: session?.phone || "",
    mainArea: MAIN_TECH_AREAS[0],
    description: "",
    location: "",
    cnpj: session?.cnpj || "",
    website: "",
    foundedYear: "",
    problem: "",
    howItWorks: "",
    differentiator: "",
    impact: "",
    technologies: "",
    businessModel: "",
    targetAudience: "",
    mainSector: "",
    operationRegion: "",
    state: "",
    customerProfile: "",
    marketSize: "",
    competitors: "",
    mainChannel: "",
    currentStage: "Validação",
    trlScore: 4,
    tractionAttested: false,
    tractionAttestationInfo: "",
    tractionCustomers: "",
    productMaturity: "",
    teamSize: "",
    annualRevenue: "",
    recentGrowth: "",
    investmentRaised: "",
    mainObjective: "",
    investmentNeed: "",
    executionDeadline: "",
    resourceUse: "",
    twelveMonthGoal: "",
    strategicPriority: "",
    desiredPartners: "",
    areasOfInterest: "",
    opportunityTypes: "POC, Primeira Compra, Editais, Eventos",
    receiveAiRecommendations: true,
  });

  const [companyForm, setCompanyForm] = useState<CompanyProfileData>({
    id: companyId || session?.companyId,
    userId: session?.userId,
    name: session?.accountType === "COMPANY" && session?.name ? session.name : "Empresa Alpha",
    phone: session?.phone || "",
    type: "Empresa",
    sector: "Saúde / Operações Corporativas",
    location: "Brasil",
    cnpj: session?.cnpj || "",
    website: "",
    description: "",
    demands: "",
    tags: "IA, SaaS, B2B, Dados",
    preferredStage: "Validação / Tração",
    operationMode: "POC + Compra",
  });

  const setField = (key: keyof StartupProfileData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setCompanyField = (key: keyof CompanyProfileData) => (val: string) =>
    setCompanyForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    const idToLoad = startupId || session?.startupProfileId;
    const loader = idToLoad ? api.getProfile(idToLoad) : api.getDefaultProfile();
    loader
      .then((p) => {
        if (p) {
          const normalizedStage = (p.currentStage || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes("tracao")
            ? "Tração"
            : "Validação";

          const areaVal = p.mainArea || MAIN_TECH_AREAS[0];
          const isKnownArea = (MAIN_TECH_AREAS as readonly string[]).includes(areaVal) && areaVal !== "Outro";
          if (isKnownArea) {
            setSelectedMainArea(areaVal);
            setCustomMainArea("");
          } else if (areaVal) {
            setSelectedMainArea("Outro");
            setCustomMainArea(areaVal);
          }

          if (p.problem && p.problem.includes("Problema Central")) {
            setAiEnhanced(true);
          }

          if (p.tractionAttested) {
            setTrlAnswers({
              trl_1_3: "SIM",
              trl_4_5: "SIM",
              trl_6: "SIM",
              trl_7_8: "SIM",
              trl_9: "SIM",
            });
          }

          setForm((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(p).map(([k, v]) => [
                k,
                typeof v === "boolean" || typeof v === "number" ? v : v ?? "",
              ])
            ),
            name: p.name || session?.name || prev.name,
            cnpj: p.cnpj || session?.cnpj || prev.cnpj,
            phone: p.phone || session?.phone || prev.phone,
            description: "",
            currentStage: normalizedStage,
            trlScore: p.trlScore ?? (normalizedStage === "Tração" ? 8 : 4),
            tractionAttested: Boolean(p.tractionAttested),
            tractionAttestationInfo: p.tractionAttestationInfo || "",
            opportunityTypes:
              normalizedStage === "Tração"
                ? "Compra, Editais, Eventos"
                : "POC, Primeira Compra, Editais, Eventos",
            receiveAiRecommendations: p.receiveAiRecommendations ?? true,
          }));
        }
      })
      .catch(() => {});

    const compIdToLoad = companyId || session?.companyId;
    const compLoader = compIdToLoad
      ? api.getCompany(compIdToLoad)
      : session?.userId
      ? api.getCompanyByUser(session.userId)
      : api.getDefaultCompany();
    compLoader
      .then((c) => {
        if (c) {
          setCompanyForm((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ""])),
            name: c.name || session?.name || prev.name,
            cnpj: c.cnpj || session?.cnpj || prev.cnpj,
            phone: c.phone || session?.phone || prev.phone,
            description: "",
          }));
        }
      })
      .catch(() => {});
  }, [startupId, companyId]);

  const effectiveMainArea =
    selectedMainArea === "Outro"
      ? customMainArea.trim() || "Tecnologia & Inovação"
      : selectedMainArea;

  // Startup agora tem exatamente 3 etapas: 01 Identidade, 02 Solução, 03 Momento
  const labels = ["Identidade", "Solução", "Momento"];
  const companyLabels = [
    "Identidade da Empresa",
    "Demandas (POC / Compra)",
    "Perfil de Startup",
    "Concluído",
  ];

  const handleEnhanceProblemWithAI = async () => {
    setAiError("");
    if (!form.problem || form.problem.trim().length < 10) {
      setAiError("Escreva ao menos uma breve explicação do problema que sua startup resolve antes de melhorar com a IA.");
      return;
    }
    setEnhancingAi(true);
    try {
      const res = await api.enhanceProblemAI({
        text: form.problem,
        mainArea: effectiveMainArea,
        startupName: form.name,
      });
      const tags = Array.isArray(res.tags) && res.tags.length > 0
        ? res.tags
        : (res.technologies || effectiveMainArea)
            .split(/[,•]/)
            .map((t) => t.trim())
            .filter(Boolean);

      setAiExtractedTags(tags);
      setForm((prev) => ({
        ...prev,
        mainArea: effectiveMainArea,
        mainSector: effectiveMainArea,
        description: "",
        problem: res.enhancedText || prev.problem,
        technologies: res.technologies || tags.join(", "),
        areasOfInterest: res.technologies || tags.join(", "),
        businessModel: res.businessModel || prev.businessModel || "SaaS B2B",
        howItWorks: res.howItWorks || prev.howItWorks,
        differentiator: res.differentiator || prev.differentiator,
        impact: res.impact || prev.impact,
        targetAudience: res.targetAudience || prev.targetAudience,
      }));
      setAiEnhanced(true);
    } catch (err: any) {
      setAiError(err.message || "Não foi possível estruturar o texto com a IA.");
    } finally {
      setEnhancingAi(false);
    }
  };

  const handleSelectStage = (stage: "Validação" | "Tração") => {
    if (stage === "Validação") {
      setForm((prev) => ({
        ...prev,
        currentStage: "Validação",
        opportunityTypes: "POC, Primeira Compra, Editais, Eventos",
        trlScore: 4,
      }));
    } else {
      const computed = calculateTrlFromAnswers(trlAnswers);
      setForm((prev) => ({
        ...prev,
        currentStage: "Tração",
        opportunityTypes: "Compra, Editais, Eventos",
        trlScore: prev.tractionAttested ? Math.max(7, prev.trlScore || computed) : computed,
      }));
    }
  };

  const allTrlAnswered = Object.keys(trlAnswers).length === NASA_TRL_QUESTIONS.length;
  const computedTrlScore = calculateTrlFromAnswers(trlAnswers);

  const handleTractionPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfError("");
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
          startupName: form.name,
          mainArea: effectiveMainArea,
        });

        if (!res.attested) {
          setPdfError(
            res.attestationSummary ||
              "O documento enviado não pôde comprovar tração suficiente. Verifique o PDF ou selecione o estágio Validação."
          );
          setForm((prev) => ({
            ...prev,
            tractionAttested: false,
            tractionAttestationInfo: res.attestationSummary || "",
          }));
          return;
        }

        setPdfHighlights(res.extractedHighlights || []);
        setForm((prev) => ({
          ...prev,
          currentStage: "Tração",
          opportunityTypes: "Compra, Editais, Eventos",
          trlScore: res.trlLevel || Math.max(7, computedTrlScore),
          tractionAttested: true,
          tractionAttestationInfo: res.attestationSummary,
          productMaturity: res.productMaturity || `TRL ${res.trlLevel || 8}/9 validado`,
          tractionCustomers: res.tractionCustomers || "Capacidade técnica atestada",
          annualRevenue: res.annualRevenue || prev.annualRevenue,
          recentGrowth: res.recentGrowth || prev.recentGrowth,
        }));
      } catch (err: any) {
        setPdfError(err.message || "Falha ao analisar o PDF com a IA.");
      } finally {
        setVerifyingPdf(false);
      }
    };
    reader.onerror = () => {
      setPdfError("Não foi possível ler o arquivo PDF selecionado.");
      setVerifyingPdf(false);
    };
    reader.readAsDataURL(file);
  };

  const canAdvanceStartupStep = () => {
    if (step === 0) {
      if (selectedMainArea === "Outro" && !customMainArea.trim()) return false;
      return true;
    }
    if (step === 1) {
      return aiEnhanced && form.problem.trim().length >= 15;
    }
    if (step === 2) {
      if (form.currentStage === "Tração") {
        return Boolean(form.tractionAttested);
      }
      return true;
    }
    return true;
  };

  const handleNextStartupStep = async () => {
    if (!canAdvanceStartupStep()) return;

    const targetId = form.id || startupId || session?.startupProfileId || 1;
    const payloadToSave: Partial<StartupProfileData> = {
      ...form,
      name: form.name.trim() || session?.name || "Nexa Health",
      cnpj: form.cnpj || session?.cnpj || "",
      phone: form.phone || session?.phone || "",
      mainArea: effectiveMainArea,
      mainSector: effectiveMainArea,
      operationRegion: form.location || form.operationRegion,
      description: "",
      areasOfInterest: form.areasOfInterest || form.technologies || effectiveMainArea,
      opportunityTypes:
        form.currentStage === "Tração"
          ? "Compra, Editais, Eventos"
          : "POC, Primeira Compra, Editais, Eventos",
    };

    if (step < 2) {
      setStep((s) => Math.min(3, s + 1));
      api.updateProfile(targetId, payloadToSave).catch(() => {});
      return;
    }

    setSaving(true);
    try {
      if (session?.userId) {
        await api.updateUser(session.userId, { accountType: "STARTUP" }).catch(() => {});
      }
      const updated = await api.updateProfile(targetId, payloadToSave);
      onProfileUpdated(updated);
      if (session) {
        saveSession({
          ...session,
          accountType: "STARTUP",
          startupProfileId: updated.id || targetId,
          name: updated.name || session.name,
        });
      }
      localStorage.setItem("startin-auth", "1");
      await api.recalculateMatches(updated.id || targetId, false).catch(() => {});
    } catch {
      localStorage.setItem("startin-auth", "1");
      // ignora erro de rede local se ocorrer
    } finally {
      setSaving(false);
      setStep(3);
    }
  };

  const handleNextCompanyStep = async () => {
    if (companyStep < 2) {
      setCompanyStep((s) => s + 1);
      return;
    }

    setSaving(true);
    try {
      if (session?.userId) {
        await api.updateUser(session.userId, { accountType: "COMPANY" }).catch(() => {});
      }
      const payload: CompanyProfileData = {
        ...companyForm,
        description: "",
        userId: session?.userId,
        name: companyForm.name.trim() || session?.name || "Empresa Alpha",
        cnpj: companyForm.cnpj || session?.cnpj || "",
        phone: companyForm.phone || session?.phone || "",
      };
      const saved = companyForm.id
        ? await api.updateCompany(companyForm.id, payload)
        : await api.createCompany(payload);
      setCompanyForm(saved);
      onCompanyUpdated?.(saved);
      if (session) {
        saveSession({
          ...session,
          accountType: "COMPANY",
          companyId: saved.id,
          name: saved.name || session.name,
        });
      } else {
        saveSession({
          token: "company-token",
          userId: saved.userId || 1,
          companyId: saved.id,
          accountType: "COMPANY",
          email: "empresa@startin.com",
          name: saved.name,
        });
      }
      localStorage.setItem("startin-auth", "1");
    } catch {
      localStorage.setItem("startin-auth", "1");
      // ignora erro de rede local
    } finally {
      setSaving(false);
      setCompanyStep(3);
    }
  };

  if (accountType === "STARTUP" && step === 3) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6 md:p-10">
        <div className="mx-auto max-w-[1180px]">
          <Logo />
          <div className="mx-auto mt-20 max-w-[650px] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]">
              <Check size={30} strokeWidth={3} />
            </div>
            <h1 className="mt-7 text-[34px] font-extrabold tracking-[-.05em] text-[#111827]">
              Sua startup está pronta!
            </h1>
            <p className="mt-3 text-sm text-[#6d7781]">
              Seu perfil no estágio <strong>{form.currentStage}</strong> foi estruturado pela IA. Acesse sua Home para acompanhar oportunidades e matches sob medida.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
              {["Identidade", "Solução (Estruturada IA)", "Momento & Maturidade"].map((x, i) => (
                <div key={x} className="rounded-xl border border-[#dfe5ea] bg-white p-4 text-left">
                  <div className="text-xs font-bold text-[#111827]">0{i + 1}</div>
                  <div className="mt-3 text-xs font-semibold text-[#263f5d]">{x}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#29815d]">
                    <Check size={11} /> Concluído
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton secondary onClick={() => setStep(2)}>
                <ArrowLeft size={15} /> Voltar e revisar etapas
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  localStorage.setItem("startin-auth", "1");
                  go("dashboard");
                }}
              >
                Ir para a Home <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accountType === "COMPANY" && companyStep === 3) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6 md:p-10">
        <div className="mx-auto max-w-[1180px]">
          <Logo />
          <div className="mx-auto mt-20 max-w-[650px] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]">
              <Check size={30} strokeWidth={3} />
            </div>
            <h1 className="mt-7 text-[34px] font-extrabold tracking-[-.05em] text-[#111827]">
              Sua empresa está pronta!
            </h1>
            <p className="mt-3 text-sm text-[#6d7781]">
              Seu perfil corporativo foi salvo. Acesse sua Home para acompanhar POCs, Compras e startups com match calculado pela IA.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
              {["Identidade da Empresa", "Demandas de POC e Compra", "Perfil de Startup Buscado"].map(
                (x, i) => (
                  <div key={x} className="rounded-xl border border-[#dfe5ea] bg-white p-4 text-left">
                    <div className="text-xs font-bold text-[#111827]">0{i + 1}</div>
                    <div className="mt-3 text-xs font-semibold text-[#263f5d]">{x}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#29815d]">
                      <Check size={11} /> Concluído
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton secondary onClick={() => setCompanyStep(2)}>
                <ArrowLeft size={15} /> Voltar e revisar
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  localStorage.setItem("startin-auth", "1");
                  go("dashboard");
                }}
              >
                Ir para a Home <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conteúdo das etapas para Empresa
  if (accountType === "COMPANY") {
    const companyStep0 = (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2 rounded-xl border border-[#e3e8ee] bg-[#f8fafc] px-4 py-3 text-xs text-[#4a5d6e]">
          Empresa cadastrada: <strong className="text-[#111827]">{companyForm.name}</strong>
          {companyForm.cnpj ? ` · CNPJ: ${companyForm.cnpj}` : ""}
          {" · "}(dados cadastrais editáveis em <strong>Minha empresa</strong>).
        </div>
        <Field
          label="Setor de atuação"
          placeholder="Saúde, Finanças, Indústria, Varejo..."
          value={companyForm.sector || ""}
          onChange={setCompanyField("sector")}
        />
        <Field
          label="Localização"
          placeholder="Recife, PE · Brasil"
          value={companyForm.location || ""}
          onChange={setCompanyField("location")}
        />
        <Field
          label="Site corporativo"
          placeholder="https://"
          value={companyForm.website || ""}
          onChange={setCompanyField("website")}
        />
        <div>
          <span className="mb-2 block text-xs font-semibold text-[#203754]">
            Tipo de organização
          </span>
          <div className="flex flex-wrap gap-2">
            {["Empresa", "Organização", "Instituição"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCompanyField("type")(t)}
                className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                  companyForm.type === t
                    ? "bg-[#111827] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    const companyStep1 = (
      <div className="grid gap-5">
        <div>
          <span className="mb-2 block text-xs font-semibold text-[#203754]">
            Modalidades de oportunidades que sua empresa deseja lançar
          </span>
          <div className="flex flex-wrap gap-2">
            {["POC", "Primeira Compra", "Compra", "POC + Compra"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCompanyField("operationMode")(mode)}
                className={`rounded-lg px-5 py-3 text-xs font-bold transition ${
                  companyForm.operationMode === mode
                    ? "bg-[#111827] text-[#FEC908]"
                    : "bg-[#f3f6f8] text-[#486680]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-[#203754]">
            Principais desafios e demandas de inovação aberta (POC / Compra)
          </span>
          <textarea
            rows={5}
            placeholder="Descreva os problemas operacionais, desafios tecnológicos ou soluções que sua empresa busca contratar ou testar."
            value={companyForm.demands || ""}
            onChange={(e) => setCompanyField("demands")(e.target.value)}
            className="w-full rounded-lg border border-[#d9e1e7] bg-white p-3.5 text-xs leading-5 text-[#111827] outline-none focus:border-[#111827]"
          />
        </label>
      </div>
    );

    const companyStep2 = (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field
            label="Tecnologias e áreas buscadas nas startups"
            placeholder="IA, SaaS, B2B, Dados, Automação, Healthtech, Fintech..."
            value={companyForm.tags || ""}
            onChange={setCompanyField("tags")}
          />
        </div>
        <div className="md:col-span-2">
          <Field
            label="Estágio de maturidade desejado para as startups"
            placeholder="Validação ou Tração"
            value={companyForm.preferredStage || ""}
            onChange={setCompanyField("preferredStage")}
          />
        </div>
      </div>
    );

    const compContents = [companyStep0, companyStep1, companyStep2];
    const compSubtitles = [
      "Complete o contexto operacional da sua empresa para encontrar startups compatíveis.",
      "Defina quais modalidades de contratação aberta sua empresa busca e os desafios atuais.",
      "Esses critérios serão usados pela IA para calcular o match com todas as startups cadastradas.",
    ];

    return (
      <div className="min-h-screen bg-[#f7f9fb] px-5 py-7 md:px-10">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => {
                if (companyStep > 0) {
                  setCompanyStep((s) => s - 1);
                } else {
                  go(localStorage.getItem("startin-auth") ? "dashboard" : "login");
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#6d7b87] transition hover:bg-white hover:text-[#111827]"
            >
              <ArrowLeft size={14} />{" "}
              {companyStep > 0
                ? `Voltar para 0${companyStep} — ${companyLabels[companyStep - 1]}`
                : "Voltar para o início"}
            </button>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[225px_1fr]">
            <div>
              <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-.06em] text-[#111827]">
                Encontre startups que combinam{" "}
                <span className="text-[#111827]">com sua empresa.</span>
              </h1>
              <p className="mt-4 text-sm leading-5 text-[#78828d]">
                Lance oportunidades de POC, Primeira Compra ou Compra e acompanhe os matches calculados pela IA.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6d7781]">Cadastro Corporativo · Empresa</p>
              <p className="mt-1 text-xs text-[#9aa2aa]">{compSubtitles[companyStep]}</p>
              <div className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4">
                {companyLabels.map((x, i) => (
                  <button
                    key={x}
                    type="button"
                    disabled={i > 2}
                    onClick={() => i <= 2 && setCompanyStep(i)}
                    className={`border-t-2 pt-2 text-left text-[10px] font-semibold transition ${
                      i <= companyStep
                        ? "border-[#FEC908] text-[#111827]"
                        : "border-[#dce2e7] text-[#9ca5ad] hover:text-[#5d6c79]"
                    }`}
                  >
                    0{i + 1} {x}
                  </button>
                ))}
              </div>
              <div className="mt-10 rounded-2xl border border-[#e0e5e9] bg-white p-6 md:p-8">
                <h2 className="text-[22px] font-extrabold tracking-[-.04em] text-[#111827]">
                  0{companyStep + 1} — {companyLabels[companyStep]}
                </h2>
                <p className="mt-2 text-sm text-[#77818c]">{compSubtitles[companyStep]}</p>
                <div className="mt-7">{compContents[companyStep]}</div>
                <div className="mt-8 flex items-center justify-between gap-3">
                  <PrimaryButton
                    secondary
                    onClick={() => {
                      if (companyStep > 0) {
                        setCompanyStep((s) => s - 1);
                      } else {
                        go(localStorage.getItem("startin-auth") ? "dashboard" : "login");
                      }
                    }}
                  >
                    <ArrowLeft size={15} /> {companyStep > 0 ? "Voltar etapa" : "Voltar"}
                  </PrimaryButton>
                  <PrimaryButton disabled={saving} onClick={handleNextCompanyStep}>
                    {companyStep === 2 ? "Finalizar perfil da empresa" : "Continuar"}{" "}
                    <ArrowRight size={16} />
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ETAPA 01 — IDENTIDADE (STARTUP)
  // ==========================================================
  const stepIdentidade = (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2 rounded-xl border border-[#e3e8ee] bg-[#f8fafc] px-4 py-3 text-xs text-[#4a5d6e]">
        Dados vinculados do cadastro inicial:{" "}
        <strong className="text-[#111827]">{form.name}</strong>
        {form.cnpj ? ` · CNPJ: ${form.cnpj}` : ""}
        {form.phone ? ` · Tel: ${form.phone}` : ""} — editáveis a qualquer momento em{" "}
        <strong className="text-[#111827]">Conta e acesso</strong>.
      </div>

      <div className="md:col-span-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-[#203754]">
            Área principal de tecnologia
          </span>
          {selectedMainArea === "Outro" ? (
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Digite a área principal de tecnologia (ex: Biotech, Legaltech, Aeroespacial)..."
                value={customMainArea}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomMainArea(val);
                  setForm((prev) => ({ ...prev, mainArea: val, mainSector: val }));
                }}
                className="h-11 w-full rounded-lg border border-[#111827] bg-white pl-3.5 pr-28 text-xs font-semibold text-[#111827] outline-none transition focus:border-[#111827] placeholder:font-normal placeholder:text-[#98a2ab]"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedMainArea(MAIN_TECH_AREAS[0]);
                  setCustomMainArea("");
                  setForm((prev) => ({
                    ...prev,
                    mainArea: MAIN_TECH_AREAS[0],
                    mainSector: MAIN_TECH_AREAS[0],
                  }));
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
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMainArea(val);
                if (val === "Outro") {
                  setForm((prev) => ({
                    ...prev,
                    mainArea: customMainArea,
                    mainSector: customMainArea,
                  }));
                } else {
                  setForm((prev) => ({ ...prev, mainArea: val, mainSector: val }));
                }
              }}
              className="h-11 w-full rounded-lg border border-[#d9e1e7] bg-white px-3.5 text-xs font-semibold text-[#111827] outline-none transition focus:border-[#111827]"
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
        value={form.location}
        onChange={setField("location")}
      />

      <Field
        label="Site"
        placeholder="https://suastartup.com.br"
        value={form.website}
        onChange={setField("website")}
      />
    </div>
  );

  // ==========================================================
  // ETAPA 02 — SOLUÇÃO (APENAS PROBLEMA QUE RESOLVE + IA OBRIGATÓRIA)
  // ==========================================================
  const stepSolucao = (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#203754]">
            Problema que resolve e como sua solução atua
          </span>
          {aiEnhanced ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f7ee] px-3 py-1 text-[11px] font-bold text-[#166d48]">
              <Check size={12} /> Estruturado pela IA para o matchmaking
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6d6] px-3 py-1 text-[11px] font-bold text-[#854d0e]">
              <Sparkles size={12} /> Melhoria com IA obrigatória antes de avançar
            </span>
          )}
        </div>
        <textarea
          rows={9}
          value={form.problem}
          onChange={(e) => setField("problem")(e.target.value)}
          placeholder="Descreva com suas palavras qual problema real sua startup resolve, para quem é voltada e qual tecnologia aplica. Em seguida, clique em 'Melhorar texto com IA' para organizar automaticamente os tópicos do matchmaking."
          className="w-full rounded-xl border border-[#d9e1e7] bg-[#fcfdfe] p-4 text-xs leading-6 text-[#111827] outline-none transition focus:border-[#111827]"
        />
      </div>

      {aiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {aiError}
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#e3e8ee] bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
        <div className="text-xs leading-5 text-[#5b6b79]">
          A IA organiza seu texto nos padrões de avaliação corporativa e extrai automaticamente tecnologias, modelo de negócio e tags de matching.
        </div>
        <button
          type="button"
          disabled={enhancingAi}
          onClick={handleEnhanceProblemWithAI}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3 text-xs font-extrabold text-[#FEC908] shadow-sm transition hover:bg-black disabled:opacity-60"
        >
          <Sparkles size={15} />
          {enhancingAi
            ? "Estruturando texto com IA..."
            : aiEnhanced
            ? "Reestruturar texto com IA"
            : "Melhorar texto com IA"}
        </button>
      </div>

      {aiExtractedTags.length > 0 && (
        <div className="rounded-xl border border-[#dce6ef] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Tags e tecnologias identificadas automaticamente pela IA
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {aiExtractedTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#111827] px-3 py-1 text-[11px] font-bold text-[#FEC908]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ==========================================================
  // ETAPA 03 — MOMENTO (VALIDAÇÃO VS TRAÇÃO + TRL NASA + PDF)
  // ==========================================================
  const isTracaoSelected = form.currentStage === "Tração";

  const stepMomento = (
    <div className="space-y-6">
      <div>
        <span className="mb-3 block text-xs font-bold text-[#203754]">
          Selecione o estágio atual da sua startup (editável depois em Conta e acesso)
        </span>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card Validação */}
          <button
            type="button"
            onClick={() => handleSelectStage("Validação")}
            className={`flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition ${
              !isTracaoSelected
                ? "border-[#111827] bg-[#111827] text-white shadow-md"
                : "border-[#dfe5ea] bg-white text-[#111827] hover:border-[#9fb0bf]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold">Validação</span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                    !isTracaoSelected
                      ? "border-[#FEC908] bg-[#FEC908] text-[#111827]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {!isTracaoSelected && <Check size={14} strokeWidth={3} />}
                </span>
              </div>
              <p
                className={`mt-2.5 text-xs leading-5 ${
                  !isTracaoSelected ? "text-gray-300" : "text-[#697885]"
                }`}
              >
                Para startups validando MVP, pilotos ou primeiros contratos comerciais. Não exige atestado técnico.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
              {["POCs", "Primeira Compra", "Editais", "Eventos"].map((b) => (
                <span
                  key={b}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    !isTracaoSelected
                      ? "bg-white/15 text-[#FEC908]"
                      : "bg-[#f1f5f9] text-[#475569]"
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
          </button>

          {/* Card Tração */}
          <button
            type="button"
            onClick={() => handleSelectStage("Tração")}
            className={`flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition ${
              isTracaoSelected
                ? "border-[#111827] bg-[#111827] text-white shadow-md"
                : "border-[#dfe5ea] bg-white text-[#111827] hover:border-[#9fb0bf]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold">Tração</span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                    isTracaoSelected
                      ? "border-[#FEC908] bg-[#FEC908] text-[#111827]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isTracaoSelected && <Check size={14} strokeWidth={3} />}
                </span>
              </div>
              <p
                className={`mt-2.5 text-xs leading-5 ${
                  isTracaoSelected ? "text-gray-300" : "text-[#697885]"
                }`}
              >
                Para startups com operação comercial comprovada. Acesso direto a demandas de Compra Corporativa (sem POCs).
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
              {["Compras Corporativas", "Editais", "Eventos"].map((b) => (
                <span
                  key={b}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isTracaoSelected
                      ? "bg-white/15 text-[#FEC908]"
                      : "bg-[#f1f5f9] text-[#475569]"
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Fluxo de Comprovação de Tração: TRL NASA + Upload PDF Atestado */}
      {isTracaoSelected && (
        <div className="space-y-6 rounded-2xl border border-[#dbe3ea] bg-[#f8fafc] p-5 md:p-6">
          <div className="flex flex-col justify-between gap-2 border-b border-[#e2e8f0] pb-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">
                1. Pesquisa de Maturidade Tecnológica — Escala TRL da NASA (1 a 9)
              </h3>
              <p className="mt-1 text-xs text-[#64748b]">
                Responda às 5 questões de prontidão tecnológica para liberar o envio do Atestado de Capacidade Técnica em PDF.
              </p>
            </div>
            <span className="self-start rounded-full bg-[#111827] px-3.5 py-1 text-xs font-extrabold text-[#FEC908] sm:self-auto">
              TRL estimado: {form.tractionAttested ? form.trlScore || computedTrlScore : computedTrlScore}/9
            </span>
          </div>

          <div className="space-y-3">
            {NASA_TRL_QUESTIONS.map((q) => {
              const currentAns = trlAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#fef9c3] px-2 py-0.5 text-[10px] font-extrabold text-[#854d0e]">
                        {q.badge}
                      </span>
                      <span className="text-xs font-extrabold text-[#111827]">{q.title}</span>
                    </div>
                    <p className="text-xs leading-5 text-[#5b6b79]">{q.question}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {(["SIM", "NAO"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setTrlAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt,
                          }))
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${
                          currentAns === opt
                            ? opt === "SIM"
                              ? "bg-[#111827] text-[#FEC908]"
                              : "bg-red-600 text-white"
                            : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
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
            <div className="rounded-xl border border-[#cbd5e1] bg-white p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
                    <FileText size={16} /> 2. Anexar Atestado de Capacidade Técnica (PDF)
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">
                    A IA lerá o PDF anexado para atestar a tração da startup e preencher automaticamente seus indicadores operacionais.
                  </p>
                </div>
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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-extrabold text-[#FEC908] transition hover:bg-black disabled:opacity-60"
                  >
                    <Upload size={14} />
                    {verifyingPdf
                      ? "Lendo e atestando PDF com IA..."
                      : form.tractionAttested
                      ? "Substituir PDF atestado"
                      : "Selecionar PDF do Atestado"}
                  </button>
                </div>
              </div>

              {pdfFileName && (
                <p className="mt-3 text-[11px] font-semibold text-[#475569]">
                  Arquivo selecionado: <strong>{pdfFileName}</strong>
                </p>
              )}

              {pdfError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                  {pdfError}
                </div>
              )}

              {form.tractionAttested && (
                <div className="mt-4 space-y-3 rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] p-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#166d48]">
                    <CheckCircle2 size={16} /> Tração Atestada pela IA · Nível TRL {form.trlScore}/9
                  </div>
                  <p className="text-xs leading-5 text-[#1e563d]">
                    {form.tractionAttestationInfo ||
                      "Documento técnico verificado com sucesso pela IA StartIn."}
                  </p>
                  <div className="grid gap-2 pt-1 sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 p-2.5 text-[11px] text-[#111827]">
                      <span className="block font-bold text-[#64748b]">Maturidade preenchida</span>
                      {form.productMaturity || `TRL ${form.trlScore}/9`}
                    </div>
                    <div className="rounded-lg bg-white/80 p-2.5 text-[11px] text-[#111827]">
                      <span className="block font-bold text-[#64748b]">Tração / Clientes</span>
                      {form.tractionCustomers || "Capacidade técnica comprovada"}
                    </div>
                  </div>
                  {pdfHighlights.length > 0 && (
                    <ul className="space-y-1 pt-1 text-[11px] text-[#1e563d]">
                      {pdfHighlights.map((h, idx) => (
                        <li key={idx}>• {h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const content = [stepIdentidade, stepSolucao, stepMomento][step];
  const subtitles = [
    "Selecione a área tecnológica principal, localização e site da sua startup.",
    "Descreva o problema que sua startup resolve e estruture com nossa IA para o matchmaking.",
    "Defina o momento atual (Validação ou Tração com escala TRL da NASA e Atestado Técnico).",
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb] px-5 py-7 md:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => {
              if (step > 0) {
                setStep((s) => s - 1);
              } else {
                go(localStorage.getItem("startin-auth") ? "dashboard" : "login");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#6d7b87] transition hover:bg-white hover:text-[#111827]"
          >
            <ArrowLeft size={14} />{" "}
            {step > 0 ? `Voltar para 0${step} — ${labels[step - 1]}` : "Voltar para o início"}
          </button>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[225px_1fr]">
          <div>
            <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-.06em] text-[#111827]">
              Oportunidades que combinam <span className="text-[#111827]">com sua startup.</span>
            </h1>
            <p className="mt-4 text-sm leading-5 text-[#78828d]">
              Cadastro enxuto e estruturado por IA em apenas 3 etapas.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#6d7781]">Vamos conhecer sua startup</p>
            <p className="mt-1 text-xs text-[#9aa2aa]">{subtitles[step]}</p>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {labels.map((x, i) => (
                <button
                  key={x}
                  type="button"
                  disabled={i > step && !canAdvanceStartupStep()}
                  onClick={() => {
                    if (i <= step) setStep(i);
                  }}
                  className={`border-t-2 pt-2 text-left text-[11px] font-semibold transition ${
                    i <= step
                      ? "border-[#FEC908] text-[#111827]"
                      : "border-[#dce2e7] text-[#9ca5ad]"
                  }`}
                >
                  0{i + 1} {x}
                </button>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-[#e0e5e9] bg-white p-6 md:p-8">
              <h2 className="text-[22px] font-extrabold tracking-[-.04em] text-[#111827]">
                0{step + 1} — {labels[step]}
              </h2>
              <p className="mt-2 text-sm text-[#77818c]">{subtitles[step]}</p>
              <div className="mt-7">{content}</div>

              {step === 1 && !aiEnhanced && (
                <p className="mt-5 text-right text-[11px] font-semibold text-[#854d0e]">
                  Clique em "Melhorar texto com IA" acima para liberar a próxima etapa.
                </p>
              )}
              {step === 2 && isTracaoSelected && !form.tractionAttested && (
                <p className="mt-5 text-right text-[11px] font-semibold text-[#854d0e]">
                  Responda às 5 perguntas TRL e anexe o Atestado em PDF para confirmar o estágio de Tração.
                </p>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <PrimaryButton
                  secondary
                  onClick={() => {
                    if (step > 0) {
                      setStep((s) => s - 1);
                    } else {
                      go(localStorage.getItem("startin-auth") ? "dashboard" : "login");
                    }
                  }}
                >
                  <ArrowLeft size={15} /> {step > 0 ? "Voltar etapa" : "Voltar"}
                </PrimaryButton>
                <PrimaryButton
                  disabled={saving || !canAdvanceStartupStep()}
                  onClick={handleNextStartupStep}
                >
                  {step === 2 ? "Finalizar perfil" : "Continuar"} <ArrowRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
