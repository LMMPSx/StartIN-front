import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  Trash2,
  X,
} from "@/icons";
import { BackButton, OpportunityCard, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, type MatchItem, type OpportunityItem, type StartupProfileData } from "@/lib/api";
import type { OpportunityType, Screen } from "@/types/startin";
import { formatOppType, getBadgeColorByType } from "@/utils/formatters";

const SAVED_OPPS_STORAGE_KEY = "startin-saved-opps";

export function getLocalSavedOpportunities(): OpportunityItem[] {
  try {
    const raw = localStorage.getItem(SAVED_OPPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOpportunityLocally(item: OpportunityItem): void {
  try {
    const current = getLocalSavedOpportunities();
    const exists = current.some(
      (x) => String(x.id) === String(item.id) || x.title === item.title
    );
    if (!exists) {
      localStorage.setItem(SAVED_OPPS_STORAGE_KEY, JSON.stringify([item, ...current]));
    }
  } catch {}
}

export function removeOpportunityLocally(idOrTitle: string | number): void {
  try {
    const current = getLocalSavedOpportunities();
    const next = current.filter(
      (x) => String(x.id) !== String(idOrTitle) && x.title !== String(idOrTitle)
    );
    localStorage.setItem(SAVED_OPPS_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function detectPlatformLabel(item: OpportunityItem): string {
  const combined = `${item.externalUrl || ""} ${item.title || ""} ${item.tags || ""}`.toLowerCase();
  if (combined.includes("fapesp") || combined.includes("pipe")) return "FAPESP PIPE";
  if (combined.includes("finep")) return "FINEP";
  if (combined.includes("inovastartups") || combined.includes("sebrae"))
    return "InovaStartups / Sebrae";
  if (combined.includes("startupconnect") || combined.includes("recife"))
    return "Ecossistema / Eventos";
  return "StartIn / Corporativo";
}

type SortOption = "match-desc" | "match-asc" | "title-asc" | "title-desc";

export function Opportunities({
  go,
  explore = false,
  startupId,
  profile,
  onSelectOpportunity,
}: {
  go: (s: Screen) => void;
  explore?: boolean;
  startupId?: number;
  profile?: StartupProfileData | null;
  onSelectOpportunity: (o: OpportunityItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<OpportunityType>("Todos");
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Controles de Filtro e Ordenação
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("match-desc");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("Todas");
  const [selectedModality, setSelectedModality] = useState<string>("Todas");
  const [minMatch, setMinMatch] = useState<number>(0);
  const [applyProfilePrefs, setApplyProfilePrefs] = useState<boolean>(!explore);

  useEffect(() => {
    setApplyProfilePrefs(!explore && (profile?.receiveAiRecommendations ?? true));
  }, [explore, profile?.receiveAiRecommendations]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getMatches(startupId).catch(() => [] as MatchItem[]),
      api.getOpportunities().catch(() => [] as OpportunityItem[]),
    ])
      .then(([matches, opps]) => {
        const scoreByOppId = new Map<string, number>();
        matches.forEach((m) => {
          if (m.opportunityId) scoreByOppId.set(String(m.opportunityId), m.matchScore);
          if (m.opportunityCode) scoreByOppId.set(String(m.opportunityCode), m.matchScore);
        });

        const formatted: OpportunityItem[] = opps.map((o) => {
          const calculatedScore =
            scoreByOppId.get(String(o.id)) ??
            scoreByOppId.get(String(o.code)) ??
            o.match ??
            o.matchScore ??
            89;
          return {
            id: o.id,
            code: o.code,
            type: formatOppType(o.type),
            title: o.title,
            short: o.shortDescription || o.short || o.description,
            description: o.description,
            match: calculatedScore,
            meta: o.meta || o.metaInfo || "Prazo 15/10/2026 · Brasil · Remoto",
            tags: o.tags || "setor • tecnologia • objetivo",
            color: getBadgeColorByType(o.type, o.color),
            status: o.status,
            externalUrl: o.externalUrl,
          };
        });
        formatted.sort((a, b) => b.match - a.match);
        setItems(formatted);
      })
      .finally(() => setLoading(false));
  }, [startupId]);

  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    items.forEach((it) => platforms.add(detectPlatformLabel(it)));
    return ["Todas", ...Array.from(platforms)];
  }, [items]);

  const preferredTypesList = useMemo(() => {
    if (!profile?.opportunityTypes) return [];
    return profile.opportunityTypes
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [profile?.opportunityTypes]);

  const list = useMemo(() => {
    const filtered = items.filter((x) => {
      // 1. Filtro por aba de tipo (Todos, Editais, Eventos, POCs, Compras)
      const matchesTypeTab =
        type === "Todos" ||
        (type === "POCs"
          ? x.type.toUpperCase() === "POC"
          : x.type.toLowerCase() === type.slice(0, -1).toLowerCase());
      if (!matchesTypeTab) return false;

      // 2. Filtro de preferências de matching do perfil (na aba Para você quando ativo)
      if (!explore && applyProfilePrefs && type === "Todos" && preferredTypesList.length > 0) {
        const normType = x.type.toLowerCase();
        const matchesPrefType = preferredTypesList.some(
          (pt) =>
            pt.includes(normType) ||
            (normType === "edital" && pt.includes("edita")) ||
            (normType === "evento" && pt.includes("event"))
        );
        if (!matchesPrefType) return false;
      }

      // 3. Filtro por Plataforma / Origem
      if (selectedPlatform !== "Todas" && detectPlatformLabel(x) !== selectedPlatform) {
        return false;
      }

      // 4. Filtro por Modalidade (Remoto, Presencial, Híbrido)
      if (
        selectedModality !== "Todas" &&
        !`${x.meta} ${x.description}`.toLowerCase().includes(selectedModality.toLowerCase())
      ) {
        return false;
      }

      // 5. Filtro por Aderência mínima
      if (minMatch > 0 && x.match < minMatch) {
        return false;
      }

      // 6. Busca textual
      if (
        query.trim() &&
        !`${x.title} ${x.short} ${x.tags} ${x.description}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered];
    if (sortBy === "match-desc") sorted.sort((a, b) => b.match - a.match);
    else if (sortBy === "match-asc") sorted.sort((a, b) => a.match - b.match);
    else if (sortBy === "title-asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "title-desc") sorted.sort((a, b) => b.title.localeCompare(a.title));

    return sorted;
  }, [
    items,
    type,
    explore,
    applyProfilePrefs,
    preferredTypesList,
    selectedPlatform,
    selectedModality,
    minMatch,
    query,
    sortBy,
  ]);

  const sortLabels: Record<SortOption, string> = {
    "match-desc": "Maior match",
    "match-asc": "Menor match",
    "title-asc": "Título (A–Z)",
    "title-desc": "Título (Z–A)",
  };

  const activeFiltersCount =
    (selectedPlatform !== "Todas" ? 1 : 0) +
    (selectedModality !== "Todas" ? 1 : 0) +
    (minMatch > 0 ? 1 : 0);

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />

      <div className="mb-6 rounded-2xl bg-[#111827] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[32px] font-black text-[#FEC908]">95%</div>
          <div className="text-xs text-gray-300">de compatibilidade média com seu perfil</div>
        </div>
        <p className="text-xs text-gray-400 max-w-md">Oportunidades, editais e demandas corporativas priorizadas pela IA da StartIn para sua startup.</p>
      </div>

      <PageTitle
        title="Para você"
        description="O que a IA da StartIn encontrou e priorizou para sua startup."
      />

      {preferredTypesList.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[#111827]">
            <Sparkles size={15} className="text-[#FEC908]" />
            <span>
              Preferências de matching da startup:{" "}
              <strong>{profile?.opportunityTypes || "POC, Compra, Editais"}</strong>
              {profile?.areasOfInterest ? ` · Áreas: ${profile.areasOfInterest}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setApplyProfilePrefs((prev) => !prev)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                applyProfilePrefs
                  ? "bg-[#111827] text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              {applyProfilePrefs ? "Filtro do perfil ativo" : "Mostrando todos os tipos"}
            </button>
            <button
              type="button"
              onClick={() => go("account")}
              className="text-[11px] font-bold text-[#111827] hover:underline"
            >
              Editar preferências
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e0e5e9] bg-white p-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96a1aa]"
            size={16}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar editais, eventos ou clientes..."
            className="h-10 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#9ca7af]"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-bold transition ${
            showFilters || activeFiltersCount > 0
              ? "border-[#111827] bg-gray-100 text-[#111827]"
              : "border-[#dfe5e9] text-[#42617e] hover:bg-[#f5f8fa]"
          }`}
        >
          <Filter size={14} /> Filtros
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-[#111827] px-1.5 py-0.5 text-[10px] text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

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
                  ["title-asc", "Ordem alfabética (A–Z)"],
                  ["title-desc", "Ordem alfabética (Z–A)"],
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
                      ? "bg-gray-100 text-[#111827] font-bold"
                      : "text-gray-700 hover:bg-gray-50"
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

      {showFilters && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-xs font-extrabold text-[#111827]">
              Filtrar por plataforma, formato e aderência
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform("Todas");
                setSelectedModality("Todas");
                setMinMatch(0);
              }}
              className="text-[11px] font-bold text-[#111827] hover:underline"
            >
              Resetar filtros
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="mb-2 text-[11px] font-bold text-gray-700">
                Plataforma / Origem encontrada
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availablePlatforms.map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setSelectedPlatform(plat)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      selectedPlatform === plat
                        ? "bg-[#111827] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold text-gray-700">Modalidade</p>
              <div className="flex flex-wrap gap-1.5">
                {["Todas", "Remoto", "Presencial", "Híbrido"].map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModality(mod)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      selectedModality === mod
                        ? "bg-[#111827] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold text-gray-700">Aderência mínima</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  [0, "Todas"],
                  [80, "80%+"],
                  [85, "85%+"],
                  [90, "90%+"],
                ].map(([val, label]) => (
                  <button
                    key={String(label)}
                    type="button"
                    onClick={() => setMinMatch(Number(val))}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      minMatch === Number(val)
                        ? "bg-[#111827] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2 overflow-auto pb-1">
        {(["Todos", "Editais", "Eventos", "POCs", "Compras"] as OpportunityType[]).map((x) => (
          <button
            key={x}
            onClick={() => setType(x)}
            className={`rounded-full px-5 py-2 text-xs font-bold whitespace-nowrap transition ${
              type === x
                ? "bg-[#111827] text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="mt-7 flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#123b62]">
            {loading
              ? "Carregando oportunidades..."
              : list.length
              ? `${list.length} ${
                  list.length === 1 ? "oportunidade priorizada" : "oportunidades priorizadas"
                }`
              : "Nenhuma oportunidade encontrada"}
          </h2>
          <p className="mt-1 text-xs text-[#88949d]">
            Ordenadas por: <strong>{sortLabels[sortBy]}</strong> ·{" "}
            {selectedPlatform !== "Todas" ? `Plataforma: ${selectedPlatform}` : "Todas as fontes"}
          </p>
        </div>
        {(query || type !== "Todos" || activeFiltersCount > 0 || !applyProfilePrefs) && (
          <button
            onClick={() => {
              setQuery("");
              setType("Todos");
              setSelectedPlatform("Todas");
              setSelectedModality("Todas");
              setMinMatch(0);
              setApplyProfilePrefs(false);
            }}
            className="text-xs font-bold text-[#111827] hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
      {list.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((item) => (
            <OpportunityCard
              key={item.id}
              item={item}
              onSelect={(opp) => {
                onSelectOpportunity(opp);
                go("opportunity");
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-16 text-center">
          <Sparkles className="mx-auto text-[#FEC908]" size={30} fill="currentColor" />
          <p className="mt-4 text-sm font-bold text-[#234666]">
            Não encontramos oportunidades compatíveis com os filtros atuais
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8a969f]">
            Tente ampliar sua busca, mostrar todos os tipos ou atualizar as preferências da startup.
          </p>
          <div className="mt-5 flex justify-center gap-4">
            <button
              onClick={() => {
                setQuery("");
                setType("Todos");
                setSelectedPlatform("Todas");
                setSelectedModality("Todas");
                setMinMatch(0);
                setApplyProfilePrefs(false);
              }}
              className="text-xs font-bold text-[#111827] hover:underline"
            >
              Mostrar todas as oportunidades
            </button>
            <button
              onClick={() => go("preferences")}
              className="text-xs font-bold text-[#111827] hover:underline"
            >
              Atualizar preferências
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OpportunityDetail({
  go,
  selectedOpportunity,
  startupId,
  profile,
  onSavedChange,
}: {
  go: (s: Screen) => void;
  selectedOpportunity: OpportunityItem | null;
  startupId?: number;
  profile: StartupProfileData | null;
  onSavedChange?: () => void;
}) {
  const [item, setItem] = useState<OpportunityItem | null>(selectedOpportunity);
  const [joined, setJoined] = useState(false);
  const [matchId, setMatchId] = useState<number | undefined>(undefined);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (selectedOpportunity) {
      setItem(selectedOpportunity);
      const savedLocally = getLocalSavedOpportunities().some(
        (x) =>
          String(x.id) === String(selectedOpportunity.id) ||
          x.title === selectedOpportunity.title
      );
      setJoined(savedLocally);
      api
        .getMatches(startupId)
        .then((matches) => {
          const found = matches.find(
            (m) =>
              String(m.opportunityId) === String(selectedOpportunity.id) ||
              (m.opportunityTitle &&
                selectedOpportunity.title &&
                m.opportunityTitle.toLowerCase() === selectedOpportunity.title.toLowerCase())
          );
          if (found) {
            setMatchId(found.id);
            const isSavedInDb =
              found.status === "INTERESSE_ENVIADO" || found.status === "SALVO";
            setJoined(isSavedInDb || savedLocally);
          }
        })
        .catch(() => {});
    } else {
      api
        .getOpportunities()
        .then((list) => {
          if (list.length > 0) setItem(list[0]);
        })
        .catch(() => {});
    }
  }, [selectedOpportunity, startupId]);

  const handleParticipate = async () => {
    if (!item || savingStatus) return;
    setSavingStatus(true);
    try {
      if (joined) {
        // Remover interesse tanto localmente quanto no MySQL
        setJoined(false);
        removeOpportunityLocally(item.id);
        removeOpportunityLocally(item.title);
        await api
          .unparticipateInOpportunity(startupId, item.id, matchId, item.title)
          .catch(() => {});
      } else {
        // Salvar interesse tanto localmente quanto no MySQL
        setJoined(true);
        saveOpportunityLocally(item);
        await api.participateInOpportunity(startupId, item.id).catch(() => {});
      }
      onSavedChange?.();
    } finally {
      setSavingStatus(false);
    }
  };

  if (!item) return <p className="text-sm text-[#73808b]">Carregando oportunidade...</p>;

  const metaParts = (item.meta || "Prazo 15/10/2026 · Brasil · Remoto")
    .split("·")
    .map((s) => s.trim());
  const deadlineText = (metaParts[0] || "15/10/2026").replace(/^Prazo\s+/i, "");
  const locationText = metaParts.length > 1 ? metaParts.slice(1).join(" · ") : "Brasil · Remoto";
  const modalityText =
    formatOppType(item.type) === "Edital"
      ? "Apoio financeiro"
      : formatOppType(item.type) === "POC"
      ? "Prova de conceito"
      : formatOppType(item.type);

  const rawUrl = (item.externalUrl || item.url || "").trim();
  const specificUrl =
    rawUrl &&
    rawUrl !== "https://inovastartups.com.br/" &&
    rawUrl !== "https://inovastartups.com.br" &&
    rawUrl !== "https://fapesp.br/pipe/chamadas" &&
    rawUrl !== "http://www.finep.gov.br/chamadas-publicas/chamadaspublicas?situacao=aberta"
      ? rawUrl
      : item.title.toLowerCase().includes("fapesp")
      ? "https://fapesp.br/pipe/jornada-tecnologica-2026-fase-1"
      : item.title.toLowerCase().includes("finep")
      ? "https://legacy.finep.gov.br/a-finep-externo/edital-efpc"
      : "https://inovastartups.com.br/edital-inova-6a-edicao.pdf";

  return (
    <>
      <button
        onClick={() => go("for-you")}
        className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> Voltar para Para você
      </button>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${getBadgeColorByType(
                item.type,
                item.color
              )}`}
            >
              {formatOppType(item.type).toUpperCase()}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold text-[#111827]">
              Fonte: {detectPlatformLabel(item)}
            </span>
          </div>
          <h1 className="mt-4 text-[29px] font-extrabold tracking-[-.05em] text-[#111827]">
            {item.title}
          </h1>
          <p className="mt-2 text-sm text-[#73808b]">{item.short || item.shortDescription}</p>
        </div>
        <div className="rounded-xl bg-[#e7f4ed] px-5 py-3 text-center">
          <div className="text-[25px] font-extrabold text-[#25805e]">
            {item.match || item.matchScore || 96}%
          </div>
          <div className="text-[10px] text-[#477660]">de aderência</div>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Prazo", deadlineText],
          ["Localização", locationText],
          ["Modalidade", modalityText],
          ["Status", "Inscrições abertas"],
        ].map(([a, b]) => (
          <div key={a} className="rounded-xl border border-[#e2e7eb] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase text-[#9aa4ac]">{a}</p>
            <p className="mt-2 text-xs font-bold text-[#244766]">{b}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-[#e2e7eb] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#111827]">Sobre a oportunidade</h2>
          <p className="mt-4 text-sm leading-7 text-[#65747f]">{item.description}</p>

          <h3 className="mt-8 text-sm font-extrabold text-[#111827]">
            Por que este match faz sentido
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              [
                "01",
                "Perfil",
                profile?.mainArea
                  ? `${profile.mainArea} · ${profile.businessModel || "SaaS · B2B"}`
                  : "Healthtech · SaaS · B2B",
              ],
              [
                "02",
                "Tecnologias",
                profile?.technologies
                  ? profile.technologies.replace(/,/g, " · ")
                  : "IA · Dados · Automação",
              ],
              ["03", "Objetivo", profile?.mainObjective || "Validação em ambiente real"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl bg-[#f5f8fa] p-4">
                <div className="text-[10px] font-extrabold text-[#111827]">{n}</div>
                <p className="mt-3 text-xs font-bold text-[#345572]">{t}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#81909b]">{d}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <Sparkles className="text-[#FEC908]" size={20} />
          <h2 className="mt-4 text-lg font-extrabold leading-6 text-[#111827]">
            Essa oportunidade combina com você
          </h2>
          <p className="mt-3 text-xs leading-5 text-[#6d7e8b]">
            A IA identificou alta aderência entre seu perfil, suas tecnologias e os requisitos.
          </p>
          <div className="mt-5 space-y-2.5">
            <PrimaryButton full disabled={savingStatus} onClick={handleParticipate}>
              {joined ? (
                <>
                  <Check size={16} /> Interesse registrado (Clique para remover)
                </>
              ) : (
                <>
                  Participar <ArrowRight size={16} />
                </>
              )}
            </PrimaryButton>

            <a
              href={specificUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#111827] bg-white px-4 text-xs font-extrabold text-[#111827] transition hover:bg-gray-100"
            >
              Acessar página oficial da oportunidade <ExternalLink size={14} />
            </a>
          </div>

          {joined && (
            <button
              type="button"
              onClick={() => go("saved-opportunities")}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#d9f1e5] py-2 text-xs font-bold text-[#166d48] transition hover:bg-[#c5e9d7]"
            >
              <Bookmark size={13} /> Ver em Interesses salvos
            </button>
          )}

          <button
            onClick={() => go("for-you")}
            className="mt-3 w-full text-center text-xs font-bold text-[#111827] hover:underline"
          >
            Voltar para oportunidades
          </button>
        </aside>
      </div>
    </>
  );
}

export function SavedOpportunities({
  go,
  startupId,
  onSelectOpportunity,
  onSavedChange,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  onSelectOpportunity: (o: OpportunityItem) => void;
  onSavedChange?: () => void;
}) {
  const [savedList, setSavedList] = useState<(OpportunityItem & { matchId?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = () => {
    setLoading(true);
    const localItems = getLocalSavedOpportunities();
    api
      .getMatches(startupId)
      .then((matches) => {
        const backendSaved: (OpportunityItem & { matchId?: number })[] = matches
          .filter((m) => m.status === "INTERESSE_ENVIADO" || m.status === "SALVO")
          .map((m) => ({
            id: m.opportunityId || m.id,
            matchId: m.id,
            code: m.opportunityCode,
            type: formatOppType(m.opportunityType),
            title: m.opportunityTitle,
            short: m.opportunityShort || m.justification,
            description: m.opportunityDescription || m.justification,
            match: m.matchScore || 92,
            meta: m.opportunityMeta || "Inscrições abertas · Brasil",
            tags: m.opportunityTags || "IA • Dados • Inovação",
            color: getBadgeColorByType(m.opportunityType, m.opportunityColor),
            externalUrl: m.opportunityExternalUrl,
          }));

        const mergedMap = new Map<string, OpportunityItem & { matchId?: number }>();
        [...localItems, ...backendSaved].forEach((item) => {
          mergedMap.set(item.title.toLowerCase(), item);
        });
        setSavedList(Array.from(mergedMap.values()));
      })
      .catch(() => {
        setSavedList(localItems);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSaved();
  }, [startupId]);

  const handleRemoveSaved = async (item: OpportunityItem & { matchId?: number }) => {
    removeOpportunityLocally(item.id);
    removeOpportunityLocally(item.title);
    setSavedList((prev) =>
      prev.filter(
        (x) =>
          String(x.id) !== String(item.id) &&
          x.title.toLowerCase() !== item.title.toLowerCase()
      )
    );
    try {
      await api.unparticipateInOpportunity(startupId, item.id, item.matchId, item.title);
    } catch {
      // Ignora falha de rede local
    }
    onSavedChange?.();
  };

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />
      <PageTitle
        title="Interesses salvos"
        description="Oportunidades em que você clicou em Participar ou registrou interesse."
        action={
          <PrimaryButton secondary onClick={() => go("for-you")}>
            Explorar mais oportunidades
          </PrimaryButton>
        }
      />

      {loading ? (
        <p className="mt-8 text-sm text-[#73808b]">Carregando suas oportunidades salvas...</p>
      ) : savedList.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {savedList.map((item) => {
            const badgeColor = getBadgeColorByType(item.type, item.color);
            const raw = (item.externalUrl || item.url || "").trim();
            const url =
              raw &&
              raw !== "https://inovastartups.com.br/" &&
              raw !== "https://inovastartups.com.br" &&
              raw !== "https://fapesp.br/pipe/chamadas" &&
              raw !== "http://www.finep.gov.br/chamadas-publicas/chamadaspublicas?situacao=aberta"
                ? raw
                : item.title.toLowerCase().includes("fapesp")
                ? "https://fapesp.br/pipe/jornada-tecnologica-2026-fase-1"
                : item.title.toLowerCase().includes("finep")
                ? "https://legacy.finep.gov.br/a-finep-externo/edital-efpc"
                : "https://inovastartups.com.br/edital-inova-6a-edicao.pdf";
            return (
              <article key={`${item.id}-${item.title}`} className="startin-opp-card flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md overflow-hidden min-w-0 w-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold shrink-0 ${badgeColor}`}>
                      {formatOppType(item.type)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f6ed] px-2.5 py-1 text-[10px] font-bold text-[#18734d] shrink-0">
                      <Check size={11} /> Interesse registrado
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[22px] font-extrabold tracking-[-.06em] text-[#25805e]">
                      {item.match}%
                    </div>
                    <div className="text-[10px] text-[#94a0a8]">match</div>
                  </div>
                </div>

                <div className="my-3 min-w-0 flex-1 overflow-hidden">
                  <h3 className="text-[15px] font-extrabold leading-5 text-[#111827] break-words line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#75818b] break-all break-words line-clamp-3 overflow-hidden text-ellipsis">{item.short}</p>
                  <p className="mt-2 text-[11px] font-semibold text-[#5a7184] truncate">{item.meta}</p>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#eef1f3] pt-4 min-w-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOpportunity(item);
                        go("opportunity");
                      }}
                      className="flex items-center gap-1 text-xs font-extrabold text-[#111827] hover:underline"
                    >
                      Ver detalhes <ArrowRight size={13} />
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#25805e] hover:underline"
                    >
                      Página oficial <ExternalLink size={12} />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSaved(item)}
                    title="Remover dos salvos"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#9aa5ae] transition hover:bg-[#fff1f1] hover:text-[#c93b3b]"
                  >
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-16 text-center">
          <Bookmark className="mx-auto text-[#111827]" size={30} />
          <p className="mt-4 text-sm font-bold text-[#234666]">
            Você ainda não registrou interesse em nenhuma oportunidade
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#8a969f]">
            Ao acessar uma oportunidade e clicar em <strong>Participar</strong>, ela ficará salva aqui para acompanhamento rápido.
          </p>
          <div className="mt-6 flex justify-center">
            <PrimaryButton onClick={() => go("for-you")}>
              Ver oportunidades recomendadas <ArrowRight size={15} />
            </PrimaryButton>
          </div>
        </div>
      )}
    </>
  );
}
