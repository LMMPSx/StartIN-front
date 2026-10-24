import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Heart } from "@/icons";
import { BackButton, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, type MatchItem } from "@/lib/api";
import type { Screen } from "@/types/startin";
import { formatOppType } from "@/utils/formatters";
import { saveOpportunityLocally } from "./OpportunitiesScreen";

export function Matches({
  go,
  startupId,
  onSelectMatch,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  onSelectMatch: (m: MatchItem) => void;
}) {
  const [matchesList, setMatchesList] = useState<MatchItem[]>([]);

  useEffect(() => {
    api
      .getMatches(startupId)
      .then((res) => {
        if (Array.isArray(res)) setMatchesList(res);
      })
      .catch(() => {});
  }, [startupId]);

  const avgScore = matchesList.length
    ? Math.round(matchesList.reduce((acc, m) => acc + (m.matchScore || 0), 0) / matchesList.length)
    : 92;

  const interesseCount =
    matchesList.filter((m) => m.status === "INTERESSE_ENVIADO" || m.status === "SALVO").length || 3;
  const contatoCount = matchesList.filter((m) => m.status === "CONTATO_INICIADO").length || 1;
  const negociacaoCount = matchesList.filter((m) => m.status === "EM_NEGOCIACAO").length || 1;

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />
      <PageTitle
        title="Seus matches"
        description="Conexões com maior potencial para sua startup."
      />
      <div className="mt-8 rounded-2xl bg-[#075394] p-6 text-white">
        <div className="text-[30px] font-extrabold tracking-[-.06em]">{avgScore}%</div>
        <p className="mt-1 text-xs text-[#c8dded]">de compatibilidade média</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {matchesList.map((m) => (
          <div
            key={m.id || m.opportunityTitle}
            className="rounded-2xl border border-[#e1e6ea] bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-[#fff2b8] px-3 py-1 text-[10px] font-extrabold text-[#795900]">
                {formatOppType(m.opportunityType)}
              </span>
              <span className="text-xl font-extrabold text-[#25805e]">{m.matchScore}%</span>
            </div>
            <h3 className="mt-6 text-sm font-extrabold text-[#123b62]">
              {m.startupName} × {m.opportunityTitle}
            </h3>
            <p className="mt-2 text-xs text-[#74818c]">{m.justification}</p>
            <button
              onClick={() => {
                onSelectMatch(m);
                go("match");
              }}
              className="mt-6 flex items-center gap-2 text-xs font-extrabold text-[#075394]"
            >
              Ver oportunidade <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e1e6ea] bg-white p-6">
        <h2 className="text-base font-extrabold text-[#123b62]">Status das conexões</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["01", "Interesse enviado", `${interesseCount} conexões`],
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
              <span className="text-[10px] font-extrabold text-[#075394]">{n}</span>
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
  selectedMatch,
  onOpenOpportunity,
}: {
  go: (s: Screen) => void;
  selectedMatch: MatchItem | null;
  onOpenOpportunity: (oppId: number | string) => void;
}) {
  const [saved, setSaved] = useState(
    selectedMatch?.status === "SALVO" || selectedMatch?.status === "INTERESSE_ENVIADO"
  );

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
      saveOpportunityLocally({
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
      });
    }
    if (selectedMatch?.id) {
      try {
        await api.updateMatchStatus(selectedMatch.id, newStatus);
      } catch {}
    }
    setSaved(!saved);
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
      <div className="mt-8 flex flex-col justify-between gap-5 rounded-2xl bg-[#075394] p-6 text-white md:flex-row md:items-center">
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
              <span className="text-xs font-extrabold text-[#075394]">{n}</span>
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
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#075394] bg-white px-5 text-xs font-extrabold text-[#075394] transition hover:bg-[#f0f6fb]"
            >
              Acessar página oficial <ExternalLink size={14} />
            </a>
          )}
        </div>
      </section>
    </>
  );
}
