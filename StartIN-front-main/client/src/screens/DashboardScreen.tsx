import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "@/icons";
import { BackButton, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import {
  api,
  type CompanyDashboardSummary,
  type DashboardSummary,
  type OpportunityItem,
  type StartupMatchItem,
} from "@/lib/api";
import type { Screen } from "@/types/startin";
import { formatOppType, getBadgeColorByType, getInitials } from "@/utils/formatters";

export function Dashboard({
  go,
  startupId,
  startupName,
  onSelectOpportunityById,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  startupName: string;
  onSelectOpportunityById: (id: string | number) => void;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api
      .getDashboardSummary(startupId)
      .then((res) => setSummary(res))
      .catch(() => {});
  }, [startupId]);

  const greeting = summary?.greeting || `Olá, ${startupName || "Nexa Health"} 👋`;
  const pendingCount = summary?.pendingActionsCount ?? 4;
  const pendingText =
    summary?.pendingActionsText ||
    "Novos matches calculados pela IA · acompanhe prazos e empresas compatíveis";

  const stats: [string, string, string][] = [
    [
      String(summary?.opportunitiesFoundCount ?? summary?.savedOpportunitiesCount ?? 0),
      "Oportunidades encontradas",
      "Soma histórica acumulada pela IA",
    ],
    [
      String(summary?.companyMatchesCount ?? 1),
      "Empresas com match",
      "Organizações compatíveis na plataforma",
    ],
    [
      String(summary?.newMatchesLastUpdateCount ?? summary?.newMatchesCount ?? 0),
      "Matches novos",
      "Identificados na última atualização da IA",
    ],
    [
      String(summary?.trackingCount ?? 0),
      "Em acompanhamento",
      "Oportunidades salvas pela startup",
    ],
  ];

  const deadlines =
    summary?.upcomingDeadlines && summary.upcomingDeadlines.length > 0
      ? summary.upcomingDeadlines
      : [
          {
            id: "1",
            type: "EDITAL",
            title: "Inovação Aberta 2026",
            subtitle: "Inscrições abertas · Brasil",
          },
          {
            id: "3",
            type: "POC",
            title: "POC — Gestão Inteligente",
            subtitle: "Demanda corporativa ativa",
          },
        ];

  const activities =
    summary?.recentActivities && summary.recentActivities.length > 0
      ? summary.recentActivities
      : [
          {
            text: `Match corporativo ativo para ${startupName || "sua startup"}`,
            time: "hoje",
          },
          { text: "Motor de IA verificou editais e oportunidades compatíveis", time: "recente" },
        ];

  return (
    <>
      <PageTitle
        title={greeting}
        description="Visão geral dos resultados acumulados pela IA e das oportunidades compatíveis com seu estágio."
        action={
          <PrimaryButton secondary onClick={() => go("notifications")}>
            Ver atividade
          </PrimaryButton>
        }
      />
      <div className="mt-8 rounded-2xl bg-[#111827] p-6 text-white md:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-300">
              Você tem {pendingCount} ações para acompanhar
            </p>
            <h2 className="mt-2 text-[20px] font-extrabold tracking-[-.03em]">{pendingText}</h2>
          </div>
          <Zap className="hidden text-[#FEC908] md:block" size={30} fill="currentColor" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([n, label, helper]) => (
          <div key={label} className="rounded-xl border border-[#e5eaee] bg-white p-5">
            <div className="text-[28px] font-extrabold tracking-[-.05em] text-[#111827]">{n}</div>
            <div className="mt-1 text-xs font-bold text-[#111827]">{label}</div>
            <div className="mt-0.5 text-[10.5px] text-[#8895a0]">{helper}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-[#e5eaee] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#111827]">Próximos prazos</h2>
            <button
              onClick={() => go("for-you")}
              className="text-xs font-bold text-[#111827] hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {deadlines.map((d, idx) => (
              <div
                key={`${d.title}-${idx}`}
                onClick={() => {
                  if (d.id) onSelectOpportunityById(d.id);
                  else go("for-you");
                }}
                className="flex cursor-pointer items-center gap-4 rounded-xl bg-[#f7f9fb] p-4 transition hover:bg-[#eef3f7]"
              >
                <div className="flex h-9 min-w-[44px] items-center justify-center rounded-lg bg-[#fff2b8] px-2 text-[9px] font-extrabold text-[#775b00]">
                  {formatOppType(d.type).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#294866]">{d.title}</p>
                  <p className="mt-1 truncate text-[11px] text-[#89949d]">
                    {d.companyName ? `${d.companyName} · ` : ""}
                    {d.subtitle}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[#9aa6af]" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center gap-2 text-[#111827]">
            <TrendingUp size={17} />
            <h2 className="text-base font-extrabold">Atividade recente</h2>
          </div>
          <div className="mt-5 space-y-5">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-3 border-b border-gray-200 pb-4 last:border-0">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FEC908]" />
                <div>
                  <p className="text-xs font-semibold text-[#2a4b6a]">{act.text}</p>
                  <p className="mt-1 text-[10px] text-[#8193a1]">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// ==========================================================
// DASHBOARD CORPORATIVO (PERFIL EMPRESA)
// ==========================================================
export function CompanyDashboard({
  go,
  companyId,
  companyName,
  onEditOpportunity,
}: {
  go: (s: Screen) => void;
  companyId?: number;
  companyName: string;
  onEditOpportunity: (opp: OpportunityItem) => void;
}) {
  const [summary, setSummary] = useState<CompanyDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getCompanyDashboardSummary(companyId)
      .then((res) => setSummary(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  const greeting = summary?.greeting || `Olá, ${companyName || "Empresa Alpha"} 👋`;
  const bannerTitle =
    summary?.bannerTitle || "Painel de Inovação Aberta & Contratação de Startups";
  const bannerText =
    summary?.bannerText ||
    `${summary?.matchedStartupsCount ?? 0} startups compatíveis · ${
      summary?.pocsPurchasesCreatedCount ?? 0
    } POCs / Compras lançadas`;

  const stats: [string, string, string][] = [
    [
      String(summary?.matchedStartupsCount ?? 0),
      "Startups que deram match",
      "Startups compatíveis avaliadas pela IA",
    ],
    [
      String(summary?.pocsPurchasesCreatedCount ?? 0),
      "POCs / Compras lançadas",
      "Oportunidades corporativas criadas pela empresa",
    ],
  ];

  const recentOpps = summary?.recentOpportunities || [];
  const recentMatches = summary?.recentStartupMatches || [];

  return (
    <>
      <PageTitle
        title={greeting}
        description="Acompanhe suas POCs e Compras lançadas e o histórico de startups com match na plataforma."
        action={
          <PrimaryButton onClick={() => go("create-opportunity")}>
            <Plus size={15} /> Nova POC / Compra
          </PrimaryButton>
        }
      />

      <div className="mt-8 rounded-2xl bg-[#111827] p-6 text-white md:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-300">{bannerTitle}</p>
            <h2 className="mt-2 text-[20px] font-extrabold tracking-[-.03em]">{bannerText}</h2>
          </div>
          <Zap className="hidden text-[#FEC908] md:block" size={30} fill="currentColor" />
        </div>
      </div>

      {/* Apenas os 2 blocos solicitados para Empresa */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {stats.map(([n, label, helper]) => (
          <div key={label} className="rounded-xl border border-[#e5eaee] bg-white p-6">
            <div className="text-[30px] font-extrabold tracking-[-.05em] text-[#111827]">{n}</div>
            <div className="mt-1 text-sm font-extrabold text-[#111827]">{label}</div>
            <div className="mt-0.5 text-xs text-[#7d8993]">{helper}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        {/* Esquerda: Últimas POCs / Compras abertas (clique abre tela de edição) */}
        <section className="rounded-2xl border border-[#e5eaee] bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                Últimas POCs / Compras abertas
              </h2>
              <p className="mt-0.5 text-[11px] text-[#88949e]">
                Clique em qualquer oportunidade abaixo para editar seus dados ou status.
              </p>
            </div>
            <button
              onClick={() => go("my-opportunities")}
              className="shrink-0 text-xs font-bold text-[#111827] hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-xs text-[#7d8993]">Carregando oportunidades lançadas...</p>
            ) : recentOpps.length > 0 ? (
              recentOpps.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => {
                    onEditOpportunity(opp);
                    go("edit-opportunity");
                  }}
                  className="group flex cursor-pointer items-center gap-4 rounded-xl border border-transparent bg-[#f7f9fb] p-4 transition hover:border-[#111827] hover:bg-white"
                >
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold shrink-0 ${getBadgeColorByType(
                      opp.type,
                      opp.color
                    )}`}
                  >
                    {formatOppType(opp.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#111827]">{opp.title}</p>
                    <p className="mt-1 truncate text-[11px] text-[#7c8993]">
                      {opp.meta || opp.metaInfo || "Aberta · Brasil"} ·{" "}
                      <span className="font-semibold text-[#18734d]">
                        {opp.status === "ENCERRADA"
                          ? "Encerrada"
                          : opp.status === "EM_ANALISE"
                          ? "Em análise"
                          : "Publicada"}
                      </span>
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#111827] shadow-2xs group-hover:bg-[#111827] group-hover:text-[#FEC908]">
                    <Pencil size={12} /> Editar
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#d9e0e5] p-6 text-center">
                <p className="text-xs font-bold text-[#234666]">
                  Sua empresa ainda não publicou POCs ou Compras
                </p>
                <p className="mt-1 text-[11px] text-[#88949e]">
                  Lance sua primeira oportunidade para receber startups compatíveis.
                </p>
                <div className="mt-4 flex justify-center">
                  <PrimaryButton onClick={() => go("create-opportunity")}>
                    <Plus size={14} /> Lançar POC / Compra
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Direita: Últimas startups que deram match (clique abre histórico completo) */}
        <section
          onClick={() => go("company-matches-history")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:border-[#111827]"
        >
          <div className="flex items-center justify-between gap-2 text-[#111827]">
            <div className="flex items-center gap-2">
              <TrendingUp size={17} />
              <h2 className="text-base font-extrabold">Últimas startups que deram match</h2>
            </div>
            <span className="text-xs font-bold text-[#111827] underline">
              Histórico completo →
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#7c8993]">
            Clique para abrir o histórico completo de todas as startups compatíveis.
          </p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-xs text-[#7d8993]">Calculando matches com startups...</p>
            ) : recentMatches.length > 0 ? (
              recentMatches.slice(0, 5).map((st) => {
                const stName = st.startupName || st.name || "Startup";
                return (
                  <div
                    key={st.startupId || stName}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition hover:shadow-xs"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {st.avatarUrl ? (
                        <img
                          src={st.avatarUrl}
                          alt={stName}
                          className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-extrabold text-[#FEC908]">
                          {getInitials(stName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-extrabold text-[#111827]">{stName}</p>
                          {st.interestedInCompanyPoc && (
                            <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[9.5px] font-extrabold text-[#166534]">
                              Interesse salvo
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-[#788692]">
                          {st.mainArea || "Tecnologia"} · {st.currentStage || "Validação"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-[11px] font-extrabold text-[#854d0e]">
                        {st.matchScore}%
                      </span>
                      <ChevronRight size={15} className="text-[#9aa6af]" />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#7d8993]">
                Nenhuma startup compatível encontrada até o momento.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

// ==========================================================
// HISTÓRICO COMPLETO DE STARTUPS QUE DERAM MATCH (EMPRESA)
// ==========================================================
export function CompanyMatchesHistoryScreen({
  go,
  companyId,
  onSelectStartup,
}: {
  go: (s: Screen) => void;
  companyId?: number;
  onSelectStartup: (s: StartupMatchItem) => void;
}) {
  const [history, setHistory] = useState<StartupMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyInterested, setOnlyInterested] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getCompanyDashboardSummary(companyId)
      .then((res) => {
        if (Array.isArray(res.startupMatchesHistory) && res.startupMatchesHistory.length > 0) {
          setHistory(res.startupMatchesHistory);
        } else {
          return api.getCompanyStartupsMatches(companyId).then(setHistory);
        }
      })
      .catch(() => {
        api
          .getCompanyStartupsMatches(companyId)
          .then(setHistory)
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = useMemo(() => {
    return history.filter((s) => {
      if (onlyInterested && !s.interestedInCompanyPoc) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const target = `${s.startupName || s.name || ""} ${s.mainArea || ""} ${
          s.technologies || ""
        } ${s.currentStage || ""}`.toLowerCase();
        if (!target.includes(q)) return false;
      }
      return true;
    });
  }, [history, query, onlyInterested]);

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Histórico completo de startups com match"
        description="Todas as startups da plataforma que deram match com o perfil ou com as POCs e Compras lançadas pela sua empresa."
      />

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e0e5e9] bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96a1aa]"
            size={16}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar histórico por nome da startup, área ou tecnologia..."
            className="h-10 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#9ca7af]"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyInterested((prev) => !prev)}
          className={`rounded-lg px-4 py-2.5 text-xs font-extrabold transition ${
            onlyInterested
              ? "bg-[#111827] text-[#FEC908]"
              : "border border-[#dfe5e9] bg-[#f8fafc] text-[#111827] hover:bg-gray-100"
          }`}
        >
          {onlyInterested
            ? "Mostrando: Interessadas nas POCs/Compras"
            : "Filtrar por interesse nas POCs/Compras"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-[#73808b]">Carregando histórico completo de matches...</p>
        ) : filtered.length > 0 ? (
          filtered.map((s) => {
            const stName = s.startupName || s.name || "Startup";
            const interestedOpps = s.interestedOpportunities || [];
            return (
              <div
                key={s.startupId || stName}
                onClick={() => {
                  onSelectStartup(s);
                  go("startup-detail");
                }}
                className="flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border border-[#e2e7eb] bg-white p-5 transition hover:border-[#111827] hover:shadow-md md:flex-row md:items-center"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {s.avatarUrl ? (
                    <img
                      src={s.avatarUrl}
                      alt={stName}
                      className="h-12 w-12 shrink-0 rounded-full border-2 border-[#111827] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-extrabold text-[#FEC908]">
                      {getInitials(stName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[#111827]">{stName}</h3>
                      {s.currentStage && (
                        <span className="rounded-md bg-[#fff6d6] px-2 py-0.5 text-[10px] font-bold text-[#854d0e]">
                          {s.currentStage}
                        </span>
                      )}
                      {s.interestedInCompanyPoc && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-extrabold text-[#166534]">
                          <Check size={10} /> Salvou / Participou de oportunidade sua
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {s.mainArea || "Inovação"} · {s.location || "Brasil"}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-[#475569] line-clamp-2">
                      {s.justification || s.problem || s.description}
                    </p>

                    {interestedOpps.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {interestedOpps.map((io) => (
                          <span
                            key={io.opportunityId}
                            className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[10.5px] font-bold text-[#166534]"
                          >
                            Interesse em: {io.title} ({formatOppType(io.type)})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 pt-3 md:flex-col md:items-end md:border-0 md:pt-0">
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-3 py-1 text-xs font-extrabold text-[#854d0e]">
                    <Sparkles size={12} /> {s.matchScore}% match
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#111827]">
                    Abrir perfil <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-14 text-center">
            <Rocket className="mx-auto text-[#111827]" size={30} />
            <p className="mt-4 text-sm font-bold text-[#234666]">
              Nenhuma startup encontrada para o filtro selecionado
            </p>
          </div>
        )}
      </div>
    </>
  );
}
