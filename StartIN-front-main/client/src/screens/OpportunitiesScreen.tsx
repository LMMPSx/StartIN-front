import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  Bot,
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  Search,
  Sparkles,
  Trash2,
} from "@/icons";
import { BackButton, OpportunityCard, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import {
  api,
  getSession,
  type MatchItem,
  type OpportunityItem,
  type StartupProfileData,
} from "@/lib/api";
import type { OpportunityType, Screen } from "@/types/startin";
import {
  computeAuditedClientMatchScore,
  formatOppType,
  getBadgeColorByType,
  getInitials,
} from "@/utils/formatters";

const LEGACY_GLOBAL_SAVED_OPPS_KEY = "startin-saved-opps";

function resolveProfileSavedStorageKey(startupId?: number): string | null {
  try {
    // Remove a chave global legada para impedir vazamento de salvos entre perfis/contas
    if (localStorage.getItem(LEGACY_GLOBAL_SAVED_OPPS_KEY) !== null) {
      localStorage.removeItem(LEGACY_GLOBAL_SAVED_OPPS_KEY);
    }
  } catch {}

  const session = getSession();
  if (session?.accountType === "COMPANY" && !startupId) {
    return null;
  }

  const resolvedStartupId = startupId ?? session?.startupProfileId;
  if (resolvedStartupId) {
    return `startin-saved-opps-startup-${resolvedStartupId}`;
  }
  if (session?.userId) {
    return `startin-saved-opps-user-${session.userId}`;
  }
  if (session?.email) {
    return `startin-saved-opps-email-${session.email.trim().toLowerCase()}`;
  }
  return null;
}

export function getLocalSavedOpportunities(startupId?: number): OpportunityItem[] {
  try {
    const key = resolveProfileSavedStorageKey(startupId);
    if (!key) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOpportunityLocally(item: OpportunityItem, startupId?: number): void {
  try {
    const key = resolveProfileSavedStorageKey(startupId);
    if (!key) return;
    const current = getLocalSavedOpportunities(startupId);
    const exists = current.some(
      (x) => String(x.id) === String(item.id) || x.title === item.title
    );
    if (!exists) {
      localStorage.setItem(key, JSON.stringify([item, ...current]));
    }
  } catch {}
}

export function removeOpportunityLocally(
  idOrTitle: string | number,
  startupId?: number
): void {
  try {
    const key = resolveProfileSavedStorageKey(startupId);
    if (!key) return;
    const current = getLocalSavedOpportunities(startupId);
    const next = current.filter(
      (x) => String(x.id) !== String(idOrTitle) && x.title !== String(idOrTitle)
    );
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

function detectPlatformLabel(item: OpportunityItem): string {
  if (item.companyName) return item.companyName;
  const combined = `${item.externalUrl || ""} ${item.title || ""} ${item.tags || ""}`.toLowerCase();
  if (combined.includes("fapesp") || combined.includes("pipe")) return "FAPESP PIPE";
  if (combined.includes("finep")) return "FINEP";
  if (combined.includes("inovastartups") || combined.includes("sebrae"))
    return "InovaStartups / Sebrae";
  if (combined.includes("startupconnect") || combined.includes("recife"))
    return "Ecossistema / Eventos";
  return "StartIn / Corporativo";
}

function isCorporateOpportunity(typeLabel: string): boolean {
  const norm = formatOppType(typeLabel);
  return norm === "POC" || norm === "Primeira Compra" || norm === "Compra";
}

function isTracaoStage(stage?: string): boolean {
  const s = (stage || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return s.includes("tracao");
}

type SortOption = "match-desc" | "match-asc" | "title-asc" | "title-desc";

export function Opportunities({
  go,
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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("match-desc");

  const tracaoActive = isTracaoStage(profile?.currentStage);

  // Se o estágio mudar, garante que a aba selecionada seja válida para o estágio
  useEffect(() => {
    if (tracaoActive && (type === "POCs" || type === "Primeira Compra")) {
      setType("Todos");
    } else if (!tracaoActive && type === "Compras") {
      setType("Todos");
    }
  }, [tracaoActive, type]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getMatches(startupId).catch(() => [] as MatchItem[]),
      api.getOpportunities().catch(() => [] as OpportunityItem[]),
    ])
      .then(([matches, opps]) => {
        const matchByOppKey = new Map<string, MatchItem>();
        matches.forEach((m) => {
          if (m.opportunityId) matchByOppKey.set(String(m.opportunityId), m);
          if (m.opportunityCode) matchByOppKey.set(String(m.opportunityCode), m);
        });

        const formatted: OpportunityItem[] = opps.map((o) => {
          const matched =
            matchByOppKey.get(String(o.id)) ||
            (o.code ? matchByOppKey.get(String(o.code)) : undefined);
          const calculatedScore =
            matched?.matchScore ?? computeAuditedClientMatchScore(profile, o);

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
            companyId: o.companyId ?? matched?.opportunityCompanyId,
            companyName: o.companyName ?? matched?.opportunityCompanyName,
          };
        });
        formatted.sort((a, b) => b.match - a.match);
        setItems(formatted);
      })
      .finally(() => setLoading(false));
  }, [startupId, profile?.mainArea, profile?.technologies, profile?.currentStage]);

  const availableTypeTabs: OpportunityType[] = tracaoActive
    ? ["Todos", "Editais", "Eventos", "Compras"]
    : ["Todos", "Editais", "Eventos", "POCs", "Primeira Compra"];

  const list = useMemo(() => {
    const filtered = items.filter((x) => {
      const formattedType = formatOppType(x.type);

      // 1. Regra de negócio automática por Estágio da Startup:
      // - Tração: vê Compras, Editais e Eventos (sem POCs e sem Primeira Compra)
      // - Validação: vê POCs, Primeira Compra, Editais e Eventos (sem Compras de escala pura)
      if (tracaoActive) {
        if (formattedType === "POC" || formattedType === "Primeira Compra") {
          return false;
        }
      } else {
        if (formattedType === "Compra") {
          return false;
        }
      }

      // 2. Filtro por aba de categoria
      const matchesTypeTab =
        type === "Todos" ||
        (type === "Editais" && formattedType === "Edital") ||
        (type === "Eventos" && formattedType === "Evento") ||
        (type === "POCs" && formattedType === "POC") ||
        (type === "Primeira Compra" && formattedType === "Primeira Compra") ||
        (type === "Compras" && formattedType === "Compra");
      if (!matchesTypeTab) return false;

      // 3. Busca textual
      if (
        query.trim() &&
        !`${x.title} ${x.short} ${x.tags} ${x.description} ${x.companyName || ""}`
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
  }, [items, tracaoActive, type, query, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    "match-desc": "Maior match",
    "match-asc": "Menor match",
    "title-asc": "Título (A–Z)",
    "title-desc": "Título (Z–A)",
  };

  const avgMatch =
    list.length > 0
      ? Math.round(list.reduce((acc, cur) => acc + (cur.match ?? 0), 0) / list.length)
      : 0;

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-[#111827] p-6 text-white md:flex-row md:items-center">
        <div>
          <div className="text-[32px] font-black text-[#FEC908]">{avgMatch}%</div>
          <div className="text-xs text-gray-300">de compatibilidade média com seu perfil</div>
        </div>
        <p className="max-w-md text-xs text-gray-400">
          Oportunidades filtradas automaticamente pela IA de acordo com o estágio atual da sua startup (
          <strong className="text-[#FEC908]">{tracaoActive ? "Tração" : "Validação"}</strong>).
        </p>
      </div>

      <PageTitle
        title="Para você"
        description="O que a IA da StartIn encontrou e priorizou para o momento atual da sua startup."
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-[#111827]">
          <Sparkles size={15} className="text-[#FEC908]" />
          <span>
            Estágio ativo: <strong>{tracaoActive ? "Tração" : "Validação"}</strong> —{" "}
            {tracaoActive
              ? "exibindo Compras Corporativas (sem POCs), Editais e Eventos"
              : "exibindo POCs, Primeira Compra, Editais e Eventos"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => go("account")}
          className="text-[11px] font-bold text-[#111827] hover:underline"
        >
          Alterar estágio em Conta e acesso
        </button>
      </div>

      {/* Barra limpa: apenas Busca + Ordenar (botão Filtros removido conforme especificação) */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e0e5e9] bg-white p-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96a1aa]"
            size={16}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar editais, eventos, empresas ou demandas..."
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
                      ? "bg-gray-100 font-bold text-[#111827]"
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

      <div className="mt-5 flex gap-2 overflow-auto pb-1">
        {availableTypeTabs.map((x) => (
          <button
            key={x}
            onClick={() => setType(x)}
            className={`rounded-full px-5 py-2 text-xs font-bold whitespace-nowrap transition ${
              type === x
                ? "bg-[#111827] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
            Ordenadas por: <strong>{sortLabels[sortBy]}</strong>
          </p>
        </div>
        {(query || type !== "Todos") && (
          <button
            onClick={() => {
              setQuery("");
              setType("Todos");
            }}
            className="text-xs font-bold text-[#111827] hover:underline"
          >
            Limpar busca
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
            Não encontramos oportunidades para a busca atual
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8a969f]">
            Limpe o termo pesquisado ou alterne entre as abas acima.
          </p>
          <div className="mt-5 flex justify-center gap-4">
            <button
              onClick={() => {
                setQuery("");
                setType("Todos");
              }}
              className="text-xs font-bold text-[#111827] hover:underline"
            >
              Ver todas do meu estágio
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
  onOpenCompanyById,
  onOpenInAssistant,
}: {
  go: (s: Screen) => void;
  selectedOpportunity: OpportunityItem | null;
  startupId?: number;
  profile: StartupProfileData | null;
  onSavedChange?: () => void;
  onOpenCompanyById?: (companyId?: number, companyName?: string) => void;
  onOpenInAssistant?: (opp: OpportunityItem) => void;
}) {
  const [item, setItem] = useState<OpportunityItem | null>(selectedOpportunity);
  const [joined, setJoined] = useState(false);
  const [matchId, setMatchId] = useState<number | undefined>(undefined);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (selectedOpportunity) {
      setItem(selectedOpportunity);
      // Garante companyId / companyName sincronizados com o backend
      if (
        selectedOpportunity.id &&
        (!selectedOpportunity.companyName || !selectedOpportunity.companyId)
      ) {
        api
          .getOpportunity(selectedOpportunity.id)
          .then((fresh) => {
            if (fresh) {
              setItem((prev) =>
                prev
                  ? {
                      ...prev,
                      companyId: fresh.companyId ?? prev.companyId,
                      companyName: fresh.companyName ?? prev.companyName,
                      externalUrl: fresh.externalUrl ?? prev.externalUrl,
                    }
                  : fresh
              );
            }
          })
          .catch(() => {});
      }

      const savedLocally = getLocalSavedOpportunities(startupId).some(
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
            if (found.opportunityCompanyId || found.opportunityCompanyName) {
              setItem((prev) =>
                prev
                  ? {
                      ...prev,
                      companyId: prev.companyId ?? found.opportunityCompanyId,
                      companyName: prev.companyName ?? found.opportunityCompanyName,
                    }
                  : prev
              );
            }
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
        setJoined(false);
        removeOpportunityLocally(item.id, startupId);
        removeOpportunityLocally(item.title, startupId);
        await api
          .unparticipateInOpportunity(startupId, item.id, matchId, item.title)
          .catch(() => {});
      } else {
        setJoined(true);
        saveOpportunityLocally(item, startupId);
        await api.participateInOpportunity(startupId, item.id).catch(() => {});
      }
      onSavedChange?.();
    } finally {
      setSavingStatus(false);
    }
  };

  if (!item) return <p className="text-sm text-[#73808b]">Carregando oportunidade...</p>;

  const formattedType = formatOppType(item.type);
  const corporateOpp =
    isCorporateOpportunity(item.type) || Boolean(item.companyId || item.companyName);
  const offeringCompanyName = item.companyName || "Empresa Alpha";

  const metaParts = (item.meta || "Prazo 15/10/2026 · Brasil · Remoto")
    .split("·")
    .map((s) => s.trim());
  const deadlineText = (metaParts[0] || "15/10/2026").replace(/^Prazo\s+/i, "");
  const locationText = metaParts.length > 1 ? metaParts.slice(1).join(" · ") : "Brasil · Remoto";
  const modalityText =
    formattedType === "Edital"
      ? "Apoio financeiro"
      : formattedType === "POC"
      ? "Prova de conceito (POC)"
      : formattedType === "Primeira Compra"
      ? "Primeira Compra B2B"
      : formattedType === "Compra"
      ? "Compra Corporativa"
      : formattedType;

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
    <div className="mx-auto w-full max-w-[1000px] min-w-0 overflow-hidden">
      <button
        onClick={() => go("for-you")}
        className="mb-4 flex items-center gap-2 text-xs font-bold text-[#6d7b87] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> Voltar para Para você
      </button>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${getBadgeColorByType(
                item.type,
                item.color
              )}`}
            >
              {formattedType.toUpperCase()}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold text-[#111827]">
              Fonte: {corporateOpp ? offeringCompanyName : detectPlatformLabel(item)}
            </span>
          </div>
          <h1 className="mt-3 text-[24px] font-extrabold leading-tight tracking-[-.04em] text-[#111827] break-words [overflow-wrap:anywhere]">
            {item.title}
          </h1>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#73808b] break-words [overflow-wrap:anywhere]">
            {item.short || item.shortDescription}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-[#e7f4ed] px-4 py-2.5 text-center">
          <div className="text-[22px] font-extrabold text-[#25805e]">
            {item.match || item.matchScore || 96}%
          </div>
          <div className="text-[10px] text-[#477660]">de aderência</div>
        </div>
      </div>

      {/* Card da Empresa Responsável pela Oportunidade (POC / Primeira Compra / Compra) */}
      {corporateOpp && (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#d6e2ed] bg-[#f8fbfe] p-4 shadow-2xs sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-extrabold text-[#FEC908]">
              {getInitials(offeringCompanyName)}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
                <Building2 size={12} /> Empresa ofertante desta {formattedType}
              </span>
              <h3 className="mt-0.5 truncate text-sm font-extrabold text-[#111827]">
                {offeringCompanyName}
              </h3>
              <p className="text-[11px] text-[#63798c]">
                Acesse o perfil corporativo para ver contatos diretos e oportunidades desta empresa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenCompanyById?.(item.companyId, offeringCompanyName)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#111827] px-3.5 py-2.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
          >
            Ver perfil da empresa <ArrowRight size={13} />
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          ["Prazo", deadlineText],
          ["Localização", locationText],
          ["Modalidade", modalityText],
          [
            "Status",
            item.status === "ENCERRADA"
              ? "Encerrada"
              : item.status === "EM_ANALISE"
              ? "Em análise"
              : "Inscrições abertas",
          ],
        ].map(([a, b]) => (
          <div key={a} className="min-w-0 rounded-xl border border-[#e2e7eb] bg-white p-3.5">
            <p className="text-[10px] font-semibold uppercase text-[#9aa4ac]">{a}</p>
            <p className="mt-1 truncate text-xs font-bold text-[#244766]" title={b}>
              {b}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2e7eb] bg-white p-5">
          <h2 className="text-base font-extrabold text-[#111827]">Sobre a oportunidade</h2>
          <div className="mt-2.5 max-h-[155px] overflow-y-auto rounded-xl border border-[#edf1f4] bg-[#fbfcfd] p-3.5">
            <p className="text-xs leading-6 text-[#65747f] whitespace-pre-line break-words [overflow-wrap:anywhere]">
              {item.description}
            </p>
          </div>

          <h3 className="mt-5 text-xs font-extrabold uppercase tracking-wider text-[#111827]">
            Por que este match faz sentido
          </h3>
          <div className="mt-3 grid gap-2.5 md:grid-cols-3">
            {[
              [
                "01",
                "Perfil",
                profile?.mainArea
                  ? `${profile.mainArea} · ${profile.businessModel || "SaaS · B2B"}`
                  : "Tecnologia · SaaS · B2B",
              ],
              [
                "02",
                "Tecnologias",
                profile?.technologies
                  ? profile.technologies.replace(/,/g, " · ")
                  : "IA · Dados · Automação",
              ],
              [
                "03",
                "Momento",
                profile?.currentStage
                  ? `Estágio ${profile.currentStage} compatível`
                  : "Compatível com os critérios exigidos",
              ],
            ].map(([n, t, d]) => (
              <div key={n} className="min-w-0 rounded-xl bg-[#f5f8fa] p-3.5">
                <div className="text-[10px] font-extrabold text-[#111827]">{n}</div>
                <p className="mt-2 text-xs font-bold text-[#345572]">{t}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#81909b] break-words [overflow-wrap:anywhere]">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-fit min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <Sparkles className="text-[#FEC908]" size={18} />
          <h2 className="mt-3 text-base font-extrabold leading-6 text-[#111827]">
            Essa oportunidade combina com você
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#6d7e8b]">
            Registre interesse para salvá-la ou abra diretamente no Assistente IA para gerar sua proposta ou template de submissão.
          </p>
          <div className="mt-4 space-y-2">
            <PrimaryButton full disabled={savingStatus} onClick={handleParticipate}>
              {joined ? (
                <>
                  <Check size={16} /> Interesse registrado (Clique para remover)
                </>
              ) : (
                <>
                  Participar / Salvar interesse <ArrowRight size={16} />
                </>
              )}
            </PrimaryButton>

            {onOpenInAssistant && (
              <button
                type="button"
                onClick={() => onOpenInAssistant(item)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
              >
                <Bot size={15} /> Gerar proposta / template na IA
              </button>
            )}

            {corporateOpp && !rawUrl ? (
              <button
                type="button"
                onClick={() => onOpenCompanyById?.(item.companyId, offeringCompanyName)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#111827] bg-white px-4 text-xs font-extrabold text-[#111827] transition hover:bg-gray-100"
              >
                <Building2 size={14} /> Abrir perfil de {offeringCompanyName}
              </button>
            ) : (
              <a
                href={specificUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#111827] bg-white px-4 text-xs font-extrabold text-[#111827] transition hover:bg-gray-100"
              >
                Acessar página oficial da oportunidade <ExternalLink size={14} />
              </a>
            )}
          </div>

          {joined && (
            <button
              type="button"
              onClick={() => go("saved-opportunities")}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#d9f1e5] py-2 text-xs font-bold text-[#166d48] transition hover:bg-[#c5e9d7]"
            >
              <Bookmark size={13} /> Ver em Interesses salvos
            </button>
          )}

          <button
            onClick={() => go("for-you")}
            className="mt-2.5 w-full text-center text-xs font-bold text-[#111827] hover:underline"
          >
            Voltar para oportunidades
          </button>
        </aside>
      </div>
    </div>
  );
}

export function SavedOpportunities({
  go,
  startupId,
  onSelectOpportunity,
  onSavedChange,
  onOpenInAssistant,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  onSelectOpportunity: (o: OpportunityItem) => void;
  onSavedChange?: () => void;
  onOpenInAssistant?: (opp: OpportunityItem) => void;
}) {
  const [savedList, setSavedList] = useState<(OpportunityItem & { matchId?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = () => {
    setLoading(true);
    const localItems = getLocalSavedOpportunities(startupId);
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
            companyId: m.opportunityCompanyId,
            companyName: m.opportunityCompanyName,
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
    removeOpportunityLocally(item.id, startupId);
    removeOpportunityLocally(item.title, startupId);
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
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Interesses salvos"
        description="Oportunidades salvas pela sua startup. Gere propostas e templates personalizados para cada uma com o Assistente IA."
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
            const corporate = isCorporateOpportunity(item.type);
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
              <article
                key={`${item.id}-${item.title}`}
                className="startin-opp-card flex w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${badgeColor}`}
                    >
                      {formatOppType(item.type)}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e5f6ed] px-2.5 py-1 text-[10px] font-bold text-[#18734d]">
                      <Check size={11} /> Interesse registrado
                    </span>
                    {item.companyName && (
                      <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[10px] font-bold text-[#334155]">
                        {item.companyName}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[22px] font-extrabold tracking-[-.06em] text-[#25805e]">
                      {item.match}%
                    </div>
                    <div className="text-[10px] text-[#94a0a8]">match</div>
                  </div>
                </div>

                <div className="my-3 min-w-0 flex-1 overflow-hidden">
                  <h3 className="line-clamp-2 break-words text-[15px] font-extrabold leading-5 text-[#111827]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 overflow-hidden text-ellipsis break-words text-xs leading-5 text-[#75818b]">
                    {item.short}
                  </p>
                  <p className="mt-2 truncate text-[11px] font-semibold text-[#5a7184]">
                    {item.meta}
                  </p>
                </div>

                {/* Botão direto para o Chat da IA com esta oportunidade selecionada */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenInAssistant) {
                        onOpenInAssistant(item);
                      } else {
                        onSelectOpportunity(item);
                        go("assistant");
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-3.5 py-2.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
                  >
                    <Bot size={14} /> Criar template / proposta com IA para esta oportunidade
                  </button>
                </div>

                <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[#eef1f3] pt-3.5">
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
                    {(!corporate || raw) && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#25805e] hover:underline"
                      >
                        Página oficial <ExternalLink size={12} />
                      </a>
                    )}
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
            Ao acessar uma oportunidade e clicar em <strong>Participar</strong>, ela ficará salva aqui e você poderá gerar templates de inscrição direto na IA.
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
