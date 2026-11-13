import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  Briefcase,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  Eye,
  FilePlus2,
  FileText,
  Filter,
  Handshake,
  Heart,
  HomeIcon,
  Lightbulb,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Rocket,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "@/icons";
import {
  AiPromptTutorialGuide,
  BackButton,
  Field,
  LocationField,
  PageTitle,
  PrimaryButton,
  TextAreaField,
} from "@/components/startin/CommonUI";
import {
  api,
  applyFreeTierFilter,
  getSession,
  isProUser,
  saveSession,
  type OpportunityItem,
  type ProviderDashboardSummary,
  type ServiceConnectionItem,
  type ServiceProviderData,
  type StartupProfileData,
} from "@/lib/api";
import {
  ProMemberBadge,
  ProUpgradeModal,
  VerMaisProBanner,
  VerifiedProBadge,
} from "@/components/startin/PlanComponents";
import type { Screen } from "@/types/startin";
import { DailyCycleCache } from "@/utils/dailyCache";
import {
  formatCityStateOnly,
  formatCNPJ,
  formatPhoneBR,
  getInitials,
  isValidCNPJ,
  isValidEmail,
  isValidPhoneBR,
} from "@/utils/formatters";

const PRESET_PROVIDER_CATEGORIES = [
  "Design",
  "Tecnologia",
  "Marketing",
  "Consultoria",
  "Jurídico",
  "Financeiro",
];

