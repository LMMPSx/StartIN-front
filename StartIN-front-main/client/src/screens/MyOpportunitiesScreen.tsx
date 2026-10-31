import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Heart,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Rocket,
  Search,
  Sparkles,
} from "@/icons";
import { BackButton, Field, PageTitle, PrimaryButton, TextAreaField } from "@/components/startin/CommonUI";
import {
  api,
  getSession,
  saveSession,
  type CompanyMatchItem,
  type CompanyProfileData,
  type OpportunityItem,
  type StartupMatchItem,
} from "@/lib/api";
import type { Screen } from "@/types/startin";
import { formatOppType, getBadgeColorByType, getInitials } from "@/utils/formatters";

type SortOption = "match-desc" | "match-asc" | "name-asc" | "name-desc";

// ==========================================
// 1. Minhas Oportunidades (Fluxo Empresa)
// ==========================================
export function MyOpportunities({
  go,
  onSelectOpportunity,
  onEditOpportunity,
}: {
  go: (s: Screen) => void;
  onSelectOpportunity?: (o: OpportunityItem) => void;
  onEditOpportunity?: (o: OpportunityItem) => void;
}) {
  const [opps, setOpps] = useState<OpportunityItem[]>([]);
  const session = getSession();

  useEffect(() => {
    api
      .getOpportunities(undefined, undefined, session?.companyId)
      .then((res) => {
        if (res.length > 0) {
          setOpps(res);
        } else {
          return api.getOpportunities().then((all) => {
            const corporate = all.filter((o) => {
              const t = formatOppType(o.type);
              return t === "POC" || t === "Primeira Compra" || t === "Compra";
            });
            setOpps(corporate);
          });
        }
      })
      .catch(() => {});
  }, [session?.companyId]);

  const publishedCount = opps.filter((o) => !o.status || o.status === "PUBLICADA").length;
  const reviewCount = opps.filter((o) => o.status === "EM_ANALISE").length;
  const closedCount = opps.filter((o) => o.status === "ENCERRADA").length;

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Lançar oportunidades"
        description="Publique e edite oportunidades corporativas de POC, Primeira Compra ou Compra para atrair startups compatíveis."
        action={
          <PrimaryButton onClick={() => go("create-opportunity")}>
            <Plus size={15} /> Nova POC / Compra
          </PrimaryButton>
        }
      />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <h2 className="text-sm font-extrabold text-[#123b62]">Resumo das oportunidades</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            [String(publishedCount), "publicadas"],
            [String(reviewCount), "em análise"],
            [String(closedCount), "encerradas"],
          ].map(([n, t], i) => (
            <div
              key={t}
              className={`rounded-xl p-5 ${
                i === 0 ? "bg-[#111827] text-white" : "bg-[#f3f6f8] text-[#294b68]"
              }`}
            >
              <div className="text-2xl font-extrabold">{n}</div>
              <div className="mt-1 text-xs font-semibold opacity-80">{t}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#123b62]">
            POCs e Compras lançadas pela empresa
          </h2>
          <span className="text-[11px] text-[#7c8993]">Clique em um item para editar</span>
        </div>
        <div className="mt-4 space-y-3">
          {opps.length > 0 ? (
            opps.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  if (onEditOpportunity) {
                    onEditOpportunity(o);
                    go("edit-opportunity");
                  } else {
                    onSelectOpportunity?.(o);
                    go("edit-opportunity");
                  }
                }}
                className="group min-w-0 overflow-hidden cursor-pointer rounded-xl border border-transparent bg-[#f7f9fa] p-5 transition hover:border-[#111827] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${getBadgeColorByType(
                          o.type,
                          o.color
                        )}`}
                      >
                        {formatOppType(o.type)}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#18734d]">
                        {o.status === "ENCERRADA"
                          ? "Encerrada"
                          : o.status === "EM_ANALISE"
                          ? "Em análise"
                          : "Publicada"}
                      </span>
                      <p className="text-sm font-extrabold text-[#111827] break-words [overflow-wrap:anywhere]">
                        {o.title}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-[#788791] break-words [overflow-wrap:anywhere]">
                      {o.shortDescription || o.short || o.description}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#111827] shadow-2xs group-hover:bg-[#111827] group-hover:text-[#FEC908]">
                    <Pencil size={12} /> Editar
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(o.tags || "IA • SaaS • B2B • Dados")
                    .split(/[•,]/)
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((x) => (
                      <span
                        key={x}
                        className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#52708a]"
                      >
                        {x}
                      </span>
                    ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#d9e0e5] py-10 text-center">
              <p className="text-xs font-bold text-[#234666]">
                Nenhuma POC ou Compra lançada ainda
              </p>
              <div className="mt-4 flex justify-center">
                <PrimaryButton onClick={() => go("create-opportunity")}>
                  <Plus size={14} /> Criar primeira POC / Compra
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ==========================================
// 2. Formulário de Criação e Edição de POC / Primeira Compra / Compra
// ==========================================
export function CreateForm({
  go,
  opportunity = false,
  editingOpportunity = null,
  onNotificationTrigger,
}: {
  go: (s: Screen) => void;
  opportunity?: boolean;
  editingOpportunity?: OpportunityItem | null;
  onNotificationTrigger?: () => void;
}) {
  const isEditing = Boolean(editingOpportunity && editingOpportunity.id);
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState(editingOpportunity?.title || "");
  const [description, setDescription] = useState(editingOpportunity?.description || "");
  const [meta, setMeta] = useState(
    editingOpportunity?.meta || editingOpportunity?.metaInfo || "Aberta · Brasil · Remoto"
  );
  const [status, setStatus] = useState(editingOpportunity?.status || "PUBLICADA");
  const [selectedType, setSelectedType] = useState(() =>
    editingOpportunity ? formatOppType(editingOpportunity.type) : "POC"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (editingOpportunity?.tags) {
      const parsed = editingOpportunity.tags
        .split(/[•,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return ["IA", "SaaS", "B2B", "Dados"];
  });
  const [saving, setSaving] = useState(false);
  const session = getSession();

  useEffect(() => {
    if (editingOpportunity) {
      setTitle(editingOpportunity.title || "");
      setDescription(editingOpportunity.description || "");
      setMeta(
        editingOpportunity.meta || editingOpportunity.metaInfo || "Aberta · Brasil · Remoto"
      );
      setStatus(editingOpportunity.status || "PUBLICADA");
      setSelectedType(formatOppType(editingOpportunity.type));
      if (editingOpportunity.tags) {
        const parsed = editingOpportunity.tags
          .split(/[•,]/)
          .map((t) => t.trim())
          .filter(Boolean);
        if (parsed.length > 0) setSelectedTags(parsed);
      }
      setPublished(false);
    }
  }, [editingOpportunity]);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toBackendType = (label: string) => {
    if (label === "Primeira Compra") return "PRIMEIRA_COMPRA";
    if (label === "Compra") return "COMPRA";
    return "POC";
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      if (isEditing && editingOpportunity) {
        await api.updateOpportunity(editingOpportunity.id, {
          type: toBackendType(selectedType),
          title: title || editingOpportunity.title,
          description: description || editingOpportunity.description,
          tags: selectedTags.join(" • "),
          meta: meta || "Aberta · Brasil · Remoto",
          status,
          companyId: editingOpportunity.companyId || session?.companyId,
        });
      } else if (opportunity) {
        await api.createOpportunity({
          type: toBackendType(selectedType),
          title: title || `${selectedType} — Desafio Corporativo de Inovação`,
          description:
            description || "Programa corporativo de inovação aberta e contratação tecnológica.",
          tags: selectedTags.join(" • "),
          meta: meta || "Aberta · Brasil · Remoto",
          status: "PUBLICADA",
          companyId: session?.companyId,
          companyName: session?.name,
        });
      } else {
        await api.createCompany({
          name: title || session?.name || "Empresa Alpha",
          type: selectedType,
          description: "",
          demands: description || "Organização parceira na StartIn.",
          tags: selectedTags.join(", "),
        });
      }
      onNotificationTrigger?.();
    } catch {
      // ignora erro local se ocorrer
    } finally {
      setSaving(false);
      setPublished(true);
    }
  };

  if (published) {
    return (
      <div className="mx-auto max-w-[680px] py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]">
          <Check size={30} strokeWidth={3} />
        </div>
        <h1 className="mt-7 text-[30px] font-extrabold tracking-[-.05em] text-[#111827]">
          {isEditing
            ? "Oportunidade atualizada!"
            : opportunity
            ? "Oportunidade lançada!"
            : "Empresa cadastrada!"}
        </h1>
        <p className="mt-3 text-sm text-[#73818c]">
          {isEditing
            ? "As alterações da sua POC / Compra foram salvas no banco de dados e já refletem para as startups compatíveis."
            : "Sua demanda corporativa foi publicada com sucesso e já está visível para startups do estágio correspondente."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryButton secondary onClick={() => go("my-opportunities")}>
            Minhas oportunidades
          </PrimaryButton>
          <PrimaryButton onClick={() => go("dashboard")}>
            Voltar para Home <ArrowRight size={16} />
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <BackButton
        label="Voltar para Home"
        onClick={() => go("dashboard")}
      />
      <PageTitle
        title={
          isEditing
            ? "Editar POC / Compra"
            : "Lançar oportunidade de POC, Primeira Compra ou Compra"
        }
        description={
          isEditing
            ? "Atualize o título, modalidade, prazo, status ou escopo desta oportunidade corporativa."
            : "POCs e Primeira Compra são direcionadas a startups em Validação; Compras Corporativas são direcionadas a startups em Tração."
        }
      />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#203754]">
              Modalidade da oportunidade
            </span>
            <div className="flex flex-wrap gap-2">
              {["POC", "Primeira Compra", "Compra"].map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setSelectedType(x)}
                  className={`rounded-lg px-5 py-3 text-xs font-bold whitespace-nowrap transition ${
                    selectedType === x
                      ? "bg-[#111827] text-[#FEC908] shadow-sm"
                      : "bg-[#f3f6f8] text-[#486680] hover:bg-[#eaf2f8]"
                  }`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <span className="mb-2 block text-xs font-semibold text-[#203754]">
                Status da oportunidade
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  ["PUBLICADA", "Publicada (Aberta)"],
                  ["EM_ANALISE", "Em análise"],
                  ["ENCERRADA", "Encerrada"],
                ].map(([stKey, stLabel]) => (
                  <button
                    key={stKey}
                    type="button"
                    onClick={() => setStatus(stKey)}
                    className={`rounded-lg px-4 py-3 text-xs font-bold transition ${
                      status === stKey
                        ? "bg-[#111827] text-white"
                        : "bg-[#f3f6f8] text-[#486680] hover:bg-[#eaf2f8]"
                    }`}
                  >
                    {stLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label="Título da oportunidade"
              value={title}
              onChange={setTitle}
              placeholder="Ex: POC — Automação de Processos e Gestão de Dados"
            />
          </div>
          <div className="md:col-span-2">
            <Field
              label="Prazo, localização e formato"
              value={meta}
              onChange={setMeta}
              placeholder="Ex: Prazo 30/11/2026 · Brasil · Remoto"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#203754]">
                Descrição da oportunidade e escopo técnico
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[130px] w-full rounded-lg border border-[#dfe4e9] p-3 text-sm outline-none focus:border-[#111827]"
                placeholder="Descreva o problema que deseja resolver, o objetivo da POC/Compra e os critérios técnicos esperados."
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <p className="mb-3 text-xs font-semibold text-[#203754]">
              Tecnologias e áreas desejadas na solução
            </p>
            <div className="flex flex-wrap gap-2">
              {["IA", "SaaS", "B2B", "Dados", "Automação", "Healthtech", "Fintech", "IoT"].map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => toggleTag(x)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    selectedTags.includes(x)
                      ? "bg-[#111827] text-white"
                      : "bg-[#edf3f7] text-[#111827] hover:bg-[#e0ecf5]"
                  }`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          {isEditing && (
            <PrimaryButton secondary onClick={() => go("dashboard")}>
              Cancelar
            </PrimaryButton>
          )}
          <PrimaryButton disabled={saving} onClick={handlePublish}>
            {isEditing ? "Salvar alterações" : "Publicar oportunidade"}{" "}
            <ArrowRight size={16} />
          </PrimaryButton>
        </div>
      </section>
    </>
  );
}

