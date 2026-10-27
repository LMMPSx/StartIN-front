import { useEffect, useState } from "react";
import { ChevronRight, TrendingUp, Zap } from "@/icons";
import { PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, type DashboardSummary } from "@/lib/api";
import type { Screen } from "@/types/startin";

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
    "2 novos matches · 1 prazo próximo · 1 oportunidade atualizada";
  const stats = [
    [String(summary?.savedOpportunitiesCount ?? 12), "Oportunidades salvas"],
    [String(summary?.newMatchesCount ?? 4), "Matches novos"],
    [String(summary?.deadlinesThisWeekCount ?? 2), "Prazos esta semana"],
    [String(summary?.trackingCount ?? 7), "Em acompanhamento"],
  ];
  const deadlines =
    summary?.upcomingDeadlines && summary.upcomingDeadlines.length > 0
      ? summary.upcomingDeadlines
      : [
          {
            id: "1",
            type: "EDITAL",
            title: "Inovação Aberta 2026",
            subtitle: "Inscrições encerram em 5 dias",
          },
          {
            id: "2",
            type: "POC",
            title: "Gestão Inteligente",
            subtitle: "Resposta necessária até sexta-feira",
          },
        ];
  const activities =
    summary?.recentActivities && summary.recentActivities.length > 0
      ? summary.recentActivities
      : [
          {
            text: `Novo match: ${startupName || "Nexa Health"} × Empresa Alpha`,
            time: "há 2 horas",
          },
          { text: "Edital Inova+ teve atualização de prazo", time: "ontem" },
          { text: "Seu perfil foi atualizado", time: "18 set, 14:10" },
        ];

  return (
    <>
      <PageTitle
        title={greeting}
        description="Visão geral da sua atividade e das oportunidades que exigem atenção."
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
        {stats.map(([n, l]) => (
          <div key={l} className="rounded-xl border border-[#e5eaee] bg-white p-5">
            <div className="text-[27px] font-extrabold tracking-[-.05em] text-[#111827]">{n}</div>
            <div className="mt-1 text-xs text-[#7d8993]">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-[#e5eaee] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#111827]">Próximos prazos</h2>
            <button onClick={() => go("for-you")} className="text-xs font-bold text-[#111827] hover:underline">
              Ver todos
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {deadlines.map((d) => (
              <div
                key={d.title}
                onClick={() => {
                  if (d.id) onSelectOpportunityById(d.id);
                  else go("for-you");
                }}
                className="flex cursor-pointer items-center gap-4 rounded-xl bg-[#f7f9fb] p-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff2b8] text-[9px] font-extrabold text-[#775b00]">
                  {d.type}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#294866]">{d.title}</p>
                  <p className="mt-1 text-[11px] text-[#89949d]">{d.subtitle}</p>
                </div>
                <ChevronRight size={16} className="text-[#9aa6af]" />
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
