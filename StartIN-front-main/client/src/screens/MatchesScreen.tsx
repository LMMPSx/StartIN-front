import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Heart, Trash2 } from "@/icons";
import { BackButton, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, type MatchItem } from "@/lib/api";
import type { Screen } from "@/types/startin";
import { formatOppType } from "@/utils/formatters";
import {
  getLocalSavedOpportunities,
  removeOpportunityLocally,
  saveOpportunityLocally,
} from "./OpportunitiesScreen";

export function Matches({
  go,
  startupId,
  onSelectMatch,
  onSavedChange,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  onSelectMatch: (m: MatchItem) => void;
  onSavedChange?: () => void;
}) {
  const [matchesList, setMatchesList] = useState<MatchItem[]>([]);

  const loadMatches = () => {
    api
      .getMatches(startupId)
      .then((res) => {
        if (Array.isArray(res)) setMatchesList(res);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadMatches();
  }, [startupId]);

  const handleToggleSaveFromList = async (m: MatchItem) => {
    const isCurrentlySaved = m.status === "SALVO" || m.status === "INTERESSE_ENVIADO";
    const nextStatus = isCurrentlySaved ? "NOVO" : "SALVO";
    const targetStartupId = m.startupId || startupId;

    // Atualiza estado local imediatamente
    setMatchesList((prev) =>
      prev.map((item) =>
        item.id === m.id && item.opportunityTitle === m.opportunityTitle
          ? { ...item, status: nextStatus }
          : item
      )
    );

    if (isCurrentlySaved) {
      removeOpportunityLocally(m.opportunityId || m.id, targetStartupId);
      removeOpportunityLocally(m.opportunityTitle, targetStartupId);
      try {
        await api.unparticipateInOpportunity(
          targetStartupId,
          m.opportunityId,
          m.id,
          m.opportunityTitle
        );
      } catch {}
    } else {
      saveOpportunityLocally(
        {
          id: m.opportunityId || m.id,
          code: m.opportunityCode,
          type: formatOppType(m.opportunityType),
          title: m.opportunityTitle,
          short: m.opportunityShort || m.justification,
          description: m.opportunityDescription || m.justification,
          match: m.matchScore ?? 0,
          meta: m.opportunityMeta || "Inscrições abertas · Brasil",
          tags: m.opportunityTags || "IA • Dados • Inovação",
          externalUrl: m.opportunityExternalUrl,
        },
        targetStartupId
      );
      if (m.id) {
        try {
          await api.updateMatchStatus(m.id, "SALVO");
        } catch {}
      }
    }
    onSavedChange?.();
  };

  const avgScore = matchesList.length
    ? Math.round(matchesList.reduce((acc, m) => acc + (m.matchScore ?? 0), 0) / matchesList.length)
    : 0;

  const interesseCount = matchesList.filter(
    (m) => m.status === "INTERESSE_ENVIADO" || m.status === "SALVO"
  ).length;
  const contatoCount = matchesList.filter((m) => m.status === "CONTATO_INICIADO").length || 1;
  const negociacaoCount = matchesList.filter((m) => m.status === "EM_NEGOCIACAO").length || 1;

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Seus matches"
        description="Conexões com maior potencial para sua startup."
      />
      <div className="mt-8 rounded-2xl bg-[#111827] p-6 text-white">
        <div className="text-[30px] font-extrabold tracking-[-.06em]">{avgScore}%</div>
        <p className="mt-1 text-xs text-[#c8dded]">de compatibilidade média</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {matchesList.map((m) => {
          const isSaved = m.status === "SALVO" || m.status === "INTERESSE_ENVIADO";
          return (
            <div
              key={m.id || m.opportunityTitle}
              className="flex flex-col justify-between rounded-2xl border border-[#e1e6ea] bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fff2b8] px-3 py-1 text-[10px] font-extrabold text-[#795900]">
                      {formatOppType(m.opportunityType)}
                    </span>
                    {isSaved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f6ed] px-2.5 py-1 text-[10px] font-bold text-[#18734d]">
                        <Check size={11} /> Salvo
                      </span>
                    )}
                  </div>
                  <span className="text-xl font-extrabold text-[#25805e]">{m.matchScore}%</span>
                </div>
                <h3 className="mt-5 text-sm font-extrabold text-[#123b62]">
                  {m.startupName} × {m.opportunityTitle}
                </h3>
                <p className="mt-2 text-xs text-[#74818c]">{m.justification}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[#eef1f3] pt-4">
                <button
                  onClick={() => {
                    onSelectMatch(m);
                    go("match");
                  }}
                  className="flex items-center gap-2 text-xs font-extrabold text-[#111827] hover:underline"
                >
                  Ver oportunidade <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSaveFromList(m)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    isSaved
                      ? "text-[#9aa5ae] hover:bg-[#fff1f1] hover:text-[#c93b3b]"
                      : "text-[#111827] hover:bg-[#eaf2f8]"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Trash2 size={13} /> Remover salvo
                    </>
                  ) : (
                    <>
                      <Heart size={13} /> Salvar match
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e1e6ea] bg-white p-6">
        <h2 className="text-base font-extrabold text-[#123b62]">Status das conexões</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            [
              "01",
              "Interesse enviado / Salvos",
              `${interesseCount} ${interesseCount === 1 ? "conexão" : "conexões"}`,
            ],
            [
              "02",
              "Contato iniciado",
              `${contatoCount} ${contatoCount === 1 ? "conexão" : "conexões"}`,
            ],
            [
              "03",
              "Em negociação",
              `${negociacaoCount} ${negociacaoCount === 1 ? "conexão" : "conexões"}`,
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-xl bg-[#f6f8fa] p-4">
              <span className="text-[10px] font-extrabold text-[#111827]">{n}</span>
              <p className="mt-3 text-xs font-bold text-[#31516e]">{t}</p>
              <p className="mt-1 text-[11px] text-[#8a969f]">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function MatchDetail({
  go,
  startupId,
  selectedMatch,
  onOpenOpportunity,
  onSavedChange,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  selectedMatch: MatchItem | null;
  onOpenOpportunity: (oppId: number | string) => void;
  onSavedChange?: () => void;
}) {
  const targetStartupId = selectedMatch?.startupId || startupId;

  const [saved, setSaved] = useState(() => {
    if (!selectedMatch) return false;
    if (selectedMatch.status === "SALVO" || selectedMatch.status === "INTERESSE_ENVIADO") {
      return true;
    }
    return getLocalSavedOpportunities(targetStartupId).some(
      (x) =>
        String(x.id) === String(selectedMatch.opportunityId) ||
        x.title.toLowerCase() === (selectedMatch.opportunityTitle || "").toLowerCase()
    );
  });

  useEffect(() => {
    if (!selectedMatch) return;
    const isSavedInMatch =
      selectedMatch.status === "SALVO" || selectedMatch.status === "INTERESSE_ENVIADO";
    const isSavedLocally = getLocalSavedOpportunities(targetStartupId).some(
      (x) =>
        String(x.id) === String(selectedMatch.opportunityId) ||
        x.title.toLowerCase() === (selectedMatch.opportunityTitle || "").toLowerCase()
    );
    setSaved(isSavedInMatch || isSavedLocally);
  }, [selectedMatch, targetStartupId]);

  const title = selectedMatch
    ? `${selectedMatch.startupName} × ${selectedMatch.opportunityTitle}`
    : "Nexa Health × Empresa Alpha";
  const subtitle = selectedMatch
    ? `${formatOppType(selectedMatch.opportunityType)} · ${selectedMatch.opportunityTitle}`
    : "POC · Inteligência operacional";
  const score = selectedMatch ? `${selectedMatch.matchScore}%` : "94%";
  const reasons = [
    [
      "01",
      "Perfil da startup",
      selectedMatch?.reasons?.perfil || "Healthtech · SaaS · B2B",
      selectedMatch?.justification || "A startup atua no mesmo contexto da demanda.",
    ],
    [
      "02",
      "Requisitos",
      selectedMatch?.reasons?.requisitos || "IA · Dados · Automação",
      "As tecnologias declaradas atendem aos requisitos.",
    ],
    [
      "03",
      "Objetivo",
      selectedMatch?.reasons?.objetivo || "POC para gestão operacional",
      selectedMatch?.recommendedAction ||
        "O objetivo da oportunidade é compatível com sua solução.",
    ],
    [
      "04",
      "Contexto",
      selectedMatch?.reasons?.contexto || "Brasil · B2B · validação",
      "Localização e modelo de negócio são compatíveis.",
    ],
  ];

  const handleSaveMatch = async () => {
    const newStatus = saved ? "NOVO" : "SALVO";
    if (!saved && selectedMatch) {
      selectedMatch.status = "SALVO";
      saveOpportunityLocally(
        {
          id: selectedMatch.opportunityId || selectedMatch.id,
          code: selectedMatch.opportunityCode,
          type: formatOppType(selectedMatch.opportunityType),
          title: selectedMatch.opportunityTitle,
          short: selectedMatch.opportunityShort || selectedMatch.justification,
          description: selectedMatch.opportunityDescription || selectedMatch.justification,
          match: selectedMatch.matchScore || 92,
          meta: selectedMatch.opportunityMeta || "Inscrições abertas · Brasil",
          tags: selectedMatch.opportunityTags || "IA • Dados • Inovação",
          externalUrl: selectedMatch.opportunityExternalUrl,
        },
        targetStartupId
      );
      if (selectedMatch.id) {
        try {
          await api.updateMatchStatus(selectedMatch.id, newStatus);
        } catch {}
      }
    } else if (saved && selectedMatch) {
      selectedMatch.status = "NOVO";
      removeOpportunityLocally(selectedMatch.opportunityId || selectedMatch.id, targetStartupId);
      removeOpportunityLocally(selectedMatch.opportunityTitle, targetStartupId);
      try {
        await api.unparticipateInOpportunity(
          targetStartupId,
          selectedMatch.opportunityId,
          selectedMatch.id,
          selectedMatch.opportunityTitle
        );
      } catch {}
    }
    setSaved(!saved);
    onSavedChange?.();
  };

  return (
    <>
      <button
        onClick={() => go("matches")}
        className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87]"
      >
        <ArrowLeft size={14} /> Voltar para matches
      </button>
      <PageTitle
        title="Detalhe do match"
        description="Entenda de forma transparente por que esta conexão foi recomendada."
      />
      <div className="mt-8 flex flex-col justify-between gap-5 rounded-2xl bg-[#111827] p-6 text-white md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold text-[#c8dded]">{title}</p>
          <h2 className="mt-2 text-xl font-extrabold">{subtitle}</h2>
        </div>
        <div className="text-left md:text-right">
          <div className="text-4xl font-extrabold tracking-[-.08em] text-[#ffd43b]">{score}</div>
          <div className="text-xs text-[#c8dded]">aderência</div>
        </div>
      </div>
      <section className="mt-6 rounded-2xl border border-[#e1e6ea] bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#123b62]">Por que este match faz sentido</h2>
        <div className="mt-6 space-y-5">
          {reasons.map(([n, t, v, d]) => (
            <div
              key={n}
              className="flex gap-4 border-b border-[#eef1f3] pb-5 last:border-0 last:pb-0"
            >
              <span className="text-xs font-extrabold text-[#111827]">{n}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#294c6a]">{t}</p>
                <p className="mt-1 text-xs font-semibold text-[#688093]">{v}</p>
              </div>
              <p className="hidden max-w-[320px] text-xs leading-5 text-[#7c8a94] md:block">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton
            onClick={() => {
              if (selectedMatch?.opportunityId) onOpenOpportunity(selectedMatch.opportunityId);
              else go("opportunity");
            }}
          >
            Ver oportunidade <ArrowRight size={16} />
          </PrimaryButton>
          <PrimaryButton secondary onClick={handleSaveMatch}>
            {saved ? (
              <>
                <Check size={16} /> Match salvo
              </>
            ) : (
              <>
                <Heart size={16} /> Salvar match
              </>
            )}
          </PrimaryButton>
          {selectedMatch?.opportunityExternalUrl && (
            <a
              href={selectedMatch.opportunityExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#111827] bg-white px-5 text-xs font-extrabold text-[#111827] transition hover:bg-[#f0f6fb]"
            >
              Acessar página oficial <ExternalLink size={14} />
            </a>
          )}
        </div>
      </section>
    </>
  );
}