// =========================================================================
// 1. ONBOARDING DO PRESTADOR DE SERVIÇOS (RESUMIDO EM 3 ETAPAS COM EXTRAÇÃO DE CURRÍCULO EM PDF)
// =========================================================================
export function ProviderOnboardingScreen({
  go,
  onComplete,
}: {
  go: (s: Screen) => void;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [extractingResume, setExtractingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeExtracted, setResumeExtracted] = useState(false);
  const [resumeHighlights, setResumeHighlights] = useState<string[]>([]);
  const [enhancingBioAi, setEnhancingBioAi] = useState(false);
  const [bioAiEnhancedNotice, setBioAiEnhancedNotice] = useState(false);
  const [error, setError] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const resumeInputRef = React.useRef<HTMLInputElement | null>(null);

  const session = getSession();

  // Formulário das 3 Etapas
  const [form, setForm] = useState<ServiceProviderData>({
    name: session?.name || "",
    providerType: "PROFISSIONAL",
    category: "Tecnologia",
    photoUrl: "",
    description: "",
    location: "",
    portfolioUrl: "",
    linkedinUrl: "",
    availability: "Disponível imediatamente",
    mainService: "",
    serviceExperience: "",
    toolsAndSkills: "",
    complementaryCategory: "",
    targetSegment: "",
    experienceYears: "3–5 anos" as any,
    projectName: "",
    projectLink: "",
    projectDescription: "",
    projectYear: "2026",
    projectRepoUrl: "",
    projectTools: "",
    projectType: "",
    projectCoverUrl: "",
    interestSectors: "",
    connectionPreference: "Projetos sob demanda",
    opportunitiesSought: "",
    interestRegion: "Brasil (Remoto)",
    targetStartupSize: "Tração",
    communicationLanguage: "Português",
    tags: "",
    matchScore: 90,
  });

  const updateField = (key: keyof ServiceProviderData, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const processPhotoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido (PNG, JPG, WEBP ou SVG).");
      return;
    }
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!rawDataUrl) return;

      if (file.type === "image/svg+xml") {
        setForm((prev) => ({ ...prev, photoUrl: rawDataUrl, avatarUrl: rawDataUrl } as ServiceProviderData));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const outputMime = file.type === "image/png" ? "image/png" : "image/jpeg";
          const compressedDataUrl = canvas.toDataURL(outputMime, 0.88);
          setForm((prev) => ({ ...prev, photoUrl: compressedDataUrl, avatarUrl: compressedDataUrl } as ServiceProviderData));
        } else {
          setForm((prev) => ({ ...prev, photoUrl: rawDataUrl, avatarUrl: rawDataUrl } as ServiceProviderData));
        }
      };
      img.onerror = () => {
        setForm((prev) => ({ ...prev, photoUrl: rawDataUrl, avatarUrl: rawDataUrl } as ServiceProviderData));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photoUrl: "", avatarUrl: "" } as ServiceProviderData));
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  // Processar e extrair dados do Currículo em PDF (Obrigatório na Etapa 1)
  const processResumePdfFile = (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Por favor, anexe o seu currículo obrigatoriamente em formato PDF (.pdf).");
      return;
    }
    setError("");
    setResumeFileName(file.name);
    setExtractingResume(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const base64Part = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      try {
        const res = await api.extractProviderResumeAI({
          fileName: file.name,
          fileBase64: base64Part,
          providerName: form.name || session?.name || "",
          providerType: form.providerType,
          linkedinUrl: form.linkedinUrl,
          portfolioUrl: form.portfolioUrl,
        });

        setForm((prev) => ({
          ...prev,
          category: res.category || prev.category || "Tecnologia",
          mainService: res.mainService || prev.mainService,
          toolsAndSkills: res.toolsAndSkills || prev.toolsAndSkills,
          tags: Array.isArray(res.tags) && res.tags.length > 0 ? res.tags.join(", ") : prev.tags,
          experienceYears: (res.experienceYears || prev.experienceYears || "3–5 anos") as any,
          location: res.location || prev.location || "Recife, PE",
          projectName: res.projectName || prev.projectName,
          projectType: res.projectType || prev.projectType || "Consultoria técnica",
          projectYear: res.projectYear || prev.projectYear || "2026",
          projectTools: res.toolsAndSkills || prev.projectTools,
          interestSectors: res.interestSectors || prev.interestSectors || "Tecnologia / SaaS, IA & Dados, Finanças",
          connectionPreference: res.connectionPreference || prev.connectionPreference || "Projetos sob demanda",
          opportunitiesSought: res.opportunitiesSought || prev.opportunitiesSought || "Desenvolver MVPs, Prestar consultoria especializada",
          description: res.description || prev.description,
          serviceExperience: res.serviceExperience || res.description || prev.serviceExperience,
          projectDescription: res.projectDescription || res.description || prev.projectDescription,
        }));

        if (res.category && !PRESET_PROVIDER_CATEGORIES.includes(res.category)) {
          setIsCustomCategory(true);
        } else {
          setIsCustomCategory(false);
        }

        setResumeHighlights(
          Array.isArray(res.extractedHighlights) && res.extractedHighlights.length > 0
            ? res.extractedHighlights
            : [
                `Categoria e serviço identificados: ${res.category} · ${res.mainService}`,
                `Tecnologias e competências extraídas: ${res.toolsAndSkills}`,
                "Descrição profissional prévia gerada automaticamente para a Etapa 3",
              ]
        );
        setResumeExtracted(true);
      } catch {
        setResumeExtracted(true);
        setResumeHighlights([
          `Currículo anexado: ${file.name}`,
          "Experiências, tecnologias e descrição prévia preparadas para revisão.",
        ]);
      } finally {
        setExtractingResume(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumePdfFile(file);
    }
    e.target.value = "";
  };

  // Carregar dados existentes se houver
  useEffect(() => {
    async function loadExisting() {
      if (!session?.userId) return;
      try {
        const existing = await api.getProviderByUser(session.userId);
        if (existing && existing.id) {
          const rawDesc = (existing.description || "").trim();
          const isDefaultPlaceholderDesc =
            rawDesc ===
              "Prestador de serviços especializado em soluções de design, tecnologia e inovação para startups." ||
            rawDesc ===
              "Prestador de serviços especializado em soluções de tecnologia.";
          setForm({
            ...existing,
            description: isDefaultPlaceholderDesc ? "" : existing.description || "",
          });
          setResumeExtracted(true);
          setResumeFileName("curriculo_cadastrado.pdf");
          if (
            existing.category &&
            !PRESET_PROVIDER_CATEGORIES.includes(existing.category)
          ) {
            setIsCustomCategory(true);
          }
        }
      } catch {
        // Sem cadastro anterior, mantém os defaults
      }
    }
    loadExisting();
  }, [session?.userId]);

  // Melhorar descrição profissional (Etapa 3) com IA mantendo coesão com o que o usuário modificou
  const handleEnhanceBioWithAi = async () => {
    const rawText = (form.description || "").trim();
    if (!rawText) {
      setError("Escreva ou revise algumas palavras na descrição para a IA aprimorar.");
      return;
    }
    setError("");
    setEnhancingBioAi(true);
    try {
      const res = await api.enhanceProviderServicesAI({
        text: rawText,
        category: form.category || "Tecnologia",
        providerName: form.name,
        mainService: form.mainService || "",
        providerType: form.providerType,
        fieldType: "bio",
      });
      if (res.enhancedText) {
        const extractedTools = res.toolsAndSkills || res.technologies || "";
        setForm((prev) => ({
          ...prev,
          description: res.enhancedText,
          serviceExperience: res.enhancedText,
          projectDescription: res.enhancedText,
          mainService: prev.mainService || res.mainService || prev.category,
          toolsAndSkills: prev.toolsAndSkills || extractedTools,
          tags: res.tags && res.tags.length > 0 ? res.tags.join(", ") : prev.tags,
        }));
        setBioAiEnhancedNotice(true);
      }
    } catch {
      setError("Erro ao consultar a IA. Tente novamente.");
    } finally {
      setEnhancingBioAi(false);
    }
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) {
        setError("Preencha seu nome completo ou razão social.");
        return;
      }
      if (!resumeFileName && !resumeExtracted && !form.id) {
        setError("Anexe seu currículo em PDF (obrigatório) para que a IA extraia suas experiências, tecnologias e serviços.");
        return;
      }
      if (extractingResume) {
        setError("Aguarde um instante enquanto a IA conclui a leitura do seu currículo em PDF.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.category.trim() || !form.mainService.trim()) {
        setError("Confirme sua categoria principal e o serviço principal oferecido.");
        return;
      }
      if (!form.description.trim()) {
        const fallbackDesc = `Atuo na área de ${form.category} com foco em ${form.mainService}, utilizando ${
          form.toolsAndSkills || form.category
        } para apoiar startups em estágios de validação e tração com entregas ágeis e orientadas a resultados.`;
        setForm((prev) => ({
          ...prev,
          description: fallbackDesc,
          serviceExperience: fallbackDesc,
        }));
      }
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!form.description.trim()) {
      setError("Revise ou escreva sua descrição profissional antes de concluir o cadastro.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let targetId = form.id || session?.providerId;
      if (!targetId && session?.userId) {
        try {
          const existing = await api.getProviderByUser(session.userId);
          if (existing?.id) {
            targetId = existing.id;
          }
        } catch {
          // Segue para criação caso ainda não exista
        }
      }

      const resolvedPhoto = form.photoUrl || (form as any).avatarUrl || "";
      const unifiedDescription = form.description.trim();
      const payload: Partial<ServiceProviderData> = {
        ...form,
        id: targetId,
        userId: session?.userId,
        photoUrl: resolvedPhoto,
        avatarUrl: resolvedPhoto,
        description: unifiedDescription,
        serviceExperience: form.serviceExperience?.trim() || unifiedDescription,
        projectDescription: form.projectDescription?.trim() || unifiedDescription,
        projectTools: form.projectTools?.trim() || form.toolsAndSkills,
        tags: form.tags?.trim() || form.toolsAndSkills,
        experienceYears: String(form.experienceYears ?? "3–5 anos") as any,
      };

      let saved: ServiceProviderData;
      if (targetId) {
        saved = await api.updateProvider(targetId, payload);
      } else {
        saved = await api.createProvider(payload);
      }

      if (session) {
        saveSession({
          ...session,
          providerId: saved.id,
          accountType: "PROVIDER",
          name: saved.name || session.name,
        });
      }

      onComplete?.();
      go("provider-dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Barra de Progresso das 3 Etapas */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="text-[#111827]">Passo {step} de 3</span>
            <span>
              {step === 1
                ? "Perfil & Anexos"
                : step === 2
                  ? "Competências & Serviços"
                  : "Descrição Profissional"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { num: "01", label: "Perfil & Anexos" },
              { num: "02", label: "Competências & Serviços" },
              { num: "03", label: "Descrição Profissional" },
            ].map((s, idx) => {
              const currentNum = idx + 1;
              const isPast = step > currentNum;
              const isCurrent = step === currentNum;
              return (
                <div key={s.num} className="flex flex-col gap-1.5">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isPast
                        ? "bg-[#15803d]"
                        : isCurrent
                        ? "bg-[#FEC908]"
                        : "bg-gray-200"
                    }`}
                  />
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#111827]">
                    <span className={isCurrent ? "text-[#111827]" : "text-gray-400"}>
                      {s.num}
                    </span>
                    <span className="hidden sm:inline text-gray-600">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* =========================================================================
            ETAPA 1: PERFIL & ANEXOS (CURRÍCULO EM PDF OBRIGATÓRIO + LINKEDIN E SITE OPCIONAIS)
        ========================================================================== */}
        {step === 1 && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
            <h1 className="text-2xl font-black tracking-[-.04em] text-[#111827]">
              01 · Perfil & Anexos
            </h1>
            <p className="mt-1.5 text-xs text-gray-500">
              Anexe seu currículo em PDF para que nossa IA extraia automaticamente suas experiências, tecnologias que domina, serviços e elabore sua descrição prévia.
            </p>

            <div className="mt-6 space-y-5">
              {/* Foto de Perfil / Logo */}
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-2">
                  Foto de perfil ou logo (opcional)
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) processPhotoFile(droppedFile);
                    }}
                    title="Clique para anexar foto ou logo"
                    className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-[#111827] hover:bg-gray-100/70 hover:text-[#111827]"
                  >
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt="Avatar"
                        className="h-full w-full rounded-3xl object-cover"
                      />
                    ) : (
                      <Camera size={30} />
                    )}
                  </button>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remover foto"
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-[#FEC908] shadow-md transition hover:bg-black"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Nome */}
              <Field
                label="Nome completo ou Razão Social"
                placeholder="Ex: Vinícius Cândido ou Studio Alpha"
                value={form.name}
                onChange={(v) => updateField("name", v)}
              />

              {/* Tipo de Prestador */}
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-2">
                  Tipo de prestador
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("providerType", "PROFISSIONAL")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-extrabold transition ${
                      form.providerType === "PROFISSIONAL"
                        ? "border-[#111827] bg-[#111827] text-[#FEC908]"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <UserRound size={16} />
                    Profissional Autônomo / Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("providerType", "EMPRESA")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-extrabold transition ${
                      form.providerType === "EMPRESA"
                        ? "border-[#111827] bg-[#111827] text-[#FEC908]"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Building2 size={16} />
                    Empresa / Agência / Software House
                  </button>
                </div>
              </div>

              {/* Anexo de Currículo em PDF (Obrigatório) */}
              <div className="rounded-2xl border-2 border-dashed border-[#111827]/25 bg-[#f8fafc] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                    <FileText size={15} className="text-[#111827]" />
                    Anexar Currículo em PDF
                    <span className="rounded-md bg-[#111827] px-2 py-0.5 text-[10px] font-black uppercase text-[#FEC908]">
                      Obrigatório
                    </span>
                  </label>
                  {resumeFileName && (
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      className="text-[11px] font-bold text-[#111827] underline hover:text-black"
                    >
                      Substituir PDF
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 mb-3">
                  A IA analisará o PDF anexado para puxar automaticamente suas experiências, tecnologias que domina, serviços e criar uma descrição prévia coesa.
                </p>

                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleResumeFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => resumeInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) processResumePdfFile(dropped);
                  }}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-center transition hover:border-[#111827]"
                >
                  {extractingResume ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <Sparkles size={22} className="animate-spin text-[#ca8a04]" />
                      <span className="text-xs font-extrabold text-[#111827]">
                        Lendo currículo em PDF e extraindo experiências, tecnologias e serviços com a IA...
                      </span>
                    </div>
                  ) : resumeFileName ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        {resumeFileName}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Currículo processado pela IA · Clique para trocar o arquivo se desejar
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                      <FilePlus2 size={24} className="text-[#111827]" />
                      <span className="text-xs font-extrabold text-[#111827]">
                        Clique para selecionar seu currículo em PDF ou arraste o arquivo aqui
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Formato aceito: .PDF (Currículo, Portfólio Técnico ou Apresentação Profissional)
                      </span>
                    </div>
                  )}
                </div>

                {resumeExtracted && resumeHighlights.length > 0 && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-900 mb-1.5">
                      <Sparkles size={13} className="text-emerald-700" />
                      Dados extraídos do currículo pela IA:
                    </div>
                    <ul className="space-y-1 text-[11px] text-emerald-800">
                      {resumeHighlights.map((hl, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* LinkedIn (Opcional) e Meu Site (Opcional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="LinkedIn (Opcional)"
                  placeholder="https://linkedin.com/in/seu-perfil"
                  value={form.linkedinUrl}
                  onChange={(v) => updateField("linkedinUrl", v)}
                />
                <Field
                  label="Meu Site / Portfólio (Opcional)"
                  placeholder="https://meusite.com.br"
                  value={form.portfolioUrl}
                  onChange={(v) => updateField("portfolioUrl", v)}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <PrimaryButton onClick={handleNextStep} disabled={extractingResume}>
                Salvar e continuar <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* =========================================================================
            ETAPA 2: COMPETÊNCIAS, TECNOLOGIAS & SERVIÇOS EXTRAÍDOS DO CURRÍCULO
        ========================================================================== */}
        {step === 2 && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
            <h1 className="text-2xl font-black tracking-[-.04em] text-[#111827]">
              02 · Competências, Tecnologias & Serviços
            </h1>
            <p className="mt-1.5 text-xs text-gray-500">
              Revise ou ajuste as experiências, tecnologias dominadas e serviços identificados pela IA a partir do seu currículo.
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-[11px] font-semibold text-amber-900 flex items-center gap-2">
              <Sparkles size={14} className="shrink-0 text-amber-600" />
              <span>
                Estes campos foram preenchidos automaticamente com base no seu currículo em PDF e alimentam o motor de matchmaking.
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {/* Categoria Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-2">
                    Categoria Principal de Atuação
                  </label>
                  {isCustomCategory ? (
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Digite sua área de atuação..."
                        value={form.category}
                        onChange={(e) => updateField("category", e.target.value)}
                        className="startin-input pr-24 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          updateField("category", PRESET_PROVIDER_CATEGORIES[0]);
                        }}
                        className="absolute right-1.5 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-[#111827] transition hover:bg-gray-200"
                        title="Voltar para a lista de categorias"
                      >
                        Ver lista <ChevronDown size={12} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "OUTRO") {
                          setIsCustomCategory(true);
                          if (PRESET_PROVIDER_CATEGORIES.includes(form.category)) {
                            updateField("category", "");
                          }
                        } else {
                          setIsCustomCategory(false);
                          updateField("category", val);
                        }
                      }}
                      className="startin-input text-xs"
                    >
                      <option value="Design">Design (UI/UX, Produto, Branding)</option>
                      <option value="Tecnologia">Tecnologia (Desenvolvimento Full Stack, Mobile, DevOps)</option>
                      <option value="Marketing">Marketing & Growth</option>
                      <option value="Consultoria">Consultoria de Negócios & Produto</option>
                      <option value="Jurídico">Jurídico & Compliance</option>
                      <option value="Financeiro">Financeiro & Captação</option>
                      <option value="OUTRO">Outro:</option>
                    </select>
                  )}
                </div>

                <Field
                  label="Serviço Principal Oferecido"
                  placeholder="Ex: Desenvolvimento Full Stack, UX/UI Design, Marketing Estratégico..."
                  value={form.mainService}
                  onChange={(v) => updateField("mainService", v)}
                />
              </div>

              {/* Tecnologias e Ferramentas Dominadas */}
              <Field
                label="Tecnologias, Ferramentas e Competências que domina"
                placeholder="Ex: React, TypeScript, Node.js, Python, Figma, Meta Ads, Gestão de Projetos..."
                value={form.toolsAndSkills}
                onChange={(v) => updateField("toolsAndSkills", v)}
              />

              {/* Experiência em Destaque e Anos de Experiência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Experiência / Case ou Projeto em Destaque"
                  placeholder="Ex: Arquitetura e Desenvolvimento de Plataforma SaaS"
                  value={form.projectName}
                  onChange={(v) => updateField("projectName", v)}
                />
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-2">
                    Tempo de Experiência
                  </label>
                  <select
                    value={String(form.experienceYears || "3–5 anos")}
                    onChange={(e) => updateField("experienceYears", e.target.value)}
                    className="startin-input text-xs"
                  >
                    <option value="menos de 1 ano">Menos de 1 ano</option>
                    <option value="1–3 anos">1 a 3 anos</option>
                    <option value="3–5 anos">3 a 5 anos</option>
                    <option value="5–8 anos">5 a 8 anos</option>
                    <option value="8+ anos">Mais de 8 anos</option>
                  </select>
                </div>
              </div>

              {/* Localização e Disponibilidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LocationField
                  label="Localização (Cidade, UF)"
                  placeholder="Ex: Recife, PE"
                  value={form.location}
                  onChange={(v) => updateField("location", v)}
                />
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-2">
                    Disponibilidade
                  </label>
                  <select
                    value={form.availability}
                    onChange={(e) => updateField("availability", e.target.value)}
                    className="startin-input text-xs"
                  >
                    <option value="Disponível imediatamente">Disponível imediatamente</option>
                    <option value="A partir do próximo mês">A partir do próximo mês</option>
                    <option value="Apenas projetos pontuais">Apenas projetos pontuais</option>
                    <option value="Horas semanais flexíveis">Horas semanais flexíveis</option>
                  </select>
                </div>
              </div>

              {/* Setores de interesse e Modelo de conexão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Setores de startups de maior interesse"
                  placeholder="Ex: Tecnologia / SaaS, IA & Dados, Finanças, Saúde"
                  value={form.interestSectors}
                  onChange={(v) => updateField("interestSectors", v)}
                />
                <Field
                  label="Modelo de atuação / contratação preferido"
                  placeholder="Ex: Projetos sob demanda, Contrato PJ, Consultoria"
                  value={form.connectionPreference}
                  onChange={(v) => updateField("connectionPreference", v)}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
              <PrimaryButton onClick={handleNextStep}>
                Salvar e continuar <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* =========================================================================
            ETAPA 3: DESCRIÇÃO PROFISSIONAL PRÉ-PREENCHIDA PELO CURRÍCULO + MELHORAR COM IA
        ========================================================================== */}
        {step === 3 && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
            <h1 className="text-2xl font-black tracking-[-.04em] text-[#111827]">
              03 · Descrição Profissional
            </h1>
            <p className="mt-1.5 text-xs text-gray-500">
              A IA elaborou uma descrição prévia em 1ª pessoa com base no seu currículo em PDF anexado na Etapa 1. Você pode modificar livremente o texto e usar o botão &ldquo;Melhorar com IA&rdquo; sempre que quiser refiná-lo.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="startin-field-label">
                    Apresentação Profissional, Experiências e Serviços
                  </span>
                  <button
                    type="button"
                    onClick={handleEnhanceBioWithAi}
                    disabled={enhancingBioAi}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-1.5 text-[11px] font-extrabold text-[#FEC908] transition hover:bg-black disabled:opacity-50"
                  >
                    <Sparkles size={13} />
                    {enhancingBioAi ? "Melhorando com IA..." : "Melhorar com IA"}
                  </button>
                </div>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => {
                    updateField("description", e.target.value);
                    updateField("serviceExperience", e.target.value);
                  }}
                  placeholder="Descreva suas experiências, tecnologias que domina e como seus serviços ajudam startups a escalar..."
                  rows={7}
                  className="startin-textarea transition text-xs leading-relaxed"
                />
                {bioAiEnhancedNotice && (
                  <p className="mt-1.5 text-[11px] font-bold text-[#15803d]">
                    ✓ Descrição profissional aprimorada em 1ª pessoa pela IA da StartIn!
                  </p>
                )}
                <div className="mt-3">
                  <AiPromptTutorialGuide role="provider" fieldContext="bio" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
              <PrimaryButton onClick={handleFinish} disabled={loading}>
                {loading ? "Concluindo..." : "Concluir cadastro e acessar plataforma"}{" "}
                <Check size={16} />
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// MODAL DE CONTATOS DE UMA CONEXÃO ATIVA (COMPARTILHADO ENTRE TELAS)
// =========================================================================
export function ConnectionContactModal({
  conn,
  onClose,
  onRemove,
  currentRole,
}: {
  conn: ServiceConnectionItem;
  onClose: () => void;
  onRemove?: (id: number) => void;
  currentRole: "STARTUP" | "PROVIDER";
}) {
  const isSt = currentRole === "STARTUP";
  const name = isSt ? conn.providerName : conn.startupName;
  const subtitle = isSt
    ? [conn.providerCategory, conn.providerMainService].filter(Boolean).join(" · ")
    : [conn.startupSegment, conn.startupStage || "Tração"].filter(Boolean).join(" · ");
  const email = isSt ? conn.providerEmail : conn.startupEmail;
  const phone = isSt ? conn.providerPhone : conn.startupPhone;
  const loc = isSt ? conn.providerLocation : conn.startupLocation;
  const web = isSt ? conn.providerPortfolioUrl : conn.startupWebsite;
  const linkedin = isSt ? conn.providerLinkedinUrl : undefined;
  const cleanDigits = (phone || "").replace(/\D/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
              ✓ Parceria Confirmada · Contatos Liberados
            </span>
            <h3 className="mt-2 text-lg font-black text-[#111827]">{name}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-500 flex items-center gap-1.5">
              <Mail size={14} /> E-mail:
            </span>
            {email ? (
              <a href={`mailto:${email}`} className="font-extrabold text-[#111827] hover:underline">
                {email}
              </a>
            ) : (
              <span className="text-gray-400">Não informado</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-500 flex items-center gap-1.5">
              <Phone size={14} /> Telefone / WhatsApp:
            </span>
            {phone ? (
              <a
                href={
                  cleanDigits.length >= 10
                    ? `https://wa.me/${cleanDigits.startsWith("55") ? cleanDigits : "55" + cleanDigits}`
                    : `tel:${phone}`
                }
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#15803d] hover:underline"
              >
                {phone}
              </a>
            ) : (
              <span className="text-gray-400">Não informado</span>
            )}
          </div>

          {loc && (
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-500 flex items-center gap-1.5">
                <MapPin size={14} /> Localização:
              </span>
              <span className="font-semibold text-gray-800">{formatCityStateOnly(loc)}</span>
            </div>
          )}

          {web && (
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-500 flex items-center gap-1.5">
                <ExternalLink size={14} /> Website / Portfólio:
              </span>
              <a
                href={web}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#111827] hover:underline truncate max-w-[200px]"
              >
                {web}
              </a>
            </div>
          )}

          {linkedin && (
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-500 flex items-center gap-1.5">
                <ExternalLink size={14} /> LinkedIn:
              </span>
              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#0284c7] hover:underline truncate max-w-[200px]"
              >
                Abrir LinkedIn
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(conn.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Remover conexão
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="rounded-xl bg-[#111827] px-5 py-2.5 text-xs font-black text-[#FEC908] hover:bg-black"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. DASHBOARD DO PRESTADOR DE SERVIÇOS (100% INTEGRADO AO BANCO E IA)
// =========================================================================
export function ProviderDashboardScreen({
  go,
  onSelectStartup,
}: {
  go: (s: Screen) => void;
  onSelectStartup?: (startup: any) => void;
}) {
  const session = getSession();
  const [summary, setSummary] = useState<any | null>(null);
  const [connections, setConnections] = useState<ServiceConnectionItem[]>([]);
  const [contactModalConn, setContactModalConn] = useState<ServiceConnectionItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const [res, conns] = await Promise.all([
        api.getProviderDashboardSummary().catch(() => null),
        api.getConnections().catch(() => []),
      ]);
      setSummary(res);
      setConnections(Array.isArray(conns) ? conns : []);
    } catch (err) {
      console.error("Erro ao carregar resumo do prestador:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleToggleSaveFromDashboard = async (startupId: number) => {
    try {
      await api.toggleProviderSavedStartup(startupId);
      await loadSummary();
    } catch (err) {
      console.error("Erro ao salvar startup:", err);
    }
  };

  const providerName = summary?.providerName || session?.name || "Prestador";
  const [planVersion, setPlanVersion] = useState(0);
  const proProvider = isProUser();

  const rawRecommendedList: any[] = Array.isArray(summary?.recommendedStartups)
    ? [...summary.recommendedStartups].sort((a, b) => {
        const aPro = a.proMember ? 1 : 0;
        const bPro = b.proMember ? 1 : 0;
        if (bPro !== aPro) return bPro - aPro;
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      })
    : [];

  const { visible: recommendedList, hiddenCount: hiddenRecommendedCount, isFree: isFreeProvider } = React.useMemo(() => {
    return applyFreeTierFilter(
      rawRecommendedList,
      (st) => st.matchScore ?? 0,
      3,
      (st, newScore) => ({ ...st, matchScore: newScore })
    );
  }, [rawRecommendedList, proProvider, planVersion]);

  const activitiesList: any[] = Array.isArray(summary?.recentActivities)
    ? summary.recentActivities
    : [];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Top Greeting */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[.18em] text-gray-400">
              Painel do Prestador de Serviços
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
              proProvider
                ? "bg-[#111827] text-[#FEC908]"
                : "bg-gray-200 text-gray-700"
            }`}>
              <Sparkles size={10} />
              {proProvider ? "Plano Pro" : "Plano Free"}
            </span>
          </div>
          <h1 className="mt-1 inline-flex items-center gap-2 text-3xl font-black tracking-[-.05em] text-[#111827] md:text-4xl">
            <span>Olá, {providerName}!</span>
            {proProvider && <VerifiedProBadge size={26} />}
          </h1>
          <p className="mt-1.5 text-xs text-gray-600">
            Aqui está o resumo em tempo real das suas conexões e oportunidades com startups em estágio de Tração.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => go("for-you")}
            className="flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black shadow-xs"
          >
            <Compass size={15} />
            Ver recomendações
          </button>
          <button
            onClick={() => go("connections")}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-extrabold text-[#111827] transition hover:bg-gray-50"
          >
            <ArrowUpDown size={15} />
            Minhas Conexões
          </button>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais (100% reais do banco MySQL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Oportunidades Salvas (Demandas e Trabalhos) */}
        <div
          onClick={() => go("saved-startups")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500">Oportunidades salvas</span>
            <Bookmark size={18} className="text-[#FEC908]" />
          </div>
          <div className="mt-3 text-3xl font-black text-[#111827]">
            {summary?.savedStartupsCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Demandas e trabalhos salvos</p>
        </div>

        {/* Card 2: Sugeridas com match */}
        <div
          onClick={() => go("for-you")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500">Sugeridas c/ match</span>
            <Sparkles size={18} className="text-[#15803d]" />
          </div>
          <div className="mt-3 text-3xl font-black text-[#15803d]">
            {summary?.suggestedStartupsCount ?? summary?.suggestedConnectionsCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Startups em Tração compatíveis</p>
        </div>

        {/* Card 3: Solicitações recebidas */}
        <div
          onClick={() => go("connections")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500">Solicitações recebidas</span>
            <Mail size={18} className="text-[#0284c7]" />
          </div>
          <div className="mt-3 text-3xl font-black text-[#0284c7]">
            {summary?.receivedRequestsCount ?? summary?.pendingRequestsCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Aguardando sua resposta</p>
        </div>

        {/* Card 4: Conexões ativas */}
        <div
          onClick={() => go("connections")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500">Conexões ativas</span>
            <Handshake size={18} className="text-[#111827]" />
          </div>
          <div className="mt-3 text-3xl font-black text-[#111827]">
            {summary?.activeConnectionsCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Canais diretos abertos</p>
        </div>
      </div>

      {/* Banner de Destaque: Demandas de Startups Tracionadas */}
      <div className="relative overflow-hidden rounded-3xl bg-[#111827] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEC908] px-3 py-1 text-[10px] font-black text-[#111827]">
            <Rocket size={12} /> Tração Comprovada
          </div>
          <h2 className="mt-3 text-xl md:text-2xl font-black tracking-tight text-white">
            Startups em Tração buscam Prestadores de Serviços
          </h2>
          <p className="mt-2 text-xs leading-5 text-gray-300">
            Startups qualificadas em estágio de Tração estão contratando squads, especialistas em UX/UI,
            desenvolvedores, profissionais de marketing, jurídico, financeiro e consultores para acelerar entregas.
          </p>
          <button
            onClick={() => go("for-you")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FEC908] px-5 py-2.5 text-xs font-black text-[#111827] transition hover:bg-yellow-400"
          >
            Ver demandas e startups <ArrowRight size={15} />
          </button>
        </div>
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full border-8 border-white/5" />
      </div>

      {/* Startups Recomendadas para Você (Grid 100% Real) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[#111827]">Startups recomendadas para você</h2>
            <p className="text-xs text-gray-500">
              Avaliadas pela IA com base nas suas competências de {summary?.providerCategory || "serviços"} e nas demandas reais das startups em Tração.
            </p>
          </div>
          <button
            onClick={() => go("for-you")}
            className="text-xs font-extrabold text-[#111827] hover:underline flex items-center gap-1"
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-xs text-gray-400">
            Calculando recomendações com a IA...
          </div>
        ) : recommendedList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center space-y-2">
            <p className="text-sm font-extrabold text-[#111827]">
              Nenhuma startup em estágio de Tração cadastrada no momento
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Assim que startups em estágio de Tração forem cadastradas na plataforma, a IA calculará automaticamente o índice de compatibilidade com o seu perfil.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedList.map((st) => {
              const oppId = st.id ?? st.opportunityId;
              const stId = st.startupId ?? st.id;
              const oppTitle = st.title || st.demandTitle || st.openDemandTitle || st.name;
              const issuerName = st.startupName || st.name || "Startup";
              const oppArea = st.targetCategory || st.category || st.startupArea || st.mainArea || st.segment || "Inovação";
              const stLocation = formatCityStateOnly(st.startupLocation || st.location) || "Brasil";
              const stDesc =
                (st.description && !st.description.startsWith("Problema Central:"))
                  ? st.description
                  : (st.openDemandDescription || st.demand || "Oportunidade técnica de trabalho lançada por startup em Tração.");
              return (
                <div
                  key={oppId}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {st.startupAvatarUrl || st.avatarUrl ? (
                          <img
                            src={st.startupAvatarUrl || st.avatarUrl}
                            alt={issuerName}
                            className="h-10 w-10 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-xs font-black text-[#FEC908]">
                            {getInitials(issuerName)}
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-extrabold text-[#111827] line-clamp-1">{oppTitle}</h3>
                            {st.proMember && <ProMemberBadge compact />}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {issuerName} · {oppArea} · {stLocation}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-black text-[#15803d]">
                          {st.matchScore ?? 0}% Match
                        </span>
                        {oppId && (
                          <button
                            type="button"
                            onClick={() => handleToggleSaveFromDashboard(oppId)}
                            title={st.saved ? "Remover dos salvos" : "Salvar oportunidade"}
                            className={`rounded-lg p-1.5 transition ${
                              st.saved
                                ? "bg-[#111827] text-[#FEC908]"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            <Bookmark size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-gray-600 line-clamp-3">
                      {stDesc}
                    </p>
                    {st.justification && (
                      <p className="mt-2 rounded-lg bg-emerald-50/70 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-900">
                        {st.justification}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        onSelectStartup?.(st);
                        go("startup-detail");
                      }}
                      className="text-xs font-extrabold text-[#111827] hover:underline flex items-center gap-1 shrink-0"
                    >
                      Ver demanda <ArrowRight size={13} />
                    </button>
                    {(() => {
                      const stId = st.startupId ?? st.id;
                      const existingConn =
                        connections.find(
                          (c) =>
                            Number(c.startupId) === Number(stId) ||
                            (st.id && Number(c.startupId) === Number(st.id)) ||
                            (c.startupName && st.name && c.startupName.toLowerCase().trim() === st.name.toLowerCase().trim())
                        ) ||
                        (st.hasConnection
                          ? ({
                              id: st.connectionId,
                              status: st.connectionStatus,
                              senderType: st.connectionSenderType,
                              startupId: stId,
                              startupName: st.name,
                              startupSegment: st.mainArea || st.mainSector,
                              startupStage: st.currentStage || "Tração",
                              startupEmail: st.email || st.userEmail,
                              startupPhone: st.phone,
                              startupWebsite: st.website,
                              startupLocation: st.location || st.operationRegion,
                            } as any)
                          : null);

                      if (existingConn) {
                        if (existingConn.status === "ACCEPTED") {
                          return (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                ✓ Conectado
                              </span>
                              <button
                                type="button"
                                onClick={() => setContactModalConn(existingConn)}
                                className="rounded-lg bg-[#111827] px-2.5 py-1 text-[11px] font-extrabold text-[#FEC908] transition hover:bg-black"
                              >
                                Ver contatos
                              </button>
                            </div>
                          );
                        }
                        if (existingConn.status === "REJECTED") {
                          return (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 shrink-0">
                              Recusada
                            </span>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => go("connections")}
                            className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 hover:bg-amber-100 transition shrink-0"
                          >
                            {existingConn.senderType === "PROVIDER" ? "Aguardando resposta" : "Solicitação recebida"}
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={() => {
                            onSelectStartup?.(st);
                            go("request-connection");
                          }}
                          className="rounded-lg bg-[#111827] px-3 py-1.5 text-[11px] font-extrabold text-[#FEC908] transition hover:bg-black shrink-0"
                        >
                          Conectar
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {isFreeProvider && recommendedList.length > 0 && (
          <VerMaisProBanner
            hiddenCount={hiddenRecommendedCount}
            contextLabel="oportunidades mais assertivas e conexões com startups em Tração"
            profileType="PROVIDER"
            onUpgraded={() => setPlanVersion((v) => v + 1)}
          />
        )}
      </div>

      {/* Atividades Recentes (100% reais do banco MySQL) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-black text-[#111827] mb-4">Atividade recente da sua conta</h2>
        {activitiesList.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">
            Nenhuma atividade recente registrada. Explore startups em Tração ou envie solicitações de conexão para movimentar sua conta.
          </p>
        ) : (
          <div className="space-y-3">
            {activitiesList.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FEC908]" />
                  <div>
                    <span className="font-bold text-[#111827] block">
                      {act.title || act.text}
                    </span>
                    {act.subtitle && (
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        {act.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {act.badge && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-extrabold text-[#111827]">
                      {act.badge}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Real de Contatos Liberados */}
      {contactModalConn && (
        <ConnectionContactModal
          conn={contactModalConn}
          onClose={() => setContactModalConn(null)}
          currentRole="PROVIDER"
        />
      )}
    </div>
  );
}

// =========================================================================
// 3. EXPLORAR STARTUPS / STARTUPS SALVAS - VISÃO DO PRESTADOR (100% REAL)
// =========================================================================
const providerRecsCache = new DailyCycleCache<{
  startups: any[];
  connections: ServiceConnectionItem[];
}>();

export function ExploreStartupsScreen({
  go,
  onSelectStartup,
  onlySaved = false,
}: {
  go: (s: Screen) => void;
  onSelectStartup?: (startup: any) => void;
  onlySaved?: boolean;
}) {
  const sessionInfo = getSession();
  const cacheKey = `${sessionInfo?.providerId ?? sessionInfo?.userId ?? "provider"}|rec`;
  const initialCached = !onlySaved ? providerRecsCache.get(cacheKey) : null;

  const [startups, setStartups] = useState<any[]>(() =>
    initialCached ? initialCached.startups : []
  );
  const [connections, setConnections] = useState<ServiceConnectionItem[]>(() =>
    initialCached ? initialCached.connections : []
  );
  const [contactModalConn, setContactModalConn] = useState<ServiceConnectionItem | null>(null);
  const [filterArea, setFilterArea] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(!initialCached);

  const loadStartups = async (force = false) => {
    const existing = !onlySaved && !force ? providerRecsCache.get(cacheKey) : null;
    if (existing && existing.startups.length > 0) {
      setStartups(existing.startups);
      setConnections(existing.connections);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, conns] = await Promise.all([
        api.getProviderMatchingStartups({ onlySaved }).catch(() => []),
        api.getConnections().catch(() => []),
      ]);
      const safeList = Array.isArray(list) ? list : [];
      const safeConns = Array.isArray(conns) ? conns : [];
      setStartups(safeList);
      setConnections(safeConns);
      if (!onlySaved && safeList.length > 0) {
        providerRecsCache.set(cacheKey, { startups: safeList, connections: safeConns });
      }
    } catch (err) {
      console.error("Erro ao listar startups em Tração:", err);
      setStartups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStartups(false);
  }, [onlySaved]);

  const handleToggleSave = async (startupId: number) => {
    try {
      const res = await api.toggleProviderSavedStartup(startupId);
      setStartups((prev) => {
        const updated = prev.map((st) =>
          (st.startupId ?? st.id) === startupId ? { ...st, saved: res.saved } : st
        );
        return onlySaved ? updated.filter((st) => st.saved) : updated;
      });
    } catch (err) {
      console.error("Erro ao favoritar startup:", err);
    }
  };

  const [planVersion, setPlanVersion] = useState(0);
  const proProvider = isProUser();

  const filtered = startups
    .filter((st) => {
      const oppCat = st.targetCategory || st.category || st.mainArea || st.mainSector || "";
      const matchesArea =
        filterArea === "Todos" ||
        oppCat.toLowerCase().includes(filterArea.toLowerCase()) ||
        (st.startupArea || "").toLowerCase().includes(filterArea.toLowerCase()) ||
        (st.startupSector || "").toLowerCase().includes(filterArea.toLowerCase());
      const matchesSearch =
        !searchQuery.trim() ||
        (st.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.demandTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.openDemandTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.demand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.tags || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.technologies || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.startupName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesArea && matchesSearch;
    })
    .sort((a, b) => {
      const aPro = a.proMember ? 1 : 0;
      const bPro = b.proMember ? 1 : 0;
      if (bPro !== aPro) return bPro - aPro;
      return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    });

  const { visible: visibleStartups, hiddenCount: hiddenStartupsCount, isFree: isFreeProvider } = React.useMemo(() => {
    if (onlySaved) {
      return { visible: filtered, hiddenCount: 0, isFree: false };
    }
    return applyFreeTierFilter(
      filtered,
      (st) => st.matchScore ?? 0,
      3,
      (st, newScore) => ({ ...st, matchScore: newScore })
    );
  }, [filtered, onlySaved, proProvider, planVersion]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          eyebrow={
            onlySaved
              ? "Favoritos do Prestador · Oportunidades Salvas"
              : "Recomendações da IA · Oportunidades de Startups em Tração"
          }
          title={onlySaved ? "Oportunidades salvas" : "Recomendações"}
          description={
            onlySaved
              ? "Oportunidades de demandas técnicas e trabalhos de startups em estágio de Tração que você salvou para acompanhar e enviar proposta."
              : "Oportunidades e demandas técnicas lançadas por startups em estágio de Tração recomendadas pela IA conforme o seu perfil e especialidade."
          }
        />
        {!onlySaved && (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-black shrink-0 ${
            proProvider
              ? "bg-[#111827] text-[#FEC908]"
              : "bg-gray-100 text-gray-700 border border-gray-200"
          }`}>
            <Sparkles size={12} />
            {proProvider ? "Plano Pro · RAG Diário às 08h" : "Plano Free · RAG Semanal às 08h"}
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      {onlySaved ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar oportunidade, demanda ou trabalho salvo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#111827]"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      ) : (
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["Todos", "Saúde", "Finanças", "Logística", "Tecnologia", "Agronegócio", "Educação"].map((area) => (
            <button
              key={area}
              onClick={() => setFilterArea(area)}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                filterArea === area
                  ? "bg-[#111827] text-[#FEC908]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar oportunidade, demanda, startup..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#111827]"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
      )}

      {/* Grid de Oportunidades lançadas por Startups em Tração */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          {onlySaved
            ? "Carregando suas oportunidades e demandas salvas..."
            : "Analisando compatibilidade com oportunidades e demandas técnicas de startups em Tração..."}
        </div>
      ) : visibleStartups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 px-6 text-center space-y-3">
          <p className="text-sm font-extrabold text-[#111827]">
            {onlySaved
              ? searchQuery.trim()
                ? "Nenhuma oportunidade ou demanda salva corresponde à sua busca."
                : "Você ainda não salvou nenhuma oportunidade ou demanda de trabalho."
              : "Nenhuma oportunidade de startup em estágio de Tração encontrada com os filtros selecionados."}
          </p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {onlySaved
              ? "Em Recomendações, clique no ícone de marcador das oportunidades e demandas de startups em Tração para salvá-las na sua lista."
              : "Apenas demandas qualificadas lançadas por startups em estágio de Tração ficam disponíveis para conexão e envio de proposta."}
          </p>
        </div>
      ) : (
        <>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {visibleStartups.map((st) => {
            const oppId = st.id ?? st.opportunityId;
            const startupId = st.startupId ?? st.id;
            const oppTitle =
              st.title ||
              st.demandTitle ||
              st.openDemandTitle ||
              `Demanda Técnica de ${st.startupArea || st.mainArea || "Inovação"}`;
            const issuerName = st.startupName || st.name || "Startup em Tração";
            const issuerLocation = formatCityStateOnly(st.startupLocation || st.location) || "Brasil";
            const oppCategory = st.targetCategory || st.category || st.startupArea || st.mainArea || "Tecnologia";
            
            let demandScope = st.description || st.openDemandDescription || st.demand || "";
            if (!demandScope || demandScope.startsWith("Problema Central:")) {
              if (st.openDemandDescription) {
                demandScope = st.openDemandDescription;
              } else if (st.demand && !st.demand.startsWith("Problema Central:")) {
                demandScope = st.demand;
              } else {
                demandScope = "Oportunidade de prestação de serviços especializados para startup em estágio de Tração.";
              }
            }
            const oppTags = st.tags || st.technologies;

            const stId = st.startupId ?? st.id;
            const existingConn =
              connections.find(
                (c) =>
                  Number(c.startupId) === Number(stId) ||
                  (st.startupId && Number(c.startupId) === Number(st.startupId)) ||
                  (c.startupName && issuerName && c.startupName.toLowerCase().trim() === issuerName.toLowerCase().trim())
              ) ||
              (st.hasConnection
                ? ({
                    id: st.connectionId,
                    status: st.connectionStatus,
                    senderType: st.connectionSenderType,
                    startupId: stId,
                    startupName: issuerName,
                    startupSegment: oppCategory,
                    startupStage: st.startupStage || st.currentStage || "Tração",
                    startupEmail: st.email || st.userEmail,
                    startupPhone: st.phone,
                    startupWebsite: st.website,
                    startupLocation: issuerLocation,
                  } as any)
                : null);

            return (
              <article
                key={oppId}
                className="startin-opp-card flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md overflow-hidden min-w-0 w-full"
              >
                <div>
                  {/* Topo do card: Badges à esquerda, Match grande + Salvar à direita */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {st.proMember && <ProMemberBadge />}
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[10px] font-extrabold text-blue-700">
                        {oppCategory}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-extrabold text-gray-700">
                        {st.startupStage || st.currentStage || "Tração"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-[24px] font-extrabold tracking-[-.06em] text-[#15803d] leading-none">
                          {st.matchScore ?? 0}%
                        </div>
                        <div className="text-[10px] text-[#94a0a8] font-bold">match</div>
                      </div>
                      {oppId && (
                        <button
                          type="button"
                          onClick={() => handleToggleSave(oppId)}
                          title={
                            st.saved
                              ? "Remover das oportunidades salvas"
                              : "Salvar oportunidade / demanda"
                          }
                          className={`rounded-lg p-2 transition ${
                            st.saved
                              ? "bg-[#111827] text-[#FEC908]"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <Bookmark size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Informações da Startup Ofertante */}
                  <div className="mt-3 flex items-center gap-2.5">
                    {st.startupAvatarUrl || st.avatarUrl ? (
                      <img
                        src={st.startupAvatarUrl || st.avatarUrl}
                        alt={issuerName}
                        className="h-8 w-8 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-xs font-black text-[#FEC908]">
                        {getInitials(issuerName)}
                      </div>
                    )}
                    <div className="min-w-0 truncate">
                      <span className="text-[11px] font-bold text-gray-600 truncate block">
                        Startup ofertante: <strong className="text-[#111827]">{issuerName}</strong>
                        {issuerLocation && <span className="text-gray-400 font-normal"> · {issuerLocation}</span>}
                      </span>
                    </div>
                  </div>

                  {/* Título da oportunidade e Descrição do escopo */}
                  <div className="my-3 min-w-0">
                    <h3 className="text-[16px] font-extrabold leading-snug text-[#111827] break-words line-clamp-2">
                      {oppTitle}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[#4b5563] break-words line-clamp-3">
                      {demandScope}
                    </p>
                  </div>

                  {/* Requisitos / Tecnologias */}
                  {oppTags && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#89959e] truncate">
                      <span className="font-bold text-gray-500 shrink-0">Requisitos:</span>
                      <span className="truncate">{oppTags}</span>
                    </div>
                  )}

                  {/* Justificativa da IA com design compacto e polido */}
                  {st.justification && (
                    <p className="mt-3 rounded-xl bg-emerald-50/70 p-2.5 text-[10px] font-semibold text-emerald-950 leading-4 border border-emerald-100/80">
                      {st.justification}
                    </p>
                  )}
                </div>

                {/* Rodapé com link e ações de conexão alinhadas */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f3] pt-4 min-w-0">
                  <button
                    onClick={() => {
                      onSelectStartup?.(st);
                      go("startup-detail");
                    }}
                    className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#111827] hover:underline"
                  >
                    Ver oportunidade <ArrowRight size={13} />
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {existingConn ? (
                      existingConn.status === "ACCEPTED" ? (
                        <>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800">
                            ✓ Conectado
                          </span>
                          <button
                            type="button"
                            onClick={() => setContactModalConn(existingConn)}
                            className="rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
                          >
                            Ver contatos
                          </button>
                        </>
                      ) : existingConn.status === "REJECTED" ? (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 shrink-0">
                          Recusada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => go("connections")}
                          className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-extrabold text-amber-700 hover:bg-amber-100 transition shrink-0"
                        >
                          {existingConn.senderType === "PROVIDER" ? "Aguardando resposta" : "Solicitação recebida"}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          onSelectStartup?.(st);
                          go("request-connection");
                        }}
                        className="rounded-lg bg-[#111827] px-3.5 py-1.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black shrink-0"
                      >
                        {onlySaved ? "Enviar proposta" : "Conectar"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!onlySaved && isFreeProvider && (
          <VerMaisProBanner
            hiddenCount={hiddenStartupsCount}
            contextLabel="oportunidades lançadas por startups em Tração e conexões diretas com startups"
            profileType="PROVIDER"
            onUpgraded={() => setPlanVersion((v) => v + 1)}
          />
        )}
        </>
      )}

      {/* Modal Real de Contatos Liberados */}
      {contactModalConn && (
        <ConnectionContactModal
          conn={contactModalConn}
          onClose={() => setContactModalConn(null)}
          currentRole="PROVIDER"
        />
      )}
    </div>
  );
}

// =========================================================================
// 4. EXPLORAR PRESTADORES DE SERVIÇOS - VISÃO DA STARTUP (100% REAL)
// =========================================================================
export function ExploreProvidersScreen({
  go,
  onSelectProvider,
}: {
  go: (s: Screen) => void;
  onSelectProvider?: (provider: ServiceProviderData) => void;
}) {
  const [providers, setProviders] = useState<ServiceProviderData[]>([]);
  const [connections, setConnections] = useState<ServiceConnectionItem[]>([]);
  const [contactModalConn, setContactModalConn] = useState<ServiceConnectionItem | null>(null);
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviders() {
      try {
        const [list, conns] = await Promise.all([
          api.getProviders().catch(() => []),
          api.getConnections().catch(() => []),
        ]);
        setProviders(Array.isArray(list) ? list : []);
        setConnections(Array.isArray(conns) ? conns : []);
      } catch (err) {
        console.error("Erro ao buscar prestadores:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProviders();
  }, []);

  const dynamicCategories = React.useMemo(() => {
    const base = ["Todos", "Design", "Tecnologia", "Consultoria", "Marketing", "Jurídico", "Financeiro"];
    for (const p of providers) {
      const cat = (p.category || "").trim();
      if (cat && !base.some((b) => b.toLowerCase() === cat.toLowerCase())) {
        base.push(cat);
      }
    }
    return base;
  }, [providers]);

  const [planVersion, setPlanVersion] = useState(0);
  const proStartup = isProUser();

  const filtered = providers.filter((p) => {
    const matchesCat =
      filterCategory === "Todos" ||
      (p.category || "").toLowerCase().includes(filterCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.mainService || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.toolsAndSkills || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const { visible: visibleProviders, hiddenCount: hiddenProvidersCount, isFree: isFreeStartup } = React.useMemo(() => {
    return applyFreeTierFilter(
      filtered,
      (p) => p.matchScore ?? 0,
      3,
      (p, newScore) => ({ ...p, matchScore: newScore })
    );
  }, [filtered, proStartup, planVersion]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          eyebrow="Rede de Especialistas & Squads"
          title="Explorar prestadores de serviços"
          description="Encontre profissionais autônomos e empresas especializadas avaliados pela IA conforme as necessidades da sua startup."
        />
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-black shrink-0 ${
          proStartup
            ? "bg-[#111827] text-[#FEC908]"
            : "bg-gray-100 text-gray-700 border border-gray-200"
        }`}>
          <Sparkles size={12} />
          {proStartup ? "Plano Pro · 100% dos Matches" : "Plano Free · 1 Top Match + 3 Prestadores"}
        </div>
      </div>

      {/* Filtros em Pills e Busca */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                filterCategory === cat
                  ? "bg-[#111827] text-[#FEC908]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Buscar por nome, área, competência..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#111827]"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Grid de Prestadores */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Carregando prestadores...</div>
      ) : visibleProviders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 px-6 text-center text-xs text-gray-500">
          Nenhum prestador de serviço cadastrado com os filtros selecionados.
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleProviders.map((pr) => {
            const avatar = pr.photoUrl || pr.avatarUrl;
            const skillsList = (pr.toolsAndSkills || pr.tags || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div
                key={pr.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
              >
                <div>
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={pr.name}
                          className="h-12 w-12 rounded-xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-sm font-black text-[#FEC908]">
                          {getInitials(pr.name)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-extrabold text-[#111827]">{pr.name}</h3>
                        <span className="text-[10px] font-bold text-gray-400">
                          {pr.providerType === "EMPRESA" ? "Empresa / Agência" : "Profissional Autônomo"}
                        </span>
                      </div>
                    </div>
                    {pr.matchScore != null && (
                      <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-black text-[#15803d]">
                        {pr.matchScore}% Match
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-extrabold text-[#111827]">
                      {pr.category} {pr.mainService ? `· ${pr.mainService}` : ""}
                    </span>
                    {pr.location && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                        <MapPin size={11} /> {formatCityStateOnly(pr.location)}
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-600 line-clamp-3">
                    {pr.description || pr.serviceExperience || "Prestador de serviços cadastrado na plataforma."}
                  </p>

                  {skillsList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {skillsList.slice(0, 4).map((tool, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-gray-50 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 border border-gray-200"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onSelectProvider?.(pr);
                      go("provider-detail");
                    }}
                    className="text-xs font-extrabold text-[#111827] hover:underline shrink-0"
                  >
                    Ver perfil
                  </button>
                  {(() => {
                    const existingConn =
                      connections.find(
                        (c) =>
                          Number(c.providerId) === Number(pr.id) ||
                          (c.providerName && pr.name && c.providerName.toLowerCase().trim() === pr.name.toLowerCase().trim())
                      ) ||
                      (pr.hasConnection
                        ? ({
                            id: pr.connectionId,
                            status: pr.connectionStatus,
                            senderType: pr.connectionSenderType,
                            providerId: pr.id,
                            providerName: pr.name,
                            providerCategory: pr.category,
                            providerMainService: pr.mainService,
                            providerEmail: pr.email,
                            providerPhone: pr.phone,
                            providerPortfolioUrl: pr.portfolioUrl,
                            providerLinkedinUrl: pr.linkedinUrl,
                            providerLocation: pr.location,
                          } as any)
                        : null);

                    if (existingConn) {
                      if (existingConn.status === "ACCEPTED") {
                        return (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800">
                              ✓ Conectado
                            </span>
                            <button
                              type="button"
                              onClick={() => setContactModalConn(existingConn)}
                              className="rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
                            >
                              Ver contatos
                            </button>
                          </div>
                        );
                      }
                      if (existingConn.status === "REJECTED") {
                        return (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 shrink-0">
                            Recusada
                          </span>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => go("connections")}
                          className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-extrabold text-amber-700 hover:bg-amber-100 transition shrink-0"
                        >
                          {existingConn.senderType === "STARTUP" ? "Aguardando resposta" : "Solicitação recebida"}
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => {
                          onSelectProvider?.(pr);
                          go("request-connection");
                        }}
                        className="rounded-lg bg-[#111827] px-3.5 py-1.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black shrink-0"
                      >
                        Conectar
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
        {isFreeStartup && (
          <VerMaisProBanner
            hiddenCount={hiddenProvidersCount}
            contextLabel="prestadores de serviço e especialistas compatíveis com a sua startup em Tração"
            profileType="STARTUP"
            isTraction={true}
            onUpgraded={() => setPlanVersion((v) => v + 1)}
          />
        )}
        </>
      )}

      {/* Modal Real de Contatos Liberados */}
      {contactModalConn && (
        <ConnectionContactModal
          conn={contactModalConn}
          onClose={() => setContactModalConn(null)}
          currentRole="STARTUP"
        />
      )}
    </div>
  );
}

// =========================================================================
// 5. PERFIL DETALHADO DO PRESTADOR (100% REAL DO BANCO E IA)
// =========================================================================
export function ProviderDetailScreen({
  go,
  provider,
  onRequestConnection,
  hideBackButton = false,
}: {
  go: (s: Screen) => void;
  provider?: ServiceProviderData | null;
  onRequestConnection?: () => void;
  hideBackButton?: boolean;
}) {
  const session = getSession();
  const isOwnProviderView = session?.accountType === "PROVIDER";
  const [fullProvider, setFullProvider] = useState<ServiceProviderData | null>(provider || null);
  const [connections, setConnections] = useState<ServiceConnectionItem[]>([]);
  const [contactModalConn, setContactModalConn] = useState<ServiceConnectionItem | null>(null);
  const [loading, setLoading] = useState(!provider);

  useEffect(() => {
    let active = true;
    async function fetchLatest() {
      try {
        if (provider?.id) {
          const [fresh, conns] = await Promise.all([
            api.getProvider(provider.id),
            api.getConnections().catch(() => []),
          ]);
          if (active && fresh) setFullProvider(fresh);
          if (active && Array.isArray(conns)) setConnections(conns);
        } else if (session?.userId && isOwnProviderView) {
          const own = await api.getProviderByUser(session.userId);
          if (active && own) setFullProvider(own);
        }
      } catch {
        // Mantém o objeto passado via prop se houver
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchLatest();
    return () => {
      active = false;
    };
  }, [provider?.id, session?.userId, isOwnProviderView]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-400">
        Carregando dados do prestador...
      </div>
    );
  }

  if (!fullProvider) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <p className="text-sm font-bold text-[#111827]">
          Nenhum perfil de prestador selecionado ou cadastrado.
        </p>
        <button
          onClick={() => go(isOwnProviderView ? "provider-onboarding" : "explore-providers")}
          className="rounded-xl bg-[#111827] px-5 py-2.5 text-xs font-extrabold text-[#FEC908]"
        >
          {isOwnProviderView ? "Preencher meu perfil" : "Voltar para prestadores"}
        </button>
      </div>
    );
  }

  const pr = fullProvider;
  const avatar = pr.photoUrl || pr.avatarUrl;
  const skillsList = (pr.toolsAndSkills || pr.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const reasons = pr.matchReasons || {};
  const reasonSinergia =
    reasons.sinergiaTecnica ||
    reasons.perfil ||
    `Atuação especializada em ${pr.mainService || pr.category}${
      skillsList.length > 0 ? ` com domínio em ${skillsList.slice(0, 4).join(", ")}` : ""
    }.`;
  const reasonModelo =
    reasons.modeloAtuacao ||
    reasons.objetivo ||
    `Disponibilidade (${pr.availability || "Disponível"}) no formato ${
      pr.connectionPreference || "sob demanda / parceria flexível"
    }.`;
  const reasonImpacto =
    reasons.impactoEsperado ||
    reasons.contexto ||
    `Foco em acelerar resultados para startups em Tração${
      pr.interestSectors ? ` nos setores de ${pr.interestSectors}` : ""
    }.`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      {!hideBackButton && !isOwnProviderView && (
        <BackButton onClick={() => go("explore-providers")} label="Voltar para explorar prestadores" />
      )}

      {/* Header do Perfil */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {avatar ? (
              <img
                src={avatar}
                alt={pr.name}
                className="h-20 w-20 rounded-2xl object-cover border border-gray-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#111827] text-2xl font-black text-[#FEC908]">
                {getInitials(pr.name)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-[#111827]">{pr.name}</h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-700 border border-blue-200">
                  {pr.providerType === "EMPRESA" ? "Empresa / Agência" : "Profissional"}
                </span>
              </div>
              <p className="mt-1 text-xs font-bold text-gray-500">
                {pr.mainService ? `${pr.mainService} · ` : ""}
                {pr.category}
                {pr.experienceYears ? ` · ${pr.experienceYears} anos de experiência` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {pr.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {formatCityStateOnly(pr.location)}
                  </span>
                )}
                {pr.availability && (
                  <>
                    {pr.location && <span>•</span>}
                    <span className="font-semibold text-[#15803d]">{pr.availability}</span>
                  </>
                )}
              </div>
              {(pr.portfolioUrl || pr.linkedinUrl) && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {pr.portfolioUrl && (
                    <a
                      href={pr.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#111827] hover:underline"
                    >
                      Portfólio / Website <ExternalLink size={12} />
                    </a>
                  )}
                  {pr.linkedinUrl && (
                    <a
                      href={pr.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0284c7] hover:underline"
                    >
                      LinkedIn <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {pr.matchScore != null && (
              <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#15803d]">
                {pr.matchScore}% de Compatibilidade
              </span>
            )}
            {!isOwnProviderView && (() => {
              const existingConn =
                connections.find((c) => Number(c.providerId) === Number(pr.id)) ||
                (pr.hasConnection
                  ? ({
                      id: pr.connectionId,
                      status: pr.connectionStatus,
                      senderType: pr.connectionSenderType,
                      providerId: pr.id,
                      providerName: pr.name,
                      providerCategory: pr.category,
                      providerMainService: pr.mainService,
                      providerEmail: pr.email,
                      providerPhone: pr.phone,
                      providerPortfolioUrl: pr.portfolioUrl,
                      providerLinkedinUrl: pr.linkedinUrl,
                      providerLocation: pr.location,
                    } as any)
                  : null);

              if (existingConn) {
                if (existingConn.status === "ACCEPTED") {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3.5 py-2 text-xs font-black text-emerald-800">
                        ✓ Conectado
                      </span>
                      <button
                        type="button"
                        onClick={() => setContactModalConn(existingConn)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-5 py-3 text-xs font-extrabold text-[#FEC908] transition hover:bg-black shadow-md"
                      >
                        Ver contatos
                      </button>
                    </div>
                  );
                }
                if (existingConn.status === "REJECTED") {
                  return (
                    <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500">
                      Conexão recusada
                    </span>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => go("connections")}
                    className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-xs font-extrabold text-amber-700 hover:bg-amber-100 transition shadow-xs"
                  >
                    {existingConn.senderType === "STARTUP" ? "Aguardando resposta do prestador" : "Solicitação recebida · Ver conexões"}
                  </button>
                );
              }

              return (
                <button
                  onClick={() => {
                    onRequestConnection?.();
                    go("request-connection");
                  }}
                  className="flex items-center gap-2 rounded-xl bg-[#111827] px-6 py-3 text-xs font-black text-[#FEC908] transition hover:bg-black shadow-md"
                >
                  <Handshake size={16} /> Solicitar conexão
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Seção Sobre, Serviços, Portfólio e Preferências */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-black text-[#111827] mb-3">Sobre o prestador</h2>
            <p className="text-xs leading-6 text-gray-700 whitespace-pre-line">
              {pr.description || "Descrição profissional ainda não informada."}
            </p>
            {pr.serviceExperience && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-black text-[#111827] mb-2">
                  Serviços, Metodologia e Entregas
                </h3>
                <p className="text-xs leading-6 text-gray-600 whitespace-pre-line">
                  {pr.serviceExperience}
                </p>
              </div>
            )}
          </div>

          {/* Case em Destaque / Portfólio */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-black text-[#111827] mb-4">Case em Destaque</h2>
            {pr.projectName || pr.projectDescription ? (
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827]">
                      {pr.projectName || "Projeto em destaque"}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {[pr.projectType, pr.projectYear ? `Ano ${pr.projectYear}` : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {pr.projectLink && (
                      <a
                        href={pr.projectLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-extrabold text-[#111827] hover:underline"
                      >
                        Ver case <ExternalLink size={12} />
                      </a>
                    )}
                    {pr.projectRepoUrl && (
                      <a
                        href={pr.projectRepoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-extrabold text-gray-600 hover:underline"
                      >
                        Repositório <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
                {pr.projectDescription && (
                  <p className="mt-3 text-xs leading-5 text-gray-600 whitespace-pre-line">
                    {pr.projectDescription}
                  </p>
                )}
                {pr.projectTools && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pr.projectTools
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 border border-gray-200"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Nenhum case de portfólio cadastrado ainda.
              </p>
            )}
          </div>

          {/* Preferências de Parceria */}
          {(pr.interestSectors ||
            pr.connectionPreference ||
            pr.opportunitiesSought ||
            pr.interestRegion ||
            pr.communicationLanguage) && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-black text-[#111827] mb-4">
                Preferências de Parceria com Startups em Tração
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {pr.interestSectors && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Setores de interesse
                    </span>
                    <span className="font-semibold text-[#111827]">{pr.interestSectors}</span>
                  </div>
                )}
                {pr.connectionPreference && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Modelo de contratação
                    </span>
                    <span className="font-semibold text-[#111827]">{pr.connectionPreference}</span>
                  </div>
                )}
                {pr.opportunitiesSought && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Oportunidades buscadas
                    </span>
                    <span className="font-semibold text-[#111827]">{pr.opportunitiesSought}</span>
                  </div>
                )}
                {pr.interestRegion && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Região de atendimento
                    </span>
                    <span className="font-semibold text-[#111827]">{pr.interestRegion}</span>
                  </div>
                )}
                {pr.communicationLanguage && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Idiomas
                    </span>
                    <span className="font-semibold text-[#111827]">{pr.communicationLanguage}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Lateral: Ferramentas & Fit de Compatibilidade IA */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-black text-[#111827] mb-3">
              Competências & Ferramentas
            </h2>
            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">{pr.mainService || pr.category}</p>
            )}
          </div>

          {/* Análise Real de Compatibilidade pela IA (01, 02, 03) */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-[#111827]">
              Análise de Compatibilidade (IA)
            </h2>
            {pr.justification && (
              <p className="text-[11px] leading-4 text-gray-600">{pr.justification}</p>
            )}

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <span className="font-extrabold text-emerald-900 block mb-1">
                  01 · Sinergia Técnica
                </span>
                <p className="text-emerald-800 text-[11px] leading-4">{reasonSinergia}</p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                <span className="font-extrabold text-blue-900 block mb-1">
                  02 · Modelo de Atuação
                </span>
                <p className="text-blue-800 text-[11px] leading-4">{reasonModelo}</p>
              </div>

              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
                <span className="font-extrabold text-purple-900 block mb-1">
                  03 · Impacto Esperado
                </span>
                <p className="text-purple-800 text-[11px] leading-4">{reasonImpacto}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {contactModalConn && (
        <ConnectionContactModal
          conn={contactModalConn}
          onClose={() => setContactModalConn(null)}
          currentRole="STARTUP"
        />
      )}
    </div>
  );
}

// =========================================================================
// 6. SOLICITAR CONEXÃO (100% REAL COM BANCO DE DADOS E IA)
// =========================================================================
export function RequestConnectionScreen({
  go,
  provider,
  startup,
  onSent,
}: {
  go: (s: Screen) => void;
  provider?: ServiceProviderData | null;
  startup?: StartupProfileData | null;
  onSent?: (connection: ServiceConnectionItem) => void;
}) {
  const session = getSession();
  const isProviderSender = session?.accountType === "PROVIDER";
  const [resolvedProviderId, setResolvedProviderId] = useState<number | undefined>(
    isProviderSender ? session?.providerId : provider?.id
  );
  const [resolvedStartupId, setResolvedStartupId] = useState<number | undefined>(() => {
    const anySt = startup as any;
    return isProviderSender
      ? anySt?.startupId ?? anySt?.id
      : startup?.id ?? session?.startupProfileId;
  });

  const [message, setMessage] = useState(
    isProviderSender
      ? `Olá! Conheci a startup de vocês na StartIn e acredito que meus serviços podem acelerar suas entregas e metas de Tração. Gostaria de alinhar escopo e disponibilidade!`
      : `Olá, acompanhamos seu perfil na StartIn e temos alto interesse em conectar com você para acelerar as demandas da nossa startup. Gostaríamos de alinhar escopo e disponibilidade!`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function resolveMissingIds() {
      if (isProviderSender && !resolvedProviderId && session?.userId) {
        try {
          const ownPr = await api.getProviderByUser(session.userId);
          if (ownPr?.id) setResolvedProviderId(ownPr.id);
        } catch {}
      }
      if (!isProviderSender && !resolvedStartupId && session?.userId) {
        try {
          const ownSt = await api.getProfileByUser(session.userId);
          if (ownSt?.id) setResolvedStartupId(ownSt.id);
        } catch {}
      }
    }
    resolveMissingIds();
  }, [isProviderSender, resolvedProviderId, resolvedStartupId, session?.userId]);

  const anyStartup = startup as any;
  const targetStartupName: string = isProviderSender
    ? anyStartup?.startupName || anyStartup?.name || "Startup"
    : startup?.name || session?.name || "Startup";
  const targetStartupArea: string =
    anyStartup?.mainArea || anyStartup?.segment || anyStartup?.area || "Inovação";

  const targetProviderName = provider?.name || "Prestador de Serviços";
  const targetProviderCategory = provider?.category || "Serviços Especializados";
  const targetProviderService = provider?.mainService || targetProviderCategory;

  const backScreen: Screen = isProviderSender ? "for-you" : "explore-providers";

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Escreva uma mensagem para a outra parte.");
      return;
    }
    const providerIdToUse = isProviderSender ? resolvedProviderId || session?.userId : provider?.id;
    const startupIdToUse = isProviderSender
      ? resolvedStartupId
      : resolvedStartupId || session?.startupProfileId || session?.userId;

    if (!providerIdToUse || !startupIdToUse) {
      setError(
        isProviderSender
          ? "Selecione uma startup válida na aba Recomendações para enviar a solicitação."
          : "Selecione um prestador válido na tela Explorar Prestadores para enviar a solicitação."
      );
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.createConnection({
        startupId: startupIdToUse,
        providerId: providerIdToUse,
        senderType: isProviderSender ? "PROVIDER" : "STARTUP",
        message,
        matchScore: isProviderSender
          ? anyStartup?.matchScore || 90
          : provider?.matchScore || 90,
      });
      providerRecsCache.clear();
      onSent?.(res);
      go("connection-sent");
    } catch (err: any) {
      setError(err.message || "Erro ao enviar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  const cardName = isProviderSender ? targetStartupName : targetProviderName;
  const cardSubtitle = isProviderSender
    ? `Startup em Tração · ${targetStartupArea}`
    : `${targetProviderCategory} · ${targetProviderService}`;
  const cardMatch = isProviderSender
    ? anyStartup?.matchScore ?? 0
    : provider?.matchScore ?? 0;

  const quickSuggestions = isProviderSender
    ? [
        `Apoio especializado para ${targetStartupArea}`,
        "Atuação sob demanda / Contrato PJ",
        "Disponibilidade imediata para alinhamento",
      ]
    : [
        `Demanda de ${targetProviderCategory} em Tração`,
        `Escopo focado em ${targetProviderService}`,
        "Alinhamento de proposta e disponibilidade",
      ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-8">
      <BackButton onClick={() => go(backScreen)} label="Voltar" />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
        <PageTitle
          eyebrow="Nova Parceria"
          title="Solicitar conexão"
          description={
            isProviderSender
              ? "Apresente seus serviços para a startup. Após a aprovação mútua, os canais de contato serão liberados."
              : "Inicie o contato com o prestador de serviços. Após a aprovação mútua, os canais de contato serão liberados."
          }
        />

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Card de Resumo das Partes */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-xs font-black text-[#FEC908]">
              {getInitials(cardName)}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">{cardName}</h3>
              <p className="text-[11px] text-gray-500">{cardSubtitle}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-black text-[#15803d]">
            {cardMatch}% Match
          </span>
        </div>

        {/* Sugestões rápidas de mensagem contextual */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-[#111827] mb-2">
            {isProviderSender
              ? `Mensagem personalizada para ${targetStartupName}`
              : `Mensagem personalizada para ${targetProviderName}`}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {quickSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage((prev) => `${prev} [Foco: ${sug}]`)}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-200"
              >
                + {sug}
              </button>
            ))}
          </div>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="startin-textarea text-xs transition"
            placeholder="Apresente sua demanda e proposta de valor..."
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(backScreen)}
            className="text-xs font-bold text-gray-500 hover:text-black"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleSend} disabled={loading}>
            {loading ? "Enviando..." : "Enviar solicitação de conexão"} <Send size={15} />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 7. SOLICITAÇÃO ENVIADA COM SUCESSO
// =========================================================================
export function ConnectionSentScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-10 shadow-xs space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-[#15803d]">
          <CheckCircle2 size={36} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#111827]">Solicitação enviada com sucesso!</h1>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            Sua solicitação de conexão foi registrada no banco de dados. Você será notificado assim que houver resposta.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[10px] font-bold text-[#FEC908]">
              1
            </span>
            <p className="text-xs text-gray-700">
              A outra parte recebe uma notificação imediata com seu perfil e a mensagem enviada.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[10px] font-bold text-[#FEC908]">
              2
            </span>
            <p className="text-xs text-gray-700">
              Assim que a conexão for aceita, os canais diretos (e-mail, WhatsApp, LinkedIn e Website) são liberados.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[10px] font-bold text-[#FEC908]">
              3
            </span>
            <p className="text-xs text-gray-700">
              Acompanhe o status em tempo real na aba <strong>Conexões</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => go("connections")}
            className="flex-1 rounded-xl bg-[#111827] py-3 text-xs font-black text-[#FEC908] transition hover:bg-black"
          >
            Ver minhas conexões
          </button>
          <button
            onClick={() =>
              go(getSession()?.accountType === "PROVIDER" ? "for-you" : "explore-providers")
            }
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-xs font-black text-gray-800 transition hover:bg-gray-50"
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 8. GERENCIAR CONEXÕES & SOLICITAÇÕES (COM MODAL DE CONTATOS REAIS DO BANCO)
// =========================================================================
export function ConnectionsScreen({
  go,
  accountType = "STARTUP",
}: {
  go: (s: Screen) => void;
  accountType?: string;
}) {
  const session = getSession();
  const [connections, setConnections] = useState<ServiceConnectionItem[]>([]);
  const [tab, setTab] = useState<"ALL" | "RECEIVED" | "SENT" | "ACCEPTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState("");
  const [contactModalConn, setContactModalConn] = useState<ServiceConnectionItem | null>(null);
  const [profileModalConn, setProfileModalConn] = useState<ServiceConnectionItem | null>(null);
  const [profileModalData, setProfileModalData] = useState<any | null>(null);
  const [loadingProfileModal, setLoadingProfileModal] = useState(false);

  const currentRole = session?.accountType || accountType;

  const handleOpenProfileModal = async (c: ServiceConnectionItem) => {
    setProfileModalConn(c);
    setProfileModalData(null);
    setLoadingProfileModal(true);
    try {
      if (currentRole === "STARTUP") {
        if (c.providerId) {
          const prov = await api.getProvider(c.providerId).catch(() => null);
          setProfileModalData(prov);
        }
      } else {
        if (c.startupId) {
          const st = await api.getProfile(c.startupId).catch(() => null);
          setProfileModalData(st);
        }
      }
    } finally {
      setLoadingProfileModal(false);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.getConnections();
      setConnections(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Erro ao listar conexões:", err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await api.acceptConnection(id);
      setActionNotice("Conexão aceita com sucesso! Os contatos diretos foram liberados.");
      await loadList();
    } catch (err: any) {
      setActionNotice(err.message || "Erro ao aceitar conexão.");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.rejectConnection(id);
      setActionNotice("Solicitação recusada.");
      await loadList();
    } catch (err: any) {
      setActionNotice(err.message || "Erro ao recusar conexão.");
    }
  };

  const handleRemoveConnection = async (id: number) => {
    try {
      await api.deleteConnection(id);
      setConnections((prev) => prev.filter((item) => item.id !== id));
      if (contactModalConn?.id === id) setContactModalConn(null);
      if (profileModalConn?.id === id) setProfileModalConn(null);
      setActionNotice("Conexão removida com sucesso.");
    } catch (err: any) {
      setActionNotice(err.message || "Erro ao remover conexão.");
    }
  };

  const filtered = connections.filter((c) => {
    const isSender =
      (currentRole === "STARTUP" && c.senderType === "STARTUP") ||
      (currentRole === "PROVIDER" && c.senderType === "PROVIDER");

    if (tab === "RECEIVED") return !isSender && c.status === "PENDING";
    if (tab === "SENT") return isSender && c.status === "PENDING";
    if (tab === "ACCEPTED") return c.status === "ACCEPTED";
    return true;
  });

  const receivedCount = connections.filter(
    (c) =>
      ((currentRole === "STARTUP" && c.senderType === "PROVIDER") ||
        (currentRole === "PROVIDER" && c.senderType === "STARTUP")) &&
      c.status === "PENDING"
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <PageTitle
        eyebrow="Gestão de Parcerias"
        title="Conexões & Solicitações"
        description="Gerencie suas solicitações recebidas, enviadas e parcerias ativas integradas ao banco de dados."
      />

      {actionNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice("")} className="text-gray-400 hover:text-black">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs de Filtro */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setTab("ALL")}
          className={`pb-3 px-3 text-xs font-black transition border-b-2 ${
            tab === "ALL"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Todas ({connections.length})
        </button>
        <button
          onClick={() => setTab("RECEIVED")}
          className={`pb-3 px-3 text-xs font-black transition border-b-2 flex items-center gap-1.5 ${
            tab === "RECEIVED"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Recebidas
          {receivedCount > 0 && (
            <span className="rounded-full bg-[#FEC908] px-1.5 py-0.2 text-[10px] font-black text-[#111827]">
              {receivedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("SENT")}
          className={`pb-3 px-3 text-xs font-black transition border-b-2 ${
            tab === "SENT"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Enviadas
        </button>
        <button
          onClick={() => setTab("ACCEPTED")}
          className={`pb-3 px-3 text-xs font-black transition border-b-2 ${
            tab === "ACCEPTED"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Conexões Ativas
        </button>
      </div>

      {/* Lista de Conexões */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Carregando conexões...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
          Nenhuma solicitação encontrada nesta aba.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const isSender =
              (currentRole === "STARTUP" && c.senderType === "STARTUP") ||
              (currentRole === "PROVIDER" && c.senderType === "PROVIDER");
            const otherPartyName = currentRole === "STARTUP" ? c.providerName : c.startupName;
            const otherPartyAvatar =
              currentRole === "STARTUP" ? c.providerAvatarUrl : c.startupAvatarUrl;
            const otherPartySubtitle =
              currentRole === "STARTUP"
                ? [c.providerCategory, c.providerMainService].filter(Boolean).join(" · ") ||
                  "Prestador de Serviço"
                : [c.startupSegment || c.startupMainArea, c.startupStage || "Tração"]
                    .filter(Boolean)
                    .join(" · ") || "Startup";

            return (
              <div
                key={c.id}
                onClick={() => handleOpenProfileModal(c)}
                title="Clique para visualizar o perfil completo"
                className="cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {otherPartyAvatar ? (
                    <img
                      src={otherPartyAvatar}
                      alt={otherPartyName}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-sm font-black text-[#FEC908]">
                      {getInitials(otherPartyName)}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[#111827] group-hover:underline">
                        {otherPartyName}
                      </h3>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">
                        {otherPartySubtitle}
                      </span>
                      <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[9px] font-black text-[#15803d]">
                        {c.matchScore ?? 0}% Match
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-600 max-w-xl italic">
                      "{c.message}"
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{isSender ? "Enviada por você" : "Recebida"}</span>
                      <span>•</span>
                      <span>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "Recente"}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#111827] underline">
                        Clique para ver perfil
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status e Ações Contextuais */}
                <div
                  className="flex flex-wrap items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {c.status === "ACCEPTED" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        ✓ Conexão Ativa
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactModalConn(c);
                        }}
                        className="rounded-xl bg-[#111827] px-3.5 py-1.5 text-xs font-extrabold text-[#FEC908] hover:bg-black"
                      >
                        Ver contatos
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(c.id);
                        }}
                        title="Remover conexão"
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Remover conexão
                      </button>
                    </div>
                  ) : c.status === "REJECTED" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                        Recusada
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(c.id);
                        }}
                        title="Remover conexão"
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Remover conexão
                      </button>
                    </div>
                  ) : isSender ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-200">
                        Aguardando resposta
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(c.id);
                        }}
                        title="Cancelar / Remover solicitação de conexão"
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Remover conexão
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(c.id);
                        }}
                        className="rounded-xl bg-[#111827] px-4 py-2 text-xs font-black text-[#FEC908] transition hover:bg-black"
                      >
                        Aceitar conexão
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(c.id);
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-600 hover:bg-gray-50 hover:text-red-600"
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(c.id);
                        }}
                        title="Remover solicitação de conexão"
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Real de Contatos Liberados da Conexão Ativa */}
      {contactModalConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                  ✓ Parceria Confirmada · Contatos Liberados
                </span>
                <h3 className="mt-2 text-lg font-black text-[#111827]">
                  {currentRole === "STARTUP"
                    ? contactModalConn.providerName
                    : contactModalConn.startupName}
                </h3>
                <p className="text-xs text-gray-500">
                  {currentRole === "STARTUP"
                    ? [contactModalConn.providerCategory, contactModalConn.providerMainService]
                        .filter(Boolean)
                        .join(" · ")
                    : [contactModalConn.startupSegment, contactModalConn.startupStage || "Tração"]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              </div>
              <button
                onClick={() => setContactModalConn(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 space-y-3 text-xs">
              {(() => {
                const isSt = currentRole === "STARTUP";
                const email = isSt
                  ? contactModalConn.providerEmail
                  : contactModalConn.startupEmail;
                const phone = isSt
                  ? contactModalConn.providerPhone
                  : contactModalConn.startupPhone;
                const loc = isSt
                  ? contactModalConn.providerLocation
                  : contactModalConn.startupLocation;
                const web = isSt
                  ? contactModalConn.providerPortfolioUrl
                  : contactModalConn.startupWebsite;
                const linkedin = isSt ? contactModalConn.providerLinkedinUrl : undefined;
                const cleanDigits = (phone || "").replace(/\D/g, "");

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-500 flex items-center gap-1.5">
                        <Mail size={14} /> E-mail:
                      </span>
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          className="font-extrabold text-[#111827] hover:underline"
                        >
                          {email}
                        </a>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-500 flex items-center gap-1.5">
                        <Phone size={14} /> Telefone / WhatsApp:
                      </span>
                      {phone ? (
                        <a
                          href={
                            cleanDigits.length >= 10
                              ? `https://wa.me/${cleanDigits.startsWith("55") ? cleanDigits : "55" + cleanDigits}`
                              : `tel:${phone}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-extrabold text-[#15803d] hover:underline"
                        >
                          {phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </div>

                    {loc && (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-500 flex items-center gap-1.5">
                          <MapPin size={14} /> Localização:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatCityStateOnly(loc)}
                        </span>
                      </div>
                    )}

                    {web && (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-500 flex items-center gap-1.5">
                          <ExternalLink size={14} /> Website / Portfólio:
                        </span>
                        <a
                          href={web}
                          target="_blank"
                          rel="noreferrer"
                          className="font-extrabold text-[#111827] hover:underline truncate max-w-[200px]"
                        >
                          {web}
                        </a>
                      </div>
                    )}

                    {linkedin && (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-500 flex items-center gap-1.5">
                          <ExternalLink size={14} /> LinkedIn:
                        </span>
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="font-extrabold text-[#0284c7] hover:underline truncate max-w-[200px]"
                        >
                          Abrir LinkedIn
                        </a>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleRemoveConnection(contactModalConn.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Remover conexão
              </button>
              <button
                onClick={() => setContactModalConn(null)}
                className="rounded-xl bg-[#111827] px-5 py-2.5 text-xs font-black text-[#FEC908] hover:bg-black"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Box com o Perfil Completo ao Clicar no Bloco da Conexão */}
      {profileModalConn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setProfileModalConn(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-2xl space-y-6"
          >
            {(() => {
              const isViewingProvider = currentRole === "STARTUP";
              const name = isViewingProvider
                ? profileModalData?.name || profileModalConn.providerName || "Prestador de Serviços"
                : profileModalData?.name || profileModalConn.startupName || "Startup";
              const avatar = isViewingProvider
                ? profileModalData?.photoUrl ||
                  profileModalData?.avatarUrl ||
                  profileModalConn.providerAvatarUrl
                : profileModalData?.avatarUrl || profileModalConn.startupAvatarUrl;
              const subtitle = isViewingProvider
                ? [
                    profileModalData?.category || profileModalConn.providerCategory,
                    profileModalData?.mainService || profileModalConn.providerMainService,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Prestador de Serviços"
                : [
                    profileModalData?.mainArea ||
                      profileModalData?.mainSector ||
                      profileModalConn.startupSegment ||
                      profileModalConn.startupMainArea,
                    `Estágio ${profileModalData?.currentStage || profileModalConn.startupStage || "Tração"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ");
              const location = isViewingProvider
                ? profileModalData?.location || profileModalConn.providerLocation
                : profileModalData?.location ||
                  profileModalData?.operationRegion ||
                  profileModalConn.startupLocation;
              const description = isViewingProvider
                ? profileModalData?.description ||
                  profileModalData?.serviceExperience ||
                  "Prestador qualificado na plataforma StartIn."
                : profileModalData?.problem ||
                  profileModalData?.description ||
                  "Startup em estágio de Tração na plataforma StartIn.";
              const rawTags = isViewingProvider
                ? profileModalData?.toolsAndSkills || profileModalData?.tags || ""
                : profileModalData?.technologies || profileModalData?.areasOfInterest || "";
              const tagsList = String(rawTags)
                .split(/[,•]/)
                .map((t) => t.trim())
                .filter(Boolean);

              return (
                <>
                  {/* Cabeçalho do Perfil */}
                  <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                    <div className="flex items-start gap-4">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#111827] text-lg font-black text-[#FEC908]">
                          {getInitials(name)}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#111827] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#FEC908]">
                            {isViewingProvider
                              ? profileModalData?.providerType === "EMPRESA"
                                ? "Empresa / Software House"
                                : "Prestador de Serviços"
                              : `Startup em ${profileModalData?.currentStage || "Tração"}`}
                          </span>
                          <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-black text-[#15803d]">
                            {profileModalConn.matchScore ?? 0}% Match
                          </span>
                          {!isViewingProvider && profileModalData?.trlScore && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                              TRL {profileModalData.trlScore}/9
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1.5 text-xl font-black text-[#111827]">{name}</h3>
                        <p className="text-xs font-semibold text-gray-500">{subtitle}</p>
                        {location && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                            <MapPin size={12} /> {formatCityStateOnly(location) || location}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProfileModalConn(null)}
                      className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {loadingProfileModal ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      Carregando informações completas do perfil...
                    </div>
                  ) : (
                    <div className="space-y-5 text-xs">
                      {/* Descrição / Bio / Problema Resolvido */}
                      <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                          {isViewingProvider
                            ? "Sobre o Prestador & Atuação Profissional"
                            : "Sobre a Startup & Solução em Tração"}
                        </span>
                        <p className="text-xs leading-5 text-gray-700 whitespace-pre-line">
                          {description}
                        </p>
                        {isViewingProvider &&
                          profileModalData?.serviceExperience &&
                          profileModalData.serviceExperience !== description && (
                            <p className="pt-2 border-t border-gray-200/70 text-xs leading-5 text-gray-600 whitespace-pre-line">
                              {profileModalData.serviceExperience}
                            </p>
                          )}
                      </div>

                      {/* Mensagem da Solicitação de Conexão */}
                      {profileModalConn.message && (
                        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                            Mensagem da Solicitação de Conexão
                          </span>
                          <p className="text-xs italic text-gray-700">
                            "{profileModalConn.message}"
                          </p>
                        </div>
                      )}

                      {/* Competências / Tecnologias */}
                      {tagsList.length > 0 && (
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                            {isViewingProvider
                              ? "Competências & Ferramentas"
                              : "Tecnologias & Áreas de Interesse"}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {tagsList.map((tag, idx) => (
                              <span
                                key={idx}
                                className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-[#111827]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detalhes adicionais específicos */}
                      {isViewingProvider ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-gray-100 p-4">
                          {profileModalData?.availability && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                Disponibilidade
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {profileModalData.availability}
                              </span>
                            </div>
                          )}
                          {profileModalData?.experienceYears && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                Experiência
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {profileModalData.experienceYears} anos
                              </span>
                            </div>
                          )}
                          {profileModalData?.connectionPreference && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                Modelo de contratação
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {profileModalData.connectionPreference}
                              </span>
                            </div>
                          )}
                          {profileModalData?.projectName && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                Case em Destaque
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {profileModalData.projectName}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-gray-100 p-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">
                              Estágio Validado
                            </span>
                            <span className="font-semibold text-[#111827]">
                              {profileModalData?.currentStage || "Tração"}
                            </span>
                          </div>
                          {profileModalData?.cnpj && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                CNPJ
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {profileModalData.cnpj}
                              </span>
                            </div>
                          )}
                          {profileModalData?.website && (
                            <div className="sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                Website
                              </span>
                              <a
                                href={profileModalData.website}
                                target="_blank"
                                rel="noreferrer"
                                className="font-extrabold text-[#111827] hover:underline"
                              >
                                {profileModalData.website}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rodapé do Modal de Perfil */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {profileModalConn.status === "ACCEPTED" && (
                        <button
                          type="button"
                          onClick={() => {
                            const conn = profileModalConn;
                            setProfileModalConn(null);
                            setContactModalConn(conn);
                          }}
                          className="rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-extrabold text-[#FEC908] hover:bg-black"
                        >
                          Ver contatos
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveConnection(profileModalConn.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Remover conexão
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileModalConn(null)}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Fechar perfil
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 9. STARTUP TRACIONADA: DEMANDAS PARA PRESTADORES DE SERVIÇOS (`my-service-demands`)
// =========================================================================
export function StartupServiceDemandsScreen({
  go,
  onEditDemand,
}: {
  go: (s: Screen) => void;
  onEditDemand?: (item: OpportunityItem) => void;
}) {
  const session = getSession();
  const startupId = session?.startupProfileId || session?.userId;
  const [demands, setDemands] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const proStartup = isProUser();

  useEffect(() => {
    async function loadDemands() {
      if (!startupId) {
        setLoading(false);
        return;
      }
      try {
        const list = await api.getOpportunities("Serviços", undefined, undefined, startupId);
        setDemands(list);
      } catch (err) {
        console.error("Erro ao carregar demandas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDemands();
  }, [startupId, planVersion]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[.18em] text-[#FEC908] bg-[#111827] px-2.5 py-1 rounded-md">
            Módulo de Tração · Contratação de Especialistas
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-[-.05em] text-[#111827]">
            Demandas Técnicas para Prestadores
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            Publique demandas de desenvolvimento, design e squads para prestadores e software houses qualificadas (limite de até {proStartup ? 15 : 5} oportunidades por mês).
          </p>
        </div>

        <button
          onClick={() => go("create-service-demand")}
          className="flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-2.5 text-xs font-black text-[#FEC908] transition hover:bg-black shadow-sm"
        >
          <Plus size={15} /> Nova Demanda de Serviço
        </button>
      </div>

      {/* Barra de status de visibilidade e limite mensal */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#dfe5ea] bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {proStartup ? (
            <ProMemberBadge />
          ) : (
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase text-gray-700">
              Plano Free · Menor Visibilidade
            </span>
          )}
          <span className="text-xs font-semibold text-[#334155]">
            {proStartup
              ? "Suas oportunidades são impulsionadas para a frente da vitrine dos prestadores com o selo Pro Member."
              : "No Plano Free suas oportunidades têm menos visibilidade e ficam atrás das startups Pro."}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 text-[11px] font-extrabold text-[#111827]">
            {demands.length} / {proStartup ? 15 : 5} oportunidades no mês
          </span>
          {!proStartup && (
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="rounded-lg bg-[#111827] px-3.5 py-1.5 text-[11px] font-black text-[#FEC908] transition hover:bg-black"
            >
              Impulsionar com Pro (R$ 30/mês)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Carregando suas demandas...</div>
      ) : demands.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-[#111827]">
            <Briefcase size={28} />
          </div>
          <h3 className="text-base font-black text-[#111827]">Nenhuma demanda publicada ainda</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Sua startup tracionada pode lançar demandas específicas de tecnologia, UI/UX ou squads dedicados
            para receber propostas diretas de prestadores qualificados.
          </p>
          <button
            onClick={() => go("create-service-demand")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-2.5 text-xs font-black text-[#FEC908] hover:bg-black"
          >
            <Plus size={15} /> Lançar primeira demanda
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {demands.map((d) => (
            <div
              key={d.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {(proStartup || d.proMember) && <ProMemberBadge compact />}
                  <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[9px] font-black uppercase">
                    {d.targetCategory || "Tecnologia"}
                  </span>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                    {d.status || "Publicada"}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-extrabold text-[#111827]">{d.title}</h3>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2 max-w-2xl">{d.description}</p>
                {d.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.tags.split(",").map((t, idx) => (
                      <span key={idx} className="rounded bg-gray-50 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500 border border-gray-100">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onEditDemand?.(d);
                    go("edit-service-demand");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[#111827] hover:bg-gray-50"
                >
                  <Pencil size={13} className="inline mr-1" /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpgradeModal && (
        <ProUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          profileType="STARTUP"
          isTraction={true}
          onUpgraded={() => setPlanVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}

// =========================================================================
// 10. CRIAR / EDITAR DEMANDA DE SERVIÇO PELA STARTUP TRACIONADA
// =========================================================================
export function CreateServiceDemandScreen({
  go,
  existingDemand,
}: {
  go: (s: Screen) => void;
  existingDemand?: OpportunityItem | null;
}) {
  const session = getSession();
  const startupId = session?.startupProfileId || session?.userId;
  const startupName = session?.name || "Startup";

  const [title, setTitle] = useState(existingDemand?.title || "");
  const initialTargetCat = existingDemand?.targetCategory || "Tecnologia";
  const [targetCategory, setTargetCategory] = useState(initialTargetCat);
  const [isCustomTargetCategory, setIsCustomTargetCategory] = useState(
    Boolean(initialTargetCat && !PRESET_PROVIDER_CATEGORIES.includes(initialTargetCat))
  );
  const [description, setDescription] = useState(existingDemand?.description || "");
  const [tags, setTags] = useState(existingDemand?.tags || "");
  const [meta, setMeta] = useState(existingDemand?.meta || "");
  const [loading, setLoading] = useState(false);
  const [enhancingAi, setEnhancingAi] = useState(false);
  const [aiEnhancedNotice, setAiEnhancedNotice] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const [error, setError] = useState("");
  const proStartup = isProUser();

  const handleEnhanceDemandWithAi = async () => {
    if (!proStartup) {
      setShowUpgradeModal(true);
      return;
    }
    const raw = description.trim();
    if (raw.length < 10) {
      setError("Escreva ao menos um rascunho breve do escopo antes de melhorar com a IA.");
      return;
    }
    setError("");
    setEnhancingAi(true);
    try {
      const res = await api.enhanceProblemAI({
        text: raw,
        area: targetCategory,
        stage: "Tração",
      });
      if (res.enhancedText) {
        setDescription(res.enhancedText);
      }
      if (Array.isArray(res.tags) && res.tags.length > 0 && !tags.trim()) {
        setTags(res.tags.join(", "));
      }
      setAiEnhancedNotice("Escopo aprimorado pela IA e requisitos extraídos automaticamente!");
    } catch {
      setError("Não foi possível aprimorar o texto com a IA no momento.");
    } finally {
      setEnhancingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Preencha o título e o escopo da demanda.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (existingDemand?.id) {
        await api.updateOpportunity(existingDemand.id, {
          title,
          description,
          tags,
          meta,
          targetCategory,
          type: "SERVICO",
          startupId,
        });
      } else {
        await api.createOpportunity({
          type: "SERVICO",
          title,
          description,
          tags,
          meta,
          targetCategory,
          startupId,
          startupName,
          status: "Publicada",
        });
      }
      go("my-service-demands");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar demanda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-8">
      <BackButton onClick={() => go("my-service-demands")} label="Voltar para demandas" />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
        <PageTitle
          eyebrow="Contratação Técnica"
          title={existingDemand ? "Editar demanda de serviço" : "Lançar demanda de serviço"}
          description="Especifique os entregáveis técnicos para que prestadores compatíveis possam enviar propostas."
        />

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Field
            label="Título da Demanda"
            placeholder="Ex: Desenvolvimento de App Mobile Flutter ou Design System"
            value={title}
            onChange={setTitle}
          />

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-2">
              Categoria Alvo do Prestador
            </label>
            {isCustomTargetCategory ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  placeholder="Digite a categoria alvo da demanda..."
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="startin-input pr-24 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomTargetCategory(false);
                    setTargetCategory("Tecnologia");
                  }}
                  className="absolute right-1.5 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-[#111827] transition hover:bg-gray-200"
                  title="Voltar para a lista de categorias"
                >
                  Ver lista <ChevronDown size={12} />
                </button>
              </div>
            ) : (
              <select
                value={targetCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "OUTRO") {
                    setIsCustomTargetCategory(true);
                    if (PRESET_PROVIDER_CATEGORIES.includes(targetCategory)) {
                      setTargetCategory("");
                    }
                  } else {
                    setIsCustomTargetCategory(false);
                    setTargetCategory(val);
                  }
                }}
                className="startin-input text-xs"
              >
                <option value="Tecnologia">Tecnologia (Desenvolvimento / Software)</option>
                <option value="Design">Design (UX/UI, Design System)</option>
                <option value="Marketing">Marketing & Aquisição</option>
                <option value="Consultoria">Consultoria Técnica / Negócios</option>
                <option value="Jurídico">Jurídico & Compliance</option>
                <option value="Financeiro">Financeiro & Captação</option>
                <option value="OUTRO">Outro:</option>
              </select>
            )}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#111827]">
                Escopo Detalhado e Entregáveis
              </span>
              {proStartup ? (
                <button
                  type="button"
                  disabled={enhancingAi}
                  onClick={handleEnhanceDemandWithAi}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-1 text-[11px] font-extrabold text-[#FEC908] transition hover:bg-black disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  {enhancingAi ? "Melhorando com IA..." : "Melhorar texto com a IA (Plano Pro)"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#FEC908] bg-[#fffbeb] px-3.5 py-1 text-[11px] font-extrabold text-[#92400e] transition hover:bg-[#fef3c7]"
                >
                  <Sparkles size={12} />
                  Melhorar com IA bloqueado no Plano Free · Assinar Pro (R$ 30/mês)
                </button>
              )}
            </div>
            <textarea
              rows={5}
              placeholder="Descreva as funcionalidades necessárias, critérios de aceite, arquitetura esperada e prazos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="startin-textarea text-xs transition"
            />
            {aiEnhancedNotice && (
              <p className="mt-1.5 text-[11px] font-bold text-[#15803d]">
                {aiEnhancedNotice}
              </p>
            )}
            <div className="mt-2 rounded-xl border border-gray-200 bg-[#f8fafc] p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
              <span>
                {proStartup
                  ? "Sua demanda receberá o selo Pro Member, será impulsionada na frente para os prestadores e seu limite é de até 15 oportunidades/mês."
                  : "No Plano Free, oportunidades têm menos visibilidade e limite de até 5 oportunidades/mês."}
              </span>
              {proStartup && <ProMemberBadge compact />}
            </div>
          </div>

          <Field
            label="Tecnologias e Competências Requeridas (tags separadas por vírgula)"
            placeholder="Ex: Flutter, Firebase, APIs REST, Clean Architecture"
            value={tags}
            onChange={setTags}
          />

          <Field
            label="Modelo e Formato de Contratação"
            placeholder="Ex: Contrato PJ · 3 meses · Dedicação 20h/semana"
            value={meta}
            onChange={setMeta}
          />

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => go("my-service-demands")}
              className="text-xs font-bold text-gray-500 hover:text-black"
            >
              Cancelar
            </button>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Salvando..." : existingDemand ? "Atualizar Demanda" : "Publicar Demanda"}{" "}
              <Check size={16} />
            </PrimaryButton>
          </div>
        </form>
      </div>

      {showUpgradeModal && (
        <ProUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          profileType="STARTUP"
          isTraction={true}
          onUpgraded={() => setPlanVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}

// =========================================================================
// 11. MEU PERFIL DO PRESTADOR (`provider-profile`) — ESTRUTURA PADRÃO EDITÁVEL
// =========================================================================
const SUGGESTED_PROVIDER_SKILLS: Record<string, string[]> = {
  Design: ["Figma", "Design System", "UX Research", "Prototipagem", "UI Design", "Branding", "Design Sprint"],
  Tecnologia: ["React", "Node.js", "TypeScript", "Python", "Java / Spring Boot", "AWS / Cloud", "APIs REST", "Arquitetura SaaS"],
  Marketing: ["Google Ads", "Meta Ads", "Gestão de Redes Sociais", "Estratégia de Conteúdo", "SEO & Copywriting", "Análise de Dados", "CRM & Funil B2B"],
  Consultoria: ["Product Discovery", "OKRs & Roadmap", "Go-To-Market", "Modelagem de Negócios", "Processos Ágeis", "Vendas B2B"],
  Jurídico: ["LGPD & Compliance", "Contratos SaaS", "Propriedade Intelectual", "Societário & Mútuo Conversível", "Termos de Uso"],
  Financeiro: ["Valuation & Captação", "Modelagem Financeira", "DRE & Fluxo de Caixa", "BPO Financeiro", "Unit Economics (CAC/LTV)"],
  default: ["Gestão de Projetos", "Sprints Ágeis", "Consultoria Técnica", "Inovação para Startups", "Análise de Métricas"],
};

export function ProviderProfileScreen({
  go,
  onProviderUpdated,
}: {
  go: (s: Screen) => void;
  onProviderUpdated?: (p: ServiceProviderData) => void;
}) {
  const session = getSession();
  const [form, setForm] = useState<ServiceProviderData>({
    id: session?.providerId,
    userId: session?.userId,
    name: session?.name || "",
    email: session?.email || "",
    phone: session?.phone || "",
    providerType: "PROFISSIONAL",
    category: "Design",
    photoUrl: session?.avatarUrl || "",
    description: "",
    location: "",
    portfolioUrl: "",
    linkedinUrl: "",
    availability: "Disponível imediatamente",
    mainService: "",
    serviceExperience: "",
    toolsAndSkills: "",
    complementaryCategory: "",
    targetSegment: "",
    experienceYears: "",
    projectName: "",
    projectLink: "",
    projectDescription: "",
    projectYear: "2026",
    projectRepoUrl: "",
    projectTools: "",
    projectType: "",
    interestSectors: "",
    connectionPreference: "",
    opportunitiesSought: "",
    interestRegion: "",
    communicationLanguage: "Português",
    tags: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("Design");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [accCnpj, setAccCnpj] = useState<string>(formatCNPJ(session?.cnpj || ""));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [aiError, setAiError] = useState("");
  const [enhancingBio, setEnhancingBio] = useState(false);
  const [enhancingProject, setEnhancingProject] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [aiExtractedTags, setAiExtractedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const effectiveCategory =
    selectedCategory === "Outro"
      ? customCategory.trim() || "Serviços Especializados"
      : selectedCategory;

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        let pr: ServiceProviderData | null = null;
        if (session?.providerId) {
          pr = await api.getProvider(session.providerId).catch(() => null);
        }
        if (!pr && session?.userId) {
          pr = await api.getProviderByUser(session.userId).catch(() => null);
        }
        if (session?.userId) {
          const u = await api.getUserInfo(session.userId).catch(() => null);
          if (u?.cnpj) {
            setAccCnpj(formatCNPJ(u.cnpj));
          }
        }
        if (pr) {
          setForm((prev) => ({
            ...prev,
            ...pr,
            email: pr.email || session?.email || prev.email,
            phone: formatPhoneBR(pr.phone || session?.phone || prev.phone || ""),
            photoUrl: pr.photoUrl || (pr as any).avatarUrl || session?.avatarUrl || prev.photoUrl,
          }));
          if (pr.category) {
            if (PRESET_PROVIDER_CATEGORIES.includes(pr.category)) {
              setSelectedCategory(pr.category);
              setCustomCategory("");
            } else {
              setSelectedCategory("Outro");
              setCustomCategory(pr.category);
            }
          }
          if ((pr.description && pr.description.length > 30) || (pr.serviceExperience && pr.serviceExperience.length > 30)) {
            setAiEnhanced(true);
          }
          const rawSkills = pr.toolsAndSkills || pr.tags || "";
          if (rawSkills) {
            const parsed = rawSkills
              .split(/[,•]/)
              .map((t) => t.trim())
              .filter(Boolean);
            setAiExtractedTags(parsed);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar perfil do prestador:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [session?.userId, session?.providerId]);

  const setField = (key: keyof ServiceProviderData) => (val: string) => {
    if (key === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhoneBR(val) }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const activeSkillsList = React.useMemo(() => {
    const raw = form.toolsAndSkills || form.tags || "";
    if (!raw) return [];
    return raw
      .split(/[,•]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [form.toolsAndSkills, form.tags]);

  const suggestedSkills = React.useMemo(() => {
    return SUGGESTED_PROVIDER_SKILLS[effectiveCategory] || SUGGESTED_PROVIDER_SKILLS.default;
  }, [effectiveCategory]);

  const allMergedSkills = React.useMemo(() => {
    const list = [...suggestedSkills];
    activeSkillsList.forEach((skill) => {
      if (!list.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        list.push(skill);
      }
    });
    return list;
  }, [suggestedSkills, activeSkillsList]);

  const updateSkillsField = (updated: string[]) => {
    const joined = updated.join(", ");
    setForm((prev) => ({
      ...prev,
      toolsAndSkills: joined,
      tags: joined,
    }));
  };

  const handleToggleSkill = (skill: string) => {
    const exists = activeSkillsList.some((s) => s.toLowerCase() === skill.toLowerCase());
    const updated = exists
      ? activeSkillsList.filter((s) => s.toLowerCase() !== skill.toLowerCase())
      : [...activeSkillsList, skill];
    updateSkillsField(updated);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = activeSkillsList.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase());
    updateSkillsField(updated);
  };

  const handleAddCustomSkill = () => {
    const clean = customTagInput.trim();
    if (!clean) return;
    if (!activeSkillsList.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      updateSkillsField([...activeSkillsList, clean]);
    }
    setCustomTagInput("");
  };

  const handleEnhanceBioWithAI = async () => {
    setAiError("");
    const rawText = (form.description || form.serviceExperience || "").trim();
    if (rawText.length < 10) {
      setAiError("Escreva ao menos uma breve descrição da sua atuação profissional antes de melhorar com a IA.");
      return;
    }
    setEnhancingBio(true);
    try {
      const res = await api.enhanceProviderServicesAI({
        text: rawText,
        category: effectiveCategory,
        providerName: form.name,
        mainService: form.mainService || "",
        providerType: form.providerType,
        fieldType: "bio",
      });
      const extracted =
        Array.isArray(res.tags) && res.tags.length > 0
          ? res.tags
          : (res.toolsAndSkills || res.technologies || "")
              .split(/[,•]/)
              .map((t) => t.trim())
              .filter(Boolean);
      if (extracted.length > 0) {
        setAiExtractedTags(extracted);
      }
      const combinedSkills = Array.from(new Set([...extracted, ...activeSkillsList]));
      setForm((prev) => ({
        ...prev,
        category: effectiveCategory,
        description: res.enhancedText || prev.description,
        mainService: prev.mainService || res.mainService || prev.mainService,
        toolsAndSkills: combinedSkills.length > 0 ? combinedSkills.join(", ") : prev.toolsAndSkills,
        tags: combinedSkills.length > 0 ? combinedSkills.join(", ") : prev.tags,
      }));
      setAiEnhanced(true);
      setSavedNotice("Descrição profissional estruturada em 1ª pessoa pela IA! Competências atualizadas.");
      setTimeout(() => setSavedNotice(""), 4500);
    } catch (err: any) {
      setAiError(err.message || "Falha ao melhorar a descrição com a IA.");
    } finally {
      setEnhancingBio(false);
    }
  };

  const handleEnhanceProjectWithAI = async () => {
    setAiError("");
    const rawText = (form.projectDescription || "").trim();
    if (rawText.length < 10) {
      setAiError("Descreva brevemente o case ou projeto no campo do portfólio antes de melhorar com a IA.");
      return;
    }
    setEnhancingProject(true);
    try {
      const res = await api.enhanceProviderServicesAI({
        text: rawText,
        category: effectiveCategory,
        providerName: form.name,
        mainService: form.projectName || form.mainService || "",
        providerType: form.providerType,
        fieldType: "project",
      });
      const extractedTools = res.toolsAndSkills || res.technologies || "";
      setForm((prev) => ({
        ...prev,
        projectDescription: res.enhancedText || prev.projectDescription,
        projectTools: prev.projectTools || extractedTools || prev.projectTools,
      }));
      setSavedNotice("Case do portfólio estruturado pela IA!");
      setTimeout(() => setSavedNotice(""), 4000);
    } catch (err: any) {
      setAiError(err.message || "Falha ao estruturar o projeto com a IA.");
    } finally {
      setEnhancingProject(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setForm((prev) => ({ ...prev, photoUrl: dataUrl, avatarUrl: dataUrl } as ServiceProviderData));
      const current = getSession();
      if (current) {
        saveSession({ ...current, avatarUrl: dataUrl });
      }
      try {
        if (session?.userId) {
          await api.updateUser(session.userId, { avatarUrl: dataUrl }).catch(() => {});
        }
        const targetId = form.id || session?.providerId;
        if (targetId) {
          const updated = await api.updateProvider(targetId, {
            ...form,
            category: effectiveCategory,
            photoUrl: dataUrl,
            avatarUrl: dataUrl,
          });
          setForm((prev) => ({ ...prev, ...updated, photoUrl: dataUrl }));
          onProviderUpdated?.(updated);
          setSavedNotice("Foto de perfil atualizada com sucesso!");
          setTimeout(() => setSavedNotice(""), 3500);
        }
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSavedNotice("");
    setAiError("");
    if (!isValidCNPJ(accCnpj)) {
      setAiError(
        "Informe um CNPJ autêntico e válido com exatos 14 dígitos (00.000.000/0000-00). A plataforma opera exclusivamente com CNPJ."
      );
      return;
    }
    if (form.phone && !isValidPhoneBR(form.phone)) {
      setAiError("Informe um telefone/celular autêntico com DDD válido, ex: (81) 99999-9999.");
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      setAiError("Informe um endereço de e-mail válido.");
      return;
    }
    setSaving(true);
    try {
      const resolvedPhoto = form.photoUrl || (form as any).avatarUrl || "";
      const payload: Partial<ServiceProviderData> = {
        ...form,
        userId: session?.userId,
        category: effectiveCategory,
        photoUrl: resolvedPhoto,
        avatarUrl: resolvedPhoto,
        location: formatCityStateOnly(form.location || "") || form.location,
        experienceYears: String(form.experienceYears ?? "4") as any,
      };

      if (session?.userId) {
        await api
          .updateUser(session.userId, {
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            cnpj: accCnpj,
            avatarUrl: resolvedPhoto,
          })
          .catch(() => {});
      }

      const targetId = form.id || session?.providerId;
      const saved = targetId
        ? await api.updateProvider(targetId, payload)
        : await api.createProvider(payload);

      setForm((prev) => ({ ...prev, ...saved }));
      onProviderUpdated?.(saved);

      const current = getSession();
      if (current) {
        saveSession({
          ...current,
          providerId: saved.id || current.providerId,
          name: saved.name || current.name,
          cnpj: accCnpj || current.cnpj,
          phone: saved.phone || payload.phone || current.phone,
          avatarUrl: saved.photoUrl || resolvedPhoto || current.avatarUrl,
        });
      }

      setSavedNotice("Perfil de prestador atualizado com sucesso no banco de dados!");
      setTimeout(() => setSavedNotice(""), 4000);
    } catch (err: any) {
      setAiError(err.message || "Não foi possível salvar as alterações no momento.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-400">Carregando seu perfil...</div>;
  }

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Meu perfil (Conta & Atuação Profissional)"
        description="Mantenha seus dados profissionais, CNPJ, especialidades, descrição estruturada com IA, portfólio e preferências de parceria atualizados para o matchmaking com startups em Tração."
      />

      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        {savedNotice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] px-4 py-3 text-xs font-bold text-[#166d48]">
            <span>{savedNotice}</span>
            <button type="button" onClick={() => setSavedNotice("")}>
              <X size={14} />
            </button>
          </div>
        )}

        {aiError && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            <span>{aiError}</span>
            <button type="button" onClick={() => setAiError("")}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Foto de perfil do Prestador */}
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#edf0f2] pb-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="relative">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt={form.name}
                  className="h-16 w-16 rounded-full border-2 border-[#111827] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111827] text-lg font-extrabold text-[#FEC908]">
                  {getInitials(form.name || "Prestador")}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#111827] text-[#FEC908] shadow transition hover:bg-black"
                title="Alterar foto de perfil"
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#111827]">
                  {form.name || "Foto de Perfil / Logotipo"}
                </h3>
                {isProUser() && <VerifiedProBadge size={18} />}
              </div>
              <p className="mt-1 text-xs text-[#768692]">
                Exibida para startups em Tração na vitrine de prestadores e na barra superior da plataforma.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d6e0e7] bg-[#f8fafc] px-4 py-2.5 text-xs font-bold text-[#111827] transition hover:bg-[#eaf2f8] sm:self-auto"
          >
            <Camera size={14} />
            {form.photoUrl ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
          </button>
        </div>

        {/* Dados Cadastrais e Identidade Profissional */}
        <h2 className="text-base font-extrabold text-[#111827]">
          Dados Cadastrais e Identidade Profissional
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Nome completo ou Razão Social"
            value={form.name}
            onChange={setField("name")}
          />

          {/* Tipo de Prestador */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#203754]">
              Tipo de prestador
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "PROFISSIONAL", label: "Profissional / Freelancer" },
                { id: "EMPRESA", label: "Empresa / Agência / Software House" },
              ].map((t) => {
                const active = (form.providerType || "PROFISSIONAL") === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        providerType: t.id as "PROFISSIONAL" | "EMPRESA",
                      }))
                    }
                    className={`h-11 rounded-lg border px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      active
                        ? "border-[#111827] bg-[#111827] text-[#FEC908]"
                        : "border-[#d9e1e7] bg-white text-[#111827] hover:bg-gray-50"
                    }`}
                  >
                    {active && <Check size={13} />}
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoria Principal de Atuação com opção Outro */}
          <div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#203754]">
                Categoria principal de atuação
              </span>
              {selectedCategory === "Outro" ? (
                <div className="relative flex items-center">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Digite sua área ou função principal..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="h-11 w-full rounded-lg border border-[#111827] bg-white pl-3 pr-24 text-xs font-semibold text-[#111827] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(PRESET_PROVIDER_CATEGORIES[0]);
                      setCustomCategory("");
                    }}
                    className="absolute right-1.5 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-[#111827] transition hover:bg-gray-200"
                  >
                    Ver lista <ChevronDown size={12} />
                  </button>
                </div>
              ) : (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#d9e1e7] bg-white px-3 text-xs font-semibold text-[#111827] outline-none focus:border-[#111827]"
                >
                  <option value="Design">Design (UI/UX, Produto, Branding)</option>
                  <option value="Tecnologia">Tecnologia (Desenvolvimento Full Stack, Mobile, DevOps)</option>
                  <option value="Marketing">Marketing & Growth</option>
                  <option value="Consultoria">Consultoria de Negócios & Produto</option>
                  <option value="Jurídico">Jurídico & Compliance</option>
                  <option value="Financeiro">Financeiro & Captação</option>
                  <option value="Outro">Outro:</option>
                </select>
              )}
            </label>
          </div>

          {/* Disponibilidade */}
          <div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#203754]">
                Disponibilidade para novos projetos
              </span>
              <select
                value={form.availability || "Disponível imediatamente"}
                onChange={(e) => setField("availability")(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#d9e1e7] bg-white px-3 text-xs font-semibold text-[#111827] outline-none focus:border-[#111827]"
              >
                <option value="Disponível imediatamente">Disponível imediatamente</option>
                <option value="Disponível em até 15 dias">Disponível em até 15 dias</option>
                <option value="Agenda parcial (part-time)">Agenda parcial (part-time)</option>
                <option value="Apenas projetos pontuais">Apenas projetos pontuais</option>
              </select>
            </label>
          </div>

          <Field
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            value={accCnpj}
            onChange={(v) => setAccCnpj(formatCNPJ(v))}
          />
          <LocationField
            label="Localização (Cidade, UF)"
            placeholder="Recife, PE"
            value={form.location || ""}
            onChange={setField("location")}
          />
          <Field
            label="Telefone / WhatsApp de contato"
            placeholder="(00) 90000-0000"
            value={form.phone || ""}
            onChange={setField("phone")}
          />
          <Field
            label="E-mail de contato"
            placeholder="seuemail@dominio.com"
            value={form.email || ""}
            onChange={setField("email")}
          />
          <Field
            label="Portfólio / Website"
            placeholder="https://meuportfolio.com"
            value={form.portfolioUrl || ""}
            onChange={setField("portfolioUrl")}
          />
          <Field
            label="LinkedIn"
            placeholder="https://linkedin.com/in/usuario"
            value={form.linkedinUrl || ""}
            onChange={setField("linkedinUrl")}
          />
          <Field
            label="Serviço principal oferecido"
            placeholder="Ex: Gestão de Tráfego e Growth, Desenvolvimento Full Stack, Design de Produto..."
            value={form.mainService || ""}
            onChange={setField("mainService")}
          />
          <Field
            label="Tempo de experiência (anos)"
            placeholder="Ex: 4"
            value={String(form.experienceYears || "")}
            onChange={setField("experienceYears")}
          />
          <Field
            label="Segmento / Nicho de especialidade"
            placeholder="Ex: SaaS B2B, Fintechs, Healthtechs, E-commerce..."
            value={form.targetSegment || ""}
            onChange={setField("targetSegment")}
          />

          {/* =====================================================================
              DESCRIÇÃO PROFISSIONAL & EXPERIÊNCIA COM IA (MESMA ESTRUTURA DOS OUTROS PERFIS)
          ===================================================================== */}
          <div className="md:col-span-2 mt-3 pt-6 border-t border-[#edf0f2]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#203754]">
                Descrição profissional e experiência em serviços (estruturada em 1ª pessoa para o matchmaking da IA)
              </span>
              {aiEnhanced ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f7ee] px-3 py-1 text-[11px] font-bold text-[#166d48]">
                  <Check size={12} /> Descrição estruturada pela IA para o matchmaking
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6d6] px-3 py-1 text-[11px] font-bold text-[#854d0e]">
                  <Sparkles size={12} /> Estruturação com IA recomendada
                </span>
              )}
            </div>

            <textarea
              rows={6}
              placeholder="Descreva com suas palavras como você trabalha, quais serviços entrega, quais ferramentas domina e como ajuda startups a escalar..."
              value={form.description || ""}
              onChange={(e) => setField("description")(e.target.value)}
              className="w-full rounded-xl border border-[#d9e1e7] bg-[#fcfdfe] p-4 text-xs leading-6 text-[#111827] outline-none transition focus:border-[#111827]"
            />

            <div className="mt-3">
              <AiPromptTutorialGuide role="provider" />
            </div>

            <div className="mt-3 flex flex-col justify-between gap-3 rounded-xl border border-[#e3e8ee] bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
              <div className="text-xs leading-5 text-[#5b6b79]">
                A IA lê suas informações e aprimora o texto em 1ª pessoa, extraindo automaticamente suas competências para o cálculo de compatibilidade.
              </div>
              <button
                type="button"
                disabled={enhancingBio}
                onClick={handleEnhanceBioWithAI}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3 text-xs font-extrabold text-[#FEC908] shadow-sm transition hover:bg-black disabled:opacity-60"
              >
                <Sparkles size={15} />
                {enhancingBio
                  ? "Estruturando descrição com IA..."
                  : aiEnhanced
                  ? "Reestruturar descrição com IA"
                  : "Melhorar descrição com IA"}
              </button>
            </div>

            {aiExtractedTags.length > 0 && (
              <div className="mt-3.5 rounded-xl border border-[#dce6ef] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Competências e ferramentas identificadas no seu perfil:
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

          {/* =====================================================================
              COMPETÊNCIAS, FERRAMENTAS E TECNOLOGIAS (TAGS DE MATCHMAKING)
          ===================================================================== */}
          <div className="md:col-span-2 mt-4 pt-6 border-t border-[#edf0f2]">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Competências & Ferramentas (Tags de Matchmaking)
                </h3>
                <p className="mt-1 text-xs text-[#768692]">
                  Essas competências definem o pilar técnico (30%) de compatibilidade com as demandas das startups em Tração.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#111827]">
                {activeSkillsList.length} competências ativas
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold text-[#50697f]">
                Competências sugeridas para {effectiveCategory} (clique para ativar/desativar):
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {allMergedSkills.map((skill) => {
                  const isSelected = activeSkillsList.some(
                    (s) => s.toLowerCase() === skill.toLowerCase()
                  );
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#111827] text-[#FEC908] shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                      <span>{skill}</span>
                      {isSelected && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSkill(skill);
                          }}
                          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20 transition"
                          title="Remover competência"
                        >
                          <X size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 flex max-w-md items-center gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddCustomSkill())
                  }
                  placeholder="Adicionar competência ou ferramenta (ex: Figma, Google Ads, React)..."
                  className="h-9 flex-1 rounded-lg border border-[#d9e1e7] bg-white px-3 text-xs outline-none focus:border-[#111827]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-3.5 text-xs font-bold text-white transition hover:bg-black"
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* =====================================================================
              PORTFÓLIO & CASE DE DESTAQUE
          ===================================================================== */}
          <div className="md:col-span-2 mt-4 pt-6 border-t border-[#edf0f2]">
            <h3 className="text-sm font-extrabold text-[#111827]">
              Case ou Projeto de Destaque (Portfólio)
            </h3>
            <p className="mt-1 text-xs text-[#768692]">
              Apresente um projeto real entregue para aumentar sua pontuação de portfólio nas recomendações.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Nome do projeto ou case"
                placeholder="Ex: Crescimento e Aquisição para Fintech B2B"
                value={form.projectName || ""}
                onChange={setField("projectName")}
              />
              <Field
                label="Tipo de entrega"
                placeholder="Ex: Campanha Growth, MVP SaaS, Redesign UX/UI..."
                value={form.projectType || ""}
                onChange={setField("projectType")}
              />
              <Field
                label="Link do projeto / estudo de caso"
                placeholder="https://..."
                value={form.projectLink || ""}
                onChange={setField("projectLink")}
              />
              <Field
                label="Ferramentas / Tecnologias usadas no projeto"
                placeholder="Ex: Meta Ads, Google Analytics, Figma, React..."
                value={form.projectTools || ""}
                onChange={setField("projectTools")}
              />
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#203754]">
                    Descrição e resultados alcançados no projeto
                  </span>
                  <button
                    type="button"
                    disabled={enhancingProject}
                    onClick={handleEnhanceProjectWithAI}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-[11px] font-extrabold text-[#FEC908] transition hover:bg-black disabled:opacity-50"
                  >
                    <Sparkles size={12} />
                    {enhancingProject ? "Estruturando case..." : "Melhorar case com IA"}
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Descreva o desafio do cliente, o que foi executado e os resultados obtidos..."
                  value={form.projectDescription || ""}
                  onChange={(e) => setField("projectDescription")(e.target.value)}
                  className="w-full rounded-xl border border-[#d9e1e7] bg-[#fcfdfe] p-3.5 text-xs leading-6 text-[#111827] outline-none transition focus:border-[#111827]"
                />
              </div>
            </div>
          </div>

          {/* =====================================================================
              PREFERÊNCIAS DE PARCERIA COM STARTUPS EM TRAÇÃO
          ===================================================================== */}
          <div className="md:col-span-2 mt-4 pt-6 border-t border-[#edf0f2]">
            <h3 className="text-sm font-extrabold text-[#111827]">
              Preferências de Parceria com Startups em Tração
            </h3>
            <p className="mt-1 text-xs text-[#768692]">
              Defina os setores e formatos de contratação que você prioriza atender.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Setores de maior interesse"
                placeholder="Ex: Fintech, Healthtech, SaaS B2B, Varejo..."
                value={form.interestSectors || ""}
                onChange={setField("interestSectors")}
              />
              <Field
                label="Modelo de conexão / contratação preferido"
                placeholder="Ex: Contrato PJ, Projeto Fechado, Squad / Sprints, Consultoria..."
                value={form.connectionPreference || ""}
                onChange={setField("connectionPreference")}
              />
              <Field
                label="Oportunidades buscadas"
                placeholder="Ex: Demandas imediatas, Parcerias contínuas, Escala de produto..."
                value={form.opportunitiesSought || ""}
                onChange={setField("opportunitiesSought")}
              />
              <Field
                label="Região de interesse para atendimento"
                placeholder="Ex: Remoto / Brasil, Recife, São Paulo..."
                value={form.interestRegion || ""}
                onChange={setField("interestRegion")}
              />
              <div className="md:col-span-2">
                <Field
                  label="Idiomas de comunicação"
                  placeholder="Ex: Português, Inglês, Espanhol"
                  value={form.communicationLanguage || ""}
                  onChange={setField("communicationLanguage")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9 flex justify-end border-t border-[#edf0f2] pt-6">
          <PrimaryButton disabled={saving} onClick={handleSave}>
            {saving ? "Salvando alterações..." : "Salvar perfil de prestador"} <Check size={16} />
          </PrimaryButton>
        </div>
      </section>
    </>
  );
}

// =========================================================================
// 12. DETALHE DA STARTUP - VISÃO DO PRESTADOR (100% REAL COM BANCO E IA)
// =========================================================================
export function ProviderStartupDetailScreen({
  go,
  startup,
}: {
  go: (s: Screen) => void;
  startup?: any;
}) {
  const startupId: number | undefined = startup?.startupId ?? startup?.id;
  const [full, setFull] = useState<StartupProfileData | null>(null);
  const [demands, setDemands] = useState<OpportunityItem[]>([]);
  const [connections, setConnections] = useState<ServiceConnectionItem[]>([]);
  const [contactModalConn, setContactModalConn] = useState<ServiceConnectionItem | null>(null);
  const [saved, setSaved] = useState<boolean>(Boolean(startup?.saved));

  useEffect(() => {
    setSaved(Boolean(startup?.saved));
    if (!startupId) return;
    api.getProfile(startupId).then(setFull).catch(() => {});
    api
      .getOpportunities("Serviços", undefined, undefined, startupId)
      .then((list) => setDemands(Array.isArray(list) ? list : []))
      .catch(() => setDemands([]));
    api.getConnections().then((conns) => setConnections(Array.isArray(conns) ? conns : [])).catch(() => {});
  }, [startupId, startup?.saved]);

  const handleToggleSave = async () => {
    if (!startupId) return;
    try {
      const res = await api.toggleProviderSavedStartup(startupId);
      setSaved(res.saved);
    } catch {}
  };

  const name = full?.name || startup?.startupName || startup?.name || "Startup";
  const area = full?.mainArea || startup?.mainArea || startup?.segment || startup?.area || "Inovação";
  const location = formatCityStateOnly(full?.location || startup?.location) || "Brasil";
  const stage = full?.currentStage || startup?.currentStage || "Tração";
  const description = full?.description || startup?.description || "";
  const problem = full?.problem || startup?.problem || "";
  const howItWorks = full?.howItWorks || startup?.howItWorks || "";
  const mainObjective = full?.mainObjective || startup?.mainObjective || "";
  const techs = full?.technologies || startup?.technologies || "";
  const website = full?.website || startup?.website || "";
  const avatarUrl = full?.avatarUrl || startup?.avatarUrl;
  const match = startup?.matchScore ?? 0;
  const justification = startup?.justification;
  const reasons = startup?.reasons || {};

  const oppTitle = startup?.title || startup?.demandTitle || startup?.openDemandTitle;
  const isOpportunityView = Boolean(oppTitle && oppTitle !== name);
  const oppDescription = startup?.description || startup?.openDemandDescription || startup?.demand;
  const oppTags = startup?.tags || startup?.technologies;
  const oppCategory = startup?.targetCategory || startup?.category || area;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8">
      <BackButton onClick={() => go("for-you")} label="Voltar para recomendações" />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover border border-gray-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#111827] text-2xl font-black text-[#FEC908]">
                {getInitials(name)}
              </div>
            )}
            <div>
              {isOpportunityView ? (
                <>
                  <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-700 border border-blue-200 mb-1">
                    Demanda de Trabalho · Tração
                  </span>
                  <h1 className="text-2xl font-black text-[#111827]">{oppTitle}</h1>
                  <p className="mt-1 text-xs font-bold text-gray-600">
                    Lançada por <span className="text-[#111827] font-black">{name}</span> · {oppCategory}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-[#111827]">{name}</h1>
                  <p className="mt-1 text-xs font-bold text-gray-500">{area}</p>
                </>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {location}
                </span>
                <span>•</span>
                <span className="rounded-md bg-[#111827] px-2 py-0.5 text-[9px] font-black uppercase text-[#FEC908]">
                  {stage}
                </span>
                {website && (
                  <>
                    <span>•</span>
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-[#111827] hover:underline"
                    >
                      Website <ExternalLink size={11} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#15803d]">
              {match}% de Compatibilidade (IA)
            </span>
            <div className="flex items-center gap-2">
              {startupId && (
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-extrabold transition ${
                    saved
                      ? "border-[#111827] bg-[#111827] text-[#FEC908]"
                      : "border-gray-300 bg-white text-[#111827] hover:bg-gray-50"
                  }`}
                >
                  <Bookmark size={14} /> {saved ? "Salva" : "Salvar"}
                </button>
              )}
              {(() => {
                const existingConn =
                  connections.find(
                    (c) =>
                      Number(c.startupId) === Number(startupId) ||
                      (c.startupName && name && c.startupName.toLowerCase().trim() === name.toLowerCase().trim())
                  ) ||
                  (startup?.hasConnection
                    ? ({
                        id: startup.connectionId,
                        status: startup.connectionStatus,
                        senderType: startup.connectionSenderType,
                        startupId: startupId,
                        startupName: name,
                        startupSegment: area,
                        startupStage: stage,
                        startupEmail: full?.userEmail || startup?.email,
                        startupPhone: full?.phone || startup?.phone,
                        startupWebsite: website,
                        startupLocation: location,
                      } as any)
                    : null);

                if (existingConn) {
                  if (existingConn.status === "ACCEPTED") {
                    return (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3.5 py-2 text-xs font-black text-emerald-800">
                          ✓ Conectado
                        </span>
                        <button
                          type="button"
                          onClick={() => setContactModalConn(existingConn)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-5 py-3 text-xs font-extrabold text-[#FEC908] transition hover:bg-black shadow-md"
                        >
                          Ver contatos
                        </button>
                      </div>
                    );
                  }
                  if (existingConn.status === "REJECTED") {
                    return (
                      <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500">
                        Conexão recusada
                      </span>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => go("connections")}
                      className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-xs font-extrabold text-amber-700 hover:bg-amber-100 transition shadow-xs"
                    >
                      {existingConn.senderType === "PROVIDER" ? "Aguardando resposta da startup" : "Solicitação recebida · Ver conexões"}
                    </button>
                  );
                }

                return (
                  <button
                    onClick={() => go("request-connection")}
                    className="flex items-center gap-2 rounded-xl bg-[#111827] px-6 py-3 text-xs font-black text-[#FEC908] transition hover:bg-black shadow-md"
                  >
                    <Handshake size={16} /> Solicitar conexão
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {isOpportunityView && (
        <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
            <Briefcase size={15} /> Escopo e Requisitos da Oportunidade
          </div>
          <p className="text-base font-black text-[#111827]">{oppTitle}</p>
          <p className="text-xs leading-6 text-gray-800 whitespace-pre-line">
            {oppDescription || "Demanda técnica especializada para atuação junto à startup em estágio de Tração."}
          </p>
          {oppTags && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requisitos / Tags:</span>
              {oppTags.split(",").map((t: string) => t.trim()).filter(Boolean).map((t: string, idx: number) => (
                <span key={idx} className="rounded-md bg-white border border-blue-200 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-950">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {justification && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
            <Sparkles size={15} /> Análise de Compatibilidade da IA StartIn
          </div>
          <p className="text-xs leading-5 text-emerald-950 font-semibold">{justification}</p>
          {(reasons.sinergiaTecnica || reasons.modeloAtuacao || reasons.impactoEsperado) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {reasons.sinergiaTecnica && (
                <div className="rounded-xl bg-white p-3 border border-emerald-100">
                  <span className="text-[10px] font-black uppercase text-emerald-900 block mb-1">
                    01 · Sinergia Técnica
                  </span>
                  <p className="text-[11px] text-gray-700 leading-4">{reasons.sinergiaTecnica}</p>
                </div>
              )}
              {reasons.modeloAtuacao && (
                <div className="rounded-xl bg-white p-3 border border-blue-100">
                  <span className="text-[10px] font-black uppercase text-blue-900 block mb-1">
                    02 · Modelo de Atuação
                  </span>
                  <p className="text-[11px] text-gray-700 leading-4">{reasons.modeloAtuacao}</p>
                </div>
              )}
              {reasons.impactoEsperado && (
                <div className="rounded-xl bg-white p-3 border border-purple-100">
                  <span className="text-[10px] font-black uppercase text-purple-900 block mb-1">
                    03 · Impacto Esperado
                  </span>
                  <p className="text-[11px] text-gray-700 leading-4">{reasons.impactoEsperado}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-black text-[#111827] mb-2">Sobre a startup</h2>
          <p className="text-xs leading-6 text-gray-700 whitespace-pre-line">
            {description || problem || "Startup em estágio de Tração cadastrada na StartIn."}
          </p>
        </div>

        {problem && problem !== description && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-black text-[#111827] mb-1">Problema e Solução</h3>
            <p className="text-xs leading-5 text-gray-600 whitespace-pre-line">{problem}</p>
          </div>
        )}

        {howItWorks && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-black text-[#111827] mb-1">Como funciona</h3>
            <p className="text-xs leading-5 text-gray-600 whitespace-pre-line">{howItWorks}</p>
          </div>
        )}

        {mainObjective && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-black text-[#111827] mb-1">Objetivo de Tração</h3>
            <p className="text-xs leading-5 text-gray-600 whitespace-pre-line">{mainObjective}</p>
          </div>
        )}

        {techs && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-black text-[#111827] mb-2">Stack e Tecnologias</h3>
            <div className="flex flex-wrap gap-1.5">
              {techs
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
                .map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800"
                  >
                    {t}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-black text-[#111827] mb-3">Demandas abertas para prestadores</h2>
        {demands.length === 0 ? (
          <p className="text-xs text-gray-500">
            Esta startup não possui demandas pontuais abertas no momento, mas está disponível para receber propostas diretas de conexão.
          </p>
        ) : (
          <div className="space-y-3">
            {demands.map((d) => (
              <div key={d.id} className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[9px] font-black uppercase">
                    {d.targetCategory || "Tecnologia"}
                  </span>
                  {d.meta && <span className="text-[10px] text-gray-400">{d.meta}</span>}
                </div>
                <h3 className="mt-2 text-sm font-extrabold text-[#111827]">{d.title}</h3>
                <p className="mt-1 text-xs text-gray-600">{d.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {contactModalConn && (
        <ConnectionContactModal
          conn={contactModalConn}
          onClose={() => setContactModalConn(null)}
          currentRole="PROVIDER"
        />
      )}
    </div>
  );
}