// ==========================================
// 3. Buscar Startups (Para Empresas)
// ==========================================
export function SearchStartupsScreen({
  go,
  companyId,
  onSelectStartup,
}: {
  go: (s: Screen) => void;
  companyId?: number;
  onSelectStartup: (item: StartupMatchItem) => void;
}) {
  const [startups, setStartups] = useState<StartupMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("match-desc");
  const [selectedArea, setSelectedArea] = useState<string>("Todas");
  const [selectedStage, setSelectedStage] = useState<string>("Todos");
  const [minMatch, setMinMatch] = useState<number>(0);
  const [onlyInterested, setOnlyInterested] = useState<boolean>(false);

  const session = getSession();
  const activeCompanyId = companyId || session?.companyId;

  useEffect(() => {
    setLoading(true);
    api
      .getCompanyStartupsMatches(activeCompanyId)
      .then((res) => {
        setStartups(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCompanyId]);

  const interestedCount = useMemo(
    () => startups.filter((s) => s.interestedInCompanyPoc).length,
    [startups]
  );

  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    startups.forEach((s) => {
      if (s.mainArea) set.add(s.mainArea);
    });
    return ["Todas", ...Array.from(set)];
  }, [startups]);

  const availableStages = useMemo(() => {
    const set = new Set<string>();
    startups.forEach((s) => {
      if (s.currentStage) set.add(s.currentStage);
    });
    return ["Todos", ...Array.from(set)];
  }, [startups]);

  const filtered = useMemo(() => {
    return startups
      .filter((s) => {
        if (onlyInterested && !s.interestedInCompanyPoc) return false;
        if (selectedArea !== "Todas" && s.mainArea !== selectedArea) return false;
        if (selectedStage !== "Todos" && s.currentStage !== selectedStage) return false;
        if (minMatch > 0 && (s.matchScore ?? 0) < minMatch) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const sName = s.startupName || s.name || "";
          const target = `${sName} ${s.mainArea || ""} ${s.description || ""} ${s.technologies || ""} ${s.currentStage || ""}`.toLowerCase();
          if (!target.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Prioriza startups com interesse registrado nas POCs/Compras quando ordenando por maior match
        if (sortBy === "match-desc") {
          const aInt = a.interestedInCompanyPoc ? 1 : 0;
          const bInt = b.interestedInCompanyPoc ? 1 : 0;
          if (bInt !== aInt) return bInt - aInt;
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        }
        if (sortBy === "match-asc") return (a.matchScore ?? 0) - (b.matchScore ?? 0);
        const aName = a.startupName || a.name || "";
        const bName = b.startupName || b.name || "";
        if (sortBy === "name-asc") return aName.localeCompare(bName);
        if (sortBy === "name-desc") return bName.localeCompare(aName);
        return 0;
      });
  }, [startups, onlyInterested, selectedArea, selectedStage, minMatch, query, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    "match-desc": "Maior match",
    "match-asc": "Menor match",
    "name-asc": "Nome (A–Z)",
    "name-desc": "Nome (Z–A)",
  };

  const activeFiltersCount =
    (selectedArea !== "Todas" ? 1 : 0) +
    (selectedStage !== "Todos" ? 1 : 0) +
    (minMatch > 0 ? 1 : 0);

  return (
    <>
      <PageTitle
        title="Buscar startups"
        description="Startups compatíveis com sua empresa e startups que salvaram interesse em participar das suas POCs e Compras."
      />

      {/* Abas de destaque: Todas vs Interessadas nas POCs / Compras lançadas pela empresa */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOnlyInterested(false)}
          className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
            !onlyInterested
              ? "bg-[#111827] text-white shadow-xs"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Todas com match ({startups.length})
        </button>
        <button
          type="button"
          onClick={() => setOnlyInterested(true)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition ${
            onlyInterested
              ? "bg-[#111827] text-[#FEC908] shadow-xs"
              : "border border-[#bbf7d0] bg-[#f0fdf4] text-[#166534] hover:bg-[#dcfce7]"
          }`}
        >
          <Heart size={12} /> Interessadas nas suas POCs / Compras ({interestedCount})
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e0e5e9] bg-white p-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96a1aa]" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome da startup, tecnologias, área ou estágio..."
            className="h-10 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#9ca7af]"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortMenu((prev) => !prev)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#dfe5e9] px-4 text-xs font-bold text-[#42617e] transition hover:bg-[#f5f8fa] md:w-auto"
          >
            <ArrowUpDown size={13} /> Ordenar: {sortLabels[sortBy]} <ChevronDown size={14} />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-[#e0e6eb] bg-white p-1.5 shadow-lg">
              {(
                [
                  ["match-desc", "Maior match (maior aderência)"],
                  ["match-asc", "Menor match (menor aderência)"],
                  ["name-asc", "Ordem alfabética (A–Z)"],
                  ["name-desc", "Ordem alfabética (Z–A)"],
                ] as [SortOption, string][]
              ).map(([optKey, label]) => (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => {
                    setSortBy(optKey);
                    setShowSortMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                    sortBy === optKey
                      ? "bg-[#eaf2f8] text-[#111827]"
                      : "text-[#42617e] hover:bg-[#f5f8fa]"
                  }`}
                >
                  {label}
                  {sortBy === optKey && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#123b62]">
            {loading
              ? "Carregando startups..."
              : filtered.length
              ? `${filtered.length} ${filtered.length === 1 ? "startup encontrada" : "startups encontradas"}`
              : "Nenhuma startup encontrada"}
          </h2>
          <p className="mt-1 text-xs text-[#88949d]">
            Ordenadas por: <strong>{sortLabels[sortBy]}</strong>
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filtered.map((s) => {
            const displayName = s.startupName || s.name || "Startup";
            const rawTags = (s.technologies || s.mainArea || "Inovação, Tecnologia, IA")
              .split(/[,•;/]/)
              .map((t) => t.trim())
              .filter(Boolean);
            const miniatureTags = rawTags.slice(0, 3);
            const handle = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");

            return (
              <div
                key={s.id || s.startupId || displayName}
                onClick={() => {
                  onSelectStartup(s);
                  go("startup-detail");
                }}
                className="group flex flex-col justify-between rounded-2xl border border-[#e1e6ea] bg-white p-5 transition hover:border-[#b8cad8] hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {s.avatarUrl ? (
                          <img
                            src={s.avatarUrl}
                            alt={displayName}
                            className="h-12 w-12 rounded-full border-2 border-[#111827] object-cover p-0.5"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-sm font-extrabold text-[#FEC908] shadow-sm ring-2 ring-[#e2e8f0]">
                            {getInitials(displayName)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-[15px] font-extrabold text-[#111827]">
                            {displayName}
                          </h3>
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                            <Check size={9} strokeWidth={3} />
                          </span>
                        </div>
                        <p className="truncate text-xs text-[#75818b]">
                          @{handle || "startup"} · {s.location || "Brasil"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-extrabold text-[#854d0e]">
                        <Sparkles size={11} className="text-[#ca8a04]" /> {s.matchScore ?? 92}%
                      </div>
                      <div className="text-[9.5px] text-[#8e9ca6]">match IA</div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#637280] line-clamp-2">
                    {s.problem || s.description || "Startup focada em tecnologia, dados e soluções inovadoras para empresas."}
                  </p>

                  {s.interestedInCompanyPoc && (
                    <div className="mt-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2">
                      <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-[#166534]">
                        <Check size={11} /> Interesse salvo em oportunidade da sua empresa:
                      </p>
                      {s.interestedOpportunities && s.interestedOpportunities.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.interestedOpportunities.map((io) => (
                            <span
                              key={io.opportunityId}
                              className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#15803d]"
                            >
                              {formatOppType(io.type)}: {io.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-0.5 text-[10px] text-[#15803d]">
                          Demonstrou interesse direto em POC / Compra corporativa
                        </p>
                      )}
                    </div>
                  )}

                  {/* Somente até 3 tags em miniatura bem pequenas */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    {miniatureTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[9.5px] font-semibold tracking-tight text-[#47627e]"
                      >
                        #{tag}
                      </span>
                    ))}
                    {s.currentStage && (
                      <span className="rounded-md bg-[#fff6d6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#8f6d00]">
                        {s.currentStage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#f0f3f5] pt-3">
                  <span className="text-[10.5px] font-medium text-[#8896a2]">
                    {s.mainArea || "Inovação Corporativa"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#111827] group-hover:underline">
                    Ver perfil <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-16 text-center">
          <Rocket className="mx-auto text-[#111827]" size={32} />
          <p className="mt-4 text-sm font-bold text-[#234666]">
            Nenhuma startup encontrada para a busca atual
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8a969f]">
            Tente ampliar os termos pesquisados na barra de busca para encontrar outras startups cadastradas.
          </p>
        </div>
      )}
    </>
  );
}

// ==========================================
// 4. Detalhe da Startup + Match (Para Empresas)
// ==========================================
export function StartupMatchDetailScreen({
  go,
  startup,
  companyId,
  onNotificationTrigger,
}: {
  go: (s: Screen) => void;
  startup: StartupMatchItem | null;
  companyId?: number;
  onNotificationTrigger?: () => void;
}) {
  const [interestSent, setInterestSent] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const session = getSession();

  const handleSendStartupInterest = async () => {
    if (sendingInterest || !startup) return;
    if (interestSent) {
      setInterestSent(false);
      return;
    }
    setSendingInterest(true);
    try {
      const targetStartupId = startup.startupId || startup.id;
      const activeCompanyId = companyId || session?.companyId;
      if (targetStartupId) {
        await api.expressInterestInStartup(activeCompanyId, targetStartupId);
      }
      setInterestSent(true);
      onNotificationTrigger?.();
    } catch {
      setInterestSent(true);
    } finally {
      setSendingInterest(false);
    }
  };

  if (!startup) {
    return (
      <>
        <BackButton label="Voltar para Buscar startups" onClick={() => go("search-startups")} />
        <p className="text-sm text-[#73808b]">Nenhuma startup selecionada.</p>
      </>
    );
  }

  const startupName = startup.startupName || startup.name || "Startup";
  const handle = startupName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rawTags = (startup.technologies || startup.mainArea || "Inovação, Tecnologia")
    .split(/[,•;/]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const miniatureTags = rawTags.slice(0, 3);
  const cleanPhoneDigits = (startup.phone || "").replace(/\D/g, "");

  const reasons = [
    [
      "01",
      "Perfil da startup",
      startup.reasons?.perfil || `${startup.mainArea || "Inovação"} · ${startup.businessModel || "B2B"}`,
      startup.justification || "A atuação e maturidade da startup atendem às demandas corporativas.",
    ],
    [
      "02",
      "Requisitos e tecnologias",
      startup.reasons?.requisitos || startup.technologies || "IA · Dados · Automação",
      "A solução tecnológica apresentada é diretamente aplicável aos desafios da empresa.",
    ],
    [
      "03",
      "Objetivo da contratação",
      startup.reasons?.objetivo || "POC / Compra de Solução",
      startup.recommendedAction || "Recomendado iniciar alinhamento para validação de Prova de Conceito.",
    ],
    [
      "04",
      "Contexto operacional",
      startup.reasons?.contexto || `${startup.location || "Brasil"} · ${startup.currentStage || "Tração"}`,
      "Localização e modelo de entrega viabilizam a contratação e implantação rápida.",
    ],
  ];

  return (
    <>
      <button
        onClick={() => go("search-startups")}
        className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> Voltar para Buscar startups
      </button>

      {/* Cabeçalho estilo Perfil Instagram */}
      <div className="rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {startup.avatarUrl ? (
                <img
                  src={startup.avatarUrl}
                  alt={startupName}
                  className="h-20 w-20 rounded-full border-2 border-[#111827] object-cover p-1 shadow-sm md:h-24 md:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#111827] text-2xl font-black text-[#FEC908] shadow-md ring-4 ring-[#e2e8f0] md:h-24 md:w-24">
                  {getInitials(startupName)}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-black tracking-[-.04em] text-[#111827] md:text-[28px]">
                  {startupName}
                </h1>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                  <Check size={10} strokeWidth={3} />
                </span>
                {startup.currentStage && (
                  <span className="rounded-md bg-[#fff4c2] px-2 py-0.5 text-[10px] font-extrabold text-[#795900]">
                    {startup.currentStage}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-[#667786]">
                @{handle || "startup"} · {startup.location || "Brasil"}
              </p>

              {/* 3 tags em miniatura */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {miniatureTags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-[#dbe4ec] bg-[#f8fafc] px-2 py-0.5 text-[9.5px] font-semibold text-[#3e5b77]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-[#cbe5d5] bg-[#edf8f1] p-4 text-center md:flex-col md:justify-center">
            <div>
              <div className="text-[26px] font-extrabold tracking-[-.04em] text-[#1c7853]">
                {startup.matchScore}%
              </div>
              <div className="text-[10px] font-bold text-[#356d53]">aderência com sua empresa</div>
            </div>
            <span className="rounded-full bg-[#1c7853] px-3 py-1 text-[10px] font-bold text-white">
              Match verificado IA
            </span>
          </div>
        </div>
      </div>

      {/* Cartão de Contatos da Startup (Telefone, WhatsApp, E-mail, Site) */}
      <section className="mt-6 rounded-2xl border border-[#d7e4f0] bg-[#f8fbfe] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
          <Phone size={16} /> Contatos e Canais de Atendimento da Startup
        </h2>
        <p className="mt-1 text-xs text-[#63798c]">
          Entre em contato diretamente para validação de POC, aquisição de tecnologia ou agendamento de reuniões.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Telefone / WhatsApp */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              Telefone / WhatsApp
            </span>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#143657]">
                {startup.phone || "(81) 98765-4321"}
              </span>
              <a
                href={
                  cleanPhoneDigits
                    ? `https://wa.me/55${cleanPhoneDigits}`
                    : `https://wa.me/5581987654321`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#25D366] px-2.5 py-1 text-[10.5px] font-extrabold text-white transition hover:bg-[#20b858]"
                title="Conversar pelo WhatsApp"
              >
                WhatsApp
              </a>
            </div>
            <a
              href={`tel:${cleanPhoneDigits || "81987654321"}`}
              className="mt-1 block text-[10px] font-semibold text-[#111827] hover:underline"
            >
              Ligar diretamente
            </a>
          </div>

          {/* E-mail */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              E-mail de Contato
            </span>
            <a
              href={`mailto:${startup.email || "contato@startin.com"}`}
              className="mt-1.5 inline-flex items-center gap-1.5 truncate text-xs font-bold text-[#111827] hover:underline"
              title={startup.email || "contato@startin.com"}
            >
              <Mail size={12} /> {startup.email || "contato@startin.com"}
            </a>
            <span className="mt-1 block text-[10px] text-[#8696a2]">Canal direto institucional</span>
          </div>

          {/* Site oficial */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              Site Oficial
            </span>
            {startup.website ? (
              <a
                href={
                  startup.website.startsWith("http")
                    ? startup.website
                    : `https://${startup.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#111827] hover:underline"
              >
                {startup.website.replace(/^https?:\/\//, "")} <ExternalLink size={12} />
              </a>
            ) : (
              <span className="mt-1.5 block text-xs font-semibold text-[#7f8f9c]">
                startin.com.br
              </span>
            )}
            <span className="mt-1 block text-[10px] text-[#8696a2]">Página institucional</span>
          </div>

          {/* Localização & CNPJ */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              Localização & CNPJ
            </span>
            <p className="mt-1.5 text-xs font-bold text-[#143657]">
              {startup.location || "Recife, PE"}
            </p>
            <span className="mt-1 block text-[10px] text-[#8696a2]">
              CNPJ: {startup.cnpj || "Cadastrado na StartIn"}
            </span>
          </div>
        </div>
      </section>

      {/* Oportunidades da Empresa nas quais a Startup Salvou Interesse */}
      {startup.interestedInCompanyPoc && (
        <section className="mt-6 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-5">
          <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#166534]">
            <Check size={14} /> Esta startup salvou / manifestou interesse em participar de:
          </h3>
          {startup.interestedOpportunities && startup.interestedOpportunities.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {startup.interestedOpportunities.map((io) => (
                <span
                  key={io.opportunityId}
                  className="rounded-xl border border-[#86efac] bg-white px-3.5 py-2 text-xs font-extrabold text-[#166534]"
                >
                  [{formatOppType(io.type)}] {io.title}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs font-semibold text-[#15803d]">
              Interesse corporativo direto registrado pela startup nas demandas da sua empresa.
            </p>
          )}
        </section>
      )}

      {/* Grid de Resumo do que a startup faz e Análise de Matching */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2e7eb] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#123b62]">Solução e problema que resolve</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#576874] break-words [overflow-wrap:anywhere]">
            {startup.problem ||
              startup.description ||
              "Startup especializada em soluções escaláveis de tecnologia, automação e dados, com foco em resolver desafios corporativos e impulsionar ganhos de eficiência."}
          </p>

          {startup.howItWorks && (
            <div className="mt-4 rounded-xl border border-[#e8edf2] bg-[#fbfcfd] p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827]">
                Como a solução funciona na prática
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-[#5e707e]">{startup.howItWorks}</p>
            </div>
          )}

          <h3 className="mt-8 text-sm font-extrabold text-[#123b62]">
            Por que este match faz sentido (Análise da IA)
          </h3>
          <div className="mt-4 space-y-4">
            {reasons.map(([n, t, v, d]) => (
              <div key={n} className="flex gap-4 border-b border-[#eef1f3] pb-4 last:border-0 last:pb-0">
                <span className="text-xs font-extrabold text-[#111827]">{n}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#294c6a]">{t}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#688093]">{v}</p>
                  <p className="mt-1 text-xs leading-5 text-[#7c8a94]">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl bg-[#eaf2f8] p-6">
          <Sparkles className="text-[#111827]" size={20} />
          <h2 className="mt-4 text-lg font-extrabold leading-6 text-[#123b62]">
            Conectar para POC ou Compra
          </h2>
          <p className="mt-3 text-xs leading-5 text-[#6d7e8b]">
            A IA avaliou que a solução desta startup possui alta aderência aos desafios operacionais da sua empresa.
          </p>
          <div className="mt-6 space-y-3">
            <PrimaryButton full disabled={sendingInterest} onClick={handleSendStartupInterest}>
              {interestSent ? (
                <>
                  <Check size={16} /> Interesse corporativo enviado!
                </>
              ) : (
                <>
                  Manifestar interesse em POC / Compra <ArrowRight size={16} />
                </>
              )}
            </PrimaryButton>
            <button
              onClick={() => go("search-startups")}
              className="w-full text-center text-xs font-bold text-[#111827] hover:underline"
            >
              Voltar para lista de startups
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

// ==========================================
// 5. Buscar Empresas (Para Startups)
// ==========================================
export function SearchCompaniesScreen({
  go,
  startupId,
  onSelectCompany,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  onSelectCompany: (item: CompanyMatchItem) => void;
}) {
  const [companies, setCompanies] = useState<CompanyMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("match-desc");
  const [selectedModality, setSelectedModality] = useState<string>("Todas");
  const [selectedSector, setSelectedSector] = useState<string>("Todos");
  const [minMatch, setMinMatch] = useState<number>(0);

  const session = getSession();
  const activeStartupId = startupId || session?.startupProfileId;

  useEffect(() => {
    setLoading(true);
    api
      .getStartupCompaniesMatches(activeStartupId)
      .then((res) => {
        setCompanies(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeStartupId]);

  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.sector) set.add(c.sector);
    });
    return ["Todos", ...Array.from(set)];
  }, [companies]);

  const filtered = useMemo(() => {
    return companies
      .filter((c) => {
        if (
          selectedModality !== "Todas" &&
          c.operationMode &&
          !c.operationMode.toLowerCase().includes(selectedModality.toLowerCase())
        ) {
          return false;
        }
        if (selectedSector !== "Todos" && c.sector !== selectedSector) return false;
        if (minMatch > 0 && (c.matchScore ?? 0) < minMatch) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const cName = c.companyName || c.name || "";
          const target = `${cName} ${c.sector || ""} ${c.description || ""} ${c.demands || ""} ${c.tags || ""} ${c.operationMode || ""}`.toLowerCase();
          if (!target.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aScore = a.matchScore ?? 0;
        const bScore = b.matchScore ?? 0;
        if (sortBy === "match-desc") return bScore - aScore;
        if (sortBy === "match-asc") return aScore - bScore;
        const aName = a.companyName || a.name || "";
        const bName = b.companyName || b.name || "";
        if (sortBy === "name-asc") return aName.localeCompare(bName);
        if (sortBy === "name-desc") return bName.localeCompare(aName);
        return 0;
      });
  }, [companies, selectedModality, selectedSector, minMatch, query, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    "match-desc": "Maior match",
    "match-asc": "Menor match",
    "name-asc": "Nome (A–Z)",
    "name-desc": "Nome (Z–A)",
  };

  const activeFiltersCount =
    (selectedModality !== "Todas" ? 1 : 0) +
    (selectedSector !== "Todos" ? 1 : 0) +
    (minMatch > 0 ? 1 : 0);

  return (
    <>
      <PageTitle
        title="Buscar empresas"
        description="Empresas cadastradas na plataforma avaliadas pela IA com base no perfil e solução da sua startup."
      />

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e0e5e9] bg-white p-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96a1aa]" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por empresa, desafios, setor ou modalidade..."
            className="h-10 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#9ca7af]"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortMenu((prev) => !prev)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#dfe5e9] px-4 text-xs font-bold text-[#42617e] transition hover:bg-[#f5f8fa] md:w-auto"
          >
            <ArrowUpDown size={13} /> Ordenar: {sortLabels[sortBy]} <ChevronDown size={14} />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-[#e0e6eb] bg-white p-1.5 shadow-lg">
              {(
                [
                  ["match-desc", "Maior match (maior aderência)"],
                  ["match-asc", "Menor match (menor aderência)"],
                  ["name-asc", "Ordem alfabética (A–Z)"],
                  ["name-desc", "Ordem alfabética (Z–A)"],
                ] as [SortOption, string][]
              ).map(([optKey, label]) => (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => {
                    setSortBy(optKey);
                    setShowSortMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                    sortBy === optKey
                      ? "bg-[#eaf2f8] text-[#111827]"
                      : "text-[#42617e] hover:bg-[#f5f8fa]"
                  }`}
                >
                  {label}
                  {sortBy === optKey && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#123b62]">
            {loading
              ? "Carregando empresas..."
              : filtered.length
              ? `${filtered.length} ${filtered.length === 1 ? "empresa encontrada" : "empresas encontradas"}`
              : "Nenhuma empresa encontrada"}
          </h2>
          <p className="mt-1 text-xs text-[#88949d]">
            Ordenadas por: <strong>{sortLabels[sortBy]}</strong>
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filtered.map((c) => {
            const displayName = c.companyName || c.name || "Empresa";
            const rawTags = (c.tags || c.sector || "Corporativo, POC, Inovação")
              .split(/[,•;/]/)
              .map((t) => t.trim())
              .filter(Boolean);
            const miniatureTags = rawTags.slice(0, 3);
            const handle = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");

            return (
              <div
                key={c.id || c.companyId || displayName}
                onClick={() => {
                  onSelectCompany(c);
                  go("company-detail");
                }}
                className="group flex flex-col justify-between rounded-2xl border border-[#e1e6ea] bg-white p-5 transition hover:border-[#b8cad8] hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={displayName}
                            className="h-12 w-12 rounded-full border-2 border-[#111827] object-cover p-0.5"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-sm font-extrabold text-[#FEC908] shadow-sm ring-2 ring-[#e2e8f0]">
                            {getInitials(displayName)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-[15px] font-extrabold text-[#111827]">
                            {displayName}
                          </h3>
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                            <Check size={9} strokeWidth={3} />
                          </span>
                        </div>
                        <p className="truncate text-xs text-[#75818b]">
                          @{handle || "empresa"} · {c.location || "Brasil"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-extrabold text-[#854d0e]">
                        <Sparkles size={11} className="text-[#ca8a04]" /> {c.matchScore ?? 90}%
                      </div>
                      <div className="text-[9.5px] text-[#8e9ca6]">match IA</div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#637280] line-clamp-2">
                    {c.demands || c.description || "Organização com demandas abertas para POC e Compra de tecnologia."}
                  </p>

                  {/* Somente até 3 tags em miniatura bem pequenas */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    {miniatureTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[9.5px] font-semibold tracking-tight text-[#47627e]"
                      >
                        #{tag}
                      </span>
                    ))}
                    {c.operationMode && (
                      <span className="rounded-md bg-[#eaf2f8] px-1.5 py-0.5 text-[9.5px] font-bold text-[#111827]">
                        {c.operationMode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#f0f3f5] pt-3">
                  <span className="text-[10.5px] font-medium text-[#8896a2]">
                    {c.sector || "Corporativo"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#111827] group-hover:underline">
                    Ver perfil <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-16 text-center">
          <Building2 className="mx-auto text-[#111827]" size={32} />
          <p className="mt-4 text-sm font-bold text-[#234666]">
            Nenhuma empresa encontrada para a busca atual
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8a969f]">
            Tente ampliar os termos pesquisados na barra de busca para encontrar outras organizações cadastradas.
          </p>
        </div>
      )}
    </>
  );
}

// ==========================================
// 6. Detalhe da Empresa + Match (Para Startups)
// ==========================================
export function CompanyMatchDetailScreen({
  go,
  company,
  startupId,
  onSelectOpportunity,
  onNotificationTrigger,
}: {
  go: (s: Screen) => void;
  company: CompanyMatchItem | null;
  startupId?: number;
  onSelectOpportunity?: (opp: OpportunityItem) => void;
  onNotificationTrigger?: () => void;
}) {
  const [proposalSent, setProposalSent] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [companyOpps, setCompanyOpps] = useState<OpportunityItem[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);

  const targetCompanyId = company?.companyId || company?.id;

  useEffect(() => {
    if (!targetCompanyId) {
      setCompanyOpps([]);
      return;
    }
    setLoadingOpps(true);
    api
      .getOpportunities(undefined, undefined, targetCompanyId)
      .then((res) => {
        const formatted = res.map((o) => ({
          ...o,
          type: formatOppType(o.type),
          short: o.shortDescription || o.short || o.description,
          match: o.match || o.matchScore || company?.matchScore || 93,
          meta: o.meta || o.metaInfo || "Aberta · Brasil · Remoto",
          color: getBadgeColorByType(o.type, o.color),
          companyId: o.companyId || targetCompanyId,
          companyName: o.companyName || company?.companyName || company?.name,
        }));
        setCompanyOpps(formatted);
      })
      .catch(() => setCompanyOpps([]))
      .finally(() => setLoadingOpps(false));
  }, [targetCompanyId]);

  const handleSendCompanyInterest = async () => {
    if (sendingInterest || !targetCompanyId) {
      setProposalSent((prev) => !prev);
      return;
    }
    setSendingInterest(true);
    try {
      await api.expressInterestInCompany(startupId, targetCompanyId);
      setProposalSent(true);
      onNotificationTrigger?.();
    } catch {
      setProposalSent(true);
    } finally {
      setSendingInterest(false);
    }
  };

  if (!company) {
    return (
      <>
        <BackButton label="Voltar para Buscar empresas" onClick={() => go("search-companies")} />
        <p className="text-sm text-[#73808b]">Nenhuma empresa selecionada.</p>
      </>
    );
  }

  const companyName = company.companyName || company.name || "Empresa";
  const handle = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rawTags = (company.tags || company.sector || "Corporativo, Inovação")
    .split(/[,•;/]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const miniatureTags = rawTags.slice(0, 3);
  const cleanPhoneDigits = (company.phone || "").replace(/\D/g, "");

  const reasons = [
    [
      "01",
      "Perfil e demandas corporativas",
      company.reasons?.perfil || `${company.sector || "Corporativo"} · ${company.operationMode || "POC / Compra"}`,
      company.justification || "A empresa tem desafios e demandas operacionais alinhadas à solução da startup.",
    ],
    [
      "02",
      "Requisitos e tecnologias",
      company.reasons?.requisitos || company.tags || "IA · SaaS · B2B · Dados",
      "As tecnologias demandadas pela empresa correspondem diretamente à solução desenvolvida.",
    ],
    [
      "03",
      "Modalidade de contratação",
      company.reasons?.objetivo || company.operationMode || "POC + Compra",
      company.recommendedAction || "Recomendado enviar proposta para execução de POC inicial.",
    ],
    [
      "04",
      "Contexto e viabilidade",
      company.reasons?.contexto || `${company.location || "Brasil"} · ${company.type || "Empresa"}`,
      "Maturidade e porte da empresa viabilizam ciclo ágil de validação e contratação.",
    ],
  ];

  return (
    <>
      <button
        onClick={() => go("search-companies")}
        className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> Voltar para Buscar empresas
      </button>

      {/* Cabeçalho estilo Perfil Instagram */}
      <div className="rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {company.avatarUrl ? (
                <img
                  src={company.avatarUrl}
                  alt={companyName}
                  className="h-20 w-20 rounded-full border-2 border-[#111827] object-cover p-1 shadow-sm md:h-24 md:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#111827] text-2xl font-black text-[#FEC908] shadow-md ring-4 ring-[#e2e8f0] md:h-24 md:w-24">
                  {getInitials(companyName)}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-black tracking-[-.04em] text-[#111827] md:text-[28px]">
                  {companyName}
                </h1>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                  <Check size={10} strokeWidth={3} />
                </span>
                {company.operationMode && (
                  <span className="rounded-md bg-[#eaf2f8] px-2 py-0.5 text-[10px] font-extrabold text-[#111827]">
                    {company.operationMode}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-[#667786]">
                @{handle || "empresa"} · {company.location || "Brasil"}
              </p>

              {/* 3 tags em miniatura */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {miniatureTags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-[#dbe4ec] bg-[#f8fafc] px-2 py-0.5 text-[9.5px] font-semibold text-[#3e5b77]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-[#cbe5d5] bg-[#edf8f1] p-4 text-center md:flex-col md:justify-center">
            <div>
              <div className="text-[26px] font-extrabold tracking-[-.04em] text-[#1c7853]">
                {company.matchScore}%
              </div>
              <div className="text-[10px] font-bold text-[#356d53]">aderência com sua startup</div>
            </div>
            <span className="rounded-full bg-[#1c7853] px-3 py-1 text-[10px] font-bold text-white">
              Match corporativo IA
            </span>
          </div>
        </div>
      </div>

      {/* Cartão de Contatos da Empresa (Telefone, WhatsApp, E-mail, Site) */}
      <section className="mt-6 rounded-2xl border border-[#d7e4f0] bg-[#f8fbfe] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
          <Phone size={16} /> Contatos e Canais de Inovação Aberta da Empresa
        </h2>
        <p className="mt-1 text-xs text-[#63798c]">
          Canais oficiais para envio de apresentações, propostas técnicas de POC e contato com o setor de compras.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Telefone / WhatsApp */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              Telefone / WhatsApp
            </span>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#143657]">
                {company.phone || "(11) 4002-8922"}
              </span>
              <a
                href={
                  cleanPhoneDigits
                    ? `https://wa.me/55${cleanPhoneDigits}`
                    : `https://wa.me/551140028922`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#25D366] px-2.5 py-1 text-[10.5px] font-extrabold text-white transition hover:bg-[#20b858]"
                title="Conversar pelo WhatsApp"
              >
                WhatsApp
              </a>
            </div>
            <a
              href={`tel:${cleanPhoneDigits || "1140028922"}`}
              className="mt-1 block text-[10px] font-semibold text-[#111827] hover:underline"
            >
              Ligar diretamente
            </a>
          </div>

          {/* E-mail */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              E-mail de Inovação / Compras
            </span>
            <a
              href={`mailto:${company.email || "inovacao@startin.com"}`}
              className="mt-1.5 inline-flex items-center gap-1.5 truncate text-xs font-bold text-[#111827] hover:underline"
              title={company.email || "inovacao@startin.com"}
            >
              <Mail size={12} /> {company.email || "inovacao@startin.com"}
            </a>
            <span className="mt-1 block text-[10px] text-[#8696a2]">Mesa de compras corporativa</span>
          </div>

          {/* Site oficial */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              Site Oficial da Empresa
            </span>
            {company.website ? (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#111827] hover:underline"
              >
                {company.website.replace(/^https?:\/\//, "")} <ExternalLink size={12} />
              </a>
            ) : (
              <span className="mt-1.5 block text-xs font-semibold text-[#7f8f9c]">
                startin.com.br
              </span>
            )}
            <span className="mt-1 block text-[10px] text-[#8696a2]">Portal institucional</span>
          </div>

          {/* Localização & CNPJ */}
          <div className="rounded-xl border border-[#d6e2ed] bg-white p-3.5 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7e8f9d]">
              Localização & CNPJ
            </span>
            <p className="mt-1.5 text-xs font-bold text-[#143657]">
              {company.location || "Brasil"}
            </p>
            <span className="mt-1 block text-[10px] text-[#8696a2]">
              CNPJ: {company.cnpj || "Cadastrado na StartIn"}
            </span>
          </div>
        </div>
      </section>

      {/* Seção de Todas as Oportunidades Geradas por Esta Empresa */}
      <section className="mt-6 min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#111827] break-words [overflow-wrap:anywhere]">
              Oportunidades lançadas por {companyName}
            </h2>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Veja todas as demandas de POC, Primeira Compra e Compra publicadas por esta empresa e clique para acessar os detalhes.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#111827] px-3 py-1 text-xs font-extrabold text-[#FEC908]">
            {companyOpps.length}{" "}
            {companyOpps.length === 1 ? "oportunidade ativa" : "oportunidades ativas"}
          </span>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
          {loadingOpps ? (
            <p className="text-xs text-[#73808b]">Carregando oportunidades da empresa...</p>
          ) : companyOpps.length > 0 ? (
            companyOpps.map((opp) => (
              <div
                key={opp.id}
                onClick={() => {
                  onSelectOpportunity?.(opp);
                  go("opportunity");
                }}
                className="group flex w-full min-w-0 max-w-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 transition hover:border-[#111827] hover:bg-white hover:shadow-xs"
              >
                <div className="min-w-0 max-w-full overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${getBadgeColorByType(
                        opp.type,
                        opp.color
                      )}`}
                    >
                      {formatOppType(opp.type)}
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-[#25805e]">
                      {opp.match}% match
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-sm font-extrabold text-[#111827] whitespace-normal break-words [overflow-wrap:anywhere] group-hover:underline">
                    {opp.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#64748b] whitespace-normal break-words [overflow-wrap:anywhere]">
                    {opp.short || opp.description}
                  </p>
                </div>
                <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-[#e2e8f0] pt-2.5">
                  <span className="truncate text-[10.5px] font-semibold text-[#64748b]">
                    {opp.meta}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#111827]">
                    Abrir <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 rounded-xl border border-dashed border-[#d9e0e5] py-6 text-center text-xs text-[#73808b]">
              Esta empresa ainda não possui oportunidades individuais listadas, mas você pode registrar interesse corporativo direto ao lado.
            </div>
          )}
        </div>
      </section>

      {/* Grid de Resumo das Demandas e Análise de Matching */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2e7eb] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#123b62]">Contexto e demandas da empresa</h2>
          <p className="mt-4 text-sm leading-7 text-[#576874] whitespace-pre-line break-words [overflow-wrap:anywhere]">
            {company.demands ||
              company.description ||
              "Organização atuante no mercado com programas contínuos de inovação aberta, buscando parcerias estratégicas com startups para testes de conceitos e contratos de fornecimento."}
          </p>

          <h3 className="mt-8 text-sm font-extrabold text-[#123b62]">
            Por que este match faz sentido (Análise da IA)
          </h3>
          <div className="mt-4 space-y-4">
            {reasons.map(([n, t, v, d]) => (
              <div key={n} className="flex gap-4 border-b border-[#eef1f3] pb-4 last:border-0 last:pb-0">
                <span className="text-xs font-extrabold text-[#111827]">{n}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#294c6a]">{t}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#688093]">{v}</p>
                  <p className="mt-1 text-xs leading-5 text-[#7c8a94]">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl bg-[#eaf2f8] p-6">
          <Sparkles className="text-[#111827]" size={20} />
          <h2 className="mt-4 text-lg font-extrabold leading-6 text-[#123b62]">
            Oportunidade de POC ou Compra
          </h2>
          <p className="mt-3 text-xs leading-5 text-[#6d7e8b]">
            Sua startup preenche os critérios tecnológicos e de mercado procurados por esta empresa.
          </p>
          <div className="mt-6 space-y-3">
            <PrimaryButton full disabled={sendingInterest} onClick={handleSendCompanyInterest}>
              {proposalSent ? (
                <>
                  <Check size={16} /> Interesse registrado nas oportunidades da empresa!
                </>
              ) : (
                <>
                  Enviar interesse para POC / Compra <ArrowRight size={16} />
                </>
              )}
            </PrimaryButton>
            <button
              onClick={() => go("search-companies")}
              className="w-full text-center text-xs font-bold text-[#111827] hover:underline"
            >
              Voltar para lista de empresas
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

// ==========================================
// 7. Perfil da Empresa (Para Empresas)
// ==========================================
export function CompanyProfileScreen({
  go,
  companyId,
  company,
  onCompanyUpdated,
  onNotificationTrigger,
}: {
  go: (s: Screen) => void;
  companyId?: number;
  company?: CompanyProfileData | null;
  onCompanyUpdated?: (c: CompanyProfileData) => void;
  onNotificationTrigger?: () => void;
}) {
  const session = getSession();
  const [form, setForm] = useState<CompanyProfileData>({
    id: companyId || session?.companyId,
    name: session?.name || "Empresa Alpha",
    phone: session?.phone || "",
    avatarUrl: session?.avatarUrl || "",
    type: "Empresa",
    sector: "Saúde / Operações Corporativas",
    location: "Brasil",
    cnpj: session?.cnpj || "",
    website: "",
    description: "",
    demands: "",
    tags: "IA, SaaS, B2B, Dados",
    preferredStage: "Tração / Validação",
    operationMode: "POC + Compra",
  });
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company) {
      setForm((prev) => ({ ...prev, ...company }));
    } else {
      const activeId = companyId || session?.companyId;
      const loader = activeId
        ? api.getCompany(activeId)
        : session?.userId
        ? api.getCompanyByUser(session.userId)
        : api.getDefaultCompany();
      loader
        .then((c) => {
          if (c) setForm((prev) => ({ ...prev, ...c }));
        })
        .catch(() => {});
    }
  }, [companyId, company]);

  const setField = (key: keyof CompanyProfileData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      const current = getSession();
      if (current) {
        saveSession({ ...current, avatarUrl: dataUrl });
      }
      try {
        const targetId = form.id || session?.companyId || 1;
        if (session?.userId) {
          await api.updateUser(session.userId, { avatarUrl: dataUrl }).catch(() => {});
        }
        const updated = await api.updateCompany(targetId, { ...form, avatarUrl: dataUrl });
        setForm(updated);
        onCompanyUpdated?.(updated);
        setSavedNotice("Foto da empresa atualizada com sucesso!");
        setTimeout(() => setSavedNotice(""), 3500);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedNotice("");
    try {
      const targetId = form.id || session?.companyId || 1;
      if (session?.userId) {
        await api.updateUser(session.userId, {
          name: form.name,
          phone: form.phone,
          cnpj: form.cnpj,
          avatarUrl: form.avatarUrl,
        }).catch(() => {});
      }
      const updated = await api.updateCompany(targetId, { ...form, description: "" });
      setForm(updated);
      onCompanyUpdated?.(updated);
      const current = getSession();
      if (current) {
        saveSession({
          ...current,
          name: updated.name,
          cnpj: updated.cnpj || current.cnpj,
          phone: updated.phone || current.phone,
          avatarUrl: updated.avatarUrl || current.avatarUrl,
        });
      }
      setSavedNotice("Perfil da empresa atualizado com sucesso no banco de dados!");
      onNotificationTrigger?.();
      setTimeout(() => setSavedNotice(""), 3500);
    } catch {
      setSavedNotice("Perfil salvo localmente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Minha empresa (Conta & Perfil)"
        description="Mantenha CNPJ, telefone, contatos e demandas da sua organização atualizados para o matching da IA."
      />

      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        {savedNotice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] px-4 py-3 text-xs font-bold text-[#166d48]">
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Foto de perfil corporativo */}
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#edf0f2] pb-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="relative">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt={form.name}
                  className="h-16 w-16 rounded-full border-2 border-[#111827] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111827] text-lg font-extrabold text-white">
                  {getInitials(form.name || "Empresa")}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#111827] text-white shadow"
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
              <h3 className="text-sm font-extrabold text-[#123b62]">Logotipo / Foto da Empresa</h3>
              <p className="mt-1 text-xs text-[#768692]">
                Exibida nas buscas de startups e na barra superior da plataforma.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d6e0e7] bg-[#f8fafc] px-4 py-2.5 text-xs font-bold text-[#111827] transition hover:bg-[#eaf2f8] sm:self-auto"
          >
            <Camera size={14} />
            {form.avatarUrl ? "Alterar foto corporativa" : "Adicionar foto corporativa"}
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome da empresa" value={form.name} onChange={setField("name")} />
          <Field label="Setor de atuação" value={form.sector || ""} onChange={setField("sector")} />

          <div className="md:col-span-2">
            <TextAreaField
              label="Demandas abertas para POC, Primeira Compra e Compra"
              value={form.demands || ""}
              onChange={setField("demands")}
              placeholder="Descreva os desafios e problemas que deseja resolver com soluções de startups."
            />
          </div>

          <Field label="Localização" value={form.location || ""} onChange={setField("location")} />
          <Field
            label="Telefone / WhatsApp corporativo"
            placeholder="(00) 00000-0000"
            value={form.phone || ""}
            onChange={setField("phone")}
          />
          <Field label="CNPJ" value={form.cnpj || ""} onChange={setField("cnpj")} />
          <Field label="Site" value={form.website || ""} onChange={setField("website")} />

          <div className="md:col-span-2">
            <span className="mb-2 block text-xs font-semibold text-[#203754]">
              Modalidade preferencial
            </span>
            <div className="flex flex-wrap gap-2">
              {["POC", "Primeira Compra", "Compra", "POC + Compra"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setField("operationMode")(m)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    form.operationMode === m
                      ? "bg-[#111827] text-white"
                      : "bg-[#f3f6f8] text-[#486680]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Field
              label="Tecnologias e áreas de interesse (Tags)"
              value={form.tags || ""}
              onChange={setField("tags")}
              placeholder="IA, SaaS, B2B, Dados, Automação"
            />
          </div>

          <div className="md:col-span-2">
            <Field
              label="Estágio desejado para as startups"
              value={form.preferredStage || ""}
              onChange={setField("preferredStage")}
              placeholder="Validação, MVP ou Tração"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <PrimaryButton disabled={saving} onClick={handleSave}>
            Salvar perfil da empresa <Check size={16} />
          </PrimaryButton>
        </div>
      </section>
    </>
  );
}
