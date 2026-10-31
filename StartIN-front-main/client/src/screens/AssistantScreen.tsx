import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  FileText,
  Paperclip,
  Send,
  Sparkles,
  X,
} from "@/icons";
import { BackButton, PageTitle } from "@/components/startin/CommonUI";
import { api, type OpportunityItem, type StartupProfileData } from "@/lib/api";
import type { Screen } from "@/types/startin";
import { formatOppType, stripMarkdownToPlainText } from "@/utils/formatters";
import { getLocalSavedOpportunities } from "./OpportunitiesScreen";

export function Assistant({
  go,
  profile,
  startupId,
  selectedOpportunity,
  onSelectOpportunity,
}: {
  go: (s: Screen) => void;
  profile: StartupProfileData | null;
  startupId?: number;
  selectedOpportunity?: OpportunityItem | null;
  onSelectOpportunity?: (opp: OpportunityItem | null) => void;
}) {
  const [activeOpp, setActiveOpp] = useState<OpportunityItem | null>(
    selectedOpportunity || null
  );
  const [availableOpps, setAvailableOpps] = useState<OpportunityItem[]>([]);
  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Estado de anexo no chat (PDF, DOCX, TXT, MD)
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentBase64, setAttachmentBase64] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Sincroniza oportunidade pré-selecionada (ex: vinda da aba Salvos)
  useEffect(() => {
    if (selectedOpportunity) {
      setActiveOpp(selectedOpportunity);
    }
  }, [selectedOpportunity]);

  // Carrega SOMENTE as oportunidades salvas na aba 'Salvos' para o seletor do chat
  useEffect(() => {
    const targetId = profile?.id || startupId;
    const localSaved = getLocalSavedOpportunities(targetId);
    Promise.all([
      api.getMatches(targetId).catch(() => []),
      api.getOpportunities().catch(() => []),
    ]).then(([matches, allOpps]) => {
      const oppCatalogByTitle = new Map<string, OpportunityItem>();
      const oppCatalogById = new Map<string, OpportunityItem>();
      allOpps.forEach((o) => {
        if (o?.title) oppCatalogByTitle.set(o.title.toLowerCase(), o);
        if (o?.id !== undefined && o?.id !== null) oppCatalogById.set(String(o.id), o);
      });

      const savedFromMatches: OpportunityItem[] = matches
        .filter((m) => m.status === "INTERESSE_ENVIADO" || m.status === "SALVO")
        .map((m) => {
          const catalogItem =
            (m.opportunityId ? oppCatalogById.get(String(m.opportunityId)) : undefined) ||
            (m.opportunityTitle
              ? oppCatalogByTitle.get(m.opportunityTitle.toLowerCase())
              : undefined);
          return {
            id: m.opportunityId || catalogItem?.id || m.id,
            type: formatOppType(m.opportunityType || catalogItem?.type),
            title: m.opportunityTitle || catalogItem?.title || "Oportunidade salva",
            short: m.opportunityShort || catalogItem?.short || m.justification,
            description:
              m.opportunityDescription || catalogItem?.description || m.justification,
            match: m.matchScore || catalogItem?.match || 92,
            meta: m.opportunityMeta || catalogItem?.meta || "Brasil",
            tags: m.opportunityTags || catalogItem?.tags || "",
            companyId: m.opportunityCompanyId ?? catalogItem?.companyId,
            companyName: m.opportunityCompanyName || catalogItem?.companyName,
          };
        });

      const map = new Map<string, OpportunityItem>();
      [...localSaved, ...savedFromMatches].forEach((o) => {
        if (o && o.title) {
          const catalogItem =
            (o.id !== undefined ? oppCatalogById.get(String(o.id)) : undefined) ||
            oppCatalogByTitle.get(o.title.toLowerCase());
          map.set(o.title.toLowerCase(), {
            ...catalogItem,
            ...o,
            type: formatOppType(o.type || catalogItem?.type),
          });
        }
      });

      const savedList = Array.from(map.values());
      setAvailableOpps(savedList);

      // Mantém selecionada apenas se continuar salva na aba 'Salvos'
      setActiveOpp((prev) => {
        if (!prev) return null;
        const stillSaved = savedList.find(
          (item) =>
            String(item.id) === String(prev.id) ||
            item.title.toLowerCase() === prev.title.toLowerCase()
        );
        return stillSaved || null;
      });
    });
  }, [profile?.id, startupId]);

  // Mensagem inicial contextualizada conforme a oportunidade selecionada
  useEffect(() => {
    const startupLabel = profile?.name || "sua startup";
    if (activeOpp) {
      setMessages([
        {
          from: "ai",
          text: `Oportunidade salva em foco: "${activeOpp.title}" (${formatOppType(
            activeOpp.type
          )}).\n\nJá carreguei os dados de ${startupLabel} e os detalhes desta oportunidade. Você pode tirar dúvidas específicas sobre requisitos e prazos, anexar o PDF do edital no clipe abaixo ou pedir propostas técnicas e templates personalizados!`,
        },
      ]);
    } else {
      setMessages([
        {
          from: "ai",
          text: `Olá! Sou o Assistente IA da StartIn.\n\nPosso responder qualquer dúvida sobre a plataforma, estágios (Validação, Tração e TRL), editais, POCs e compras corporativas — ou cruzar o perfil de ${startupLabel} com uma oportunidade da sua aba "Salvos" para montar propostas e templates sob medida.`,
        },
      ]);
    }
  }, [activeOpp?.id, activeOpp?.title, profile?.name]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);

    const ext = file.name.toLowerCase();
    if (ext.endsWith(".txt") || ext.endsWith(".md")) {
      const textReader = new FileReader();
      textReader.onload = () => {
        setAttachmentText(String(textReader.result || ""));
      };
      textReader.readAsText(file);
    } else {
      setAttachmentText("");
    }

    const base64Reader = new FileReader();
    base64Reader.onload = () => {
      const raw = String(base64Reader.result || "");
      const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
      setAttachmentBase64(b64);
    };
    base64Reader.readAsDataURL(file);
  };

  const clearAttachment = () => {
    setAttachmentName("");
    setAttachmentBase64("");
    setAttachmentText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? input).trim();
    if ((!textToSend && !attachmentName) || loading) return;

    const visibleMessage = attachmentName
      ? `${textToSend || "Analise o documento anexado e monte o template de submissão."}\n[Arquivo anexado: ${attachmentName}]`
      : textToSend;

    const nextMessages: { from: "ai" | "me"; text: string }[] = [
      ...messages,
      { from: "me", text: visibleMessage },
    ];
    setMessages(nextMessages);
    if (!customPrompt) setInput("");
    setLoading(true);

    const payloadAttachmentName = attachmentName;
    const payloadAttachmentBase64 = attachmentBase64;
    const payloadAttachmentText = attachmentText;

    try {
      const targetStartupId = profile?.id || startupId;
      const res = await api.chatAI(nextMessages, targetStartupId, {
        selectedOpportunity: activeOpp
          ? {
              id: activeOpp.id,
              title: activeOpp.title,
              type: activeOpp.type,
              description: activeOpp.description || activeOpp.short,
              tags: activeOpp.tags,
              meta: activeOpp.meta,
              companyName: activeOpp.companyName,
            }
          : null,
        attachmentName: payloadAttachmentName || undefined,
        attachmentBase64: payloadAttachmentBase64 || undefined,
        attachmentText: payloadAttachmentText || undefined,
      });
      setMessages((m) => [...m, { from: "ai", text: res.reply }]);
      clearAttachment();
    } catch {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Não foi possível consultar o servidor de IA no momento. Verifique se o backend e o serviço de IA estão ativos.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2200);
  };

  const templateQuickPrompts = [
    "Gerar template completo de submissão pronto para preencher e enviar",
    "Escrever proposta técnica detalhada e plano de trabalho para esta oportunidade",
    "Criar texto persuasivo de mérito, diferencial tecnológico e impacto esperado",
    "Redigir mensagem executiva de apresentação comercial da startup",
  ];

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title="Assistente IA — Gerador de Propostas & Templates"
        description="Selecione uma oportunidade salva ou anexe um edital/documento para gerar templates estruturados e textos persuasivos com os dados da sua startup."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
        {/* Painel Esquerdo: Contexto da Oportunidade, Anexo e Ações de Template */}
        <aside className="flex flex-col justify-between rounded-2xl bg-[#111827] p-6 text-white lg:min-h-[540px]">
          <div>
            <div className="flex items-center justify-between">
              <Bot size={25} className="text-[#FEC908]" />
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-[#FEC908]">
                Exclusivo Startup
              </span>
            </div>
            <h2 className="mt-5 text-[23px] font-extrabold leading-7 tracking-[-.04em]">
              Estruture sua inscrição com IA
            </h2>
            <p className="mt-2.5 text-xs leading-5 text-gray-300">
              A IA combina automaticamente o perfil de{" "}
              <strong className="text-white">{profile?.name || "sua startup"}</strong> com a oportunidade selecionada e arquivos anexados.
            </p>

            {/* Seletor de Oportunidade / Edital Alvo (apenas aba Salvos) */}
            <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3.5">
              <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-[#FEC908]">
                Oportunidade / Edital em foco (Salvos)
              </label>
              <select
                value={activeOpp ? String(activeOpp.title) : ""}
                onChange={(e) => {
                  const chosen =
                    availableOpps.find((o) => o.title === e.target.value) || null;
                  setActiveOpp(chosen);
                  onSelectOpportunity?.(chosen);
                }}
                className="mt-2 h-9 w-full rounded-lg border border-white/20 bg-[#1f2937] px-2.5 text-xs font-semibold text-white outline-none focus:border-[#FEC908]"
              >
                <option value="">
                  {availableOpps.length > 0
                    ? "Selecionar oportunidade salva..."
                    : "Nenhuma oportunidade salva na aba 'Salvos'"}
                </option>
                {availableOpps.map((opp) => (
                  <option key={`${opp.id}-${opp.title}`} value={opp.title}>
                    [{formatOppType(opp.type)}] {opp.title}
                  </option>
                ))}
              </select>
              {availableOpps.length === 0 && (
                <button
                  type="button"
                  onClick={() => go("for-you")}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#FEC908] hover:underline"
                >
                  Salvar oportunidades em &quot;Para você&quot; <ArrowRight size={11} />
                </button>
              )}
              {activeOpp && (
                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-gray-300">
                  {activeOpp.companyName ? `Empresa: ${activeOpp.companyName} · ` : ""}
                  {activeOpp.meta}
                </p>
              )}
            </div>

            {/* Botão rápido de anexar documento do edital */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#FEC908]/50 bg-[#FEC908]/10 px-3 py-2.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-[#FEC908]/20"
              >
                <Paperclip size={14} />
                {attachmentName
                  ? `Anexado: ${attachmentName}`
                  : "Anexar PDF / Edital / Regulamento"}
              </button>
            </div>
          </div>

          {/* Ações focadas em Geração de Templates e Propostas */}
          <div className="mt-6 space-y-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
              Modelos rápidos de geração
            </p>
            {templateQuickPrompts.map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => send(promptText)}
                disabled={loading}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-left text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <span className="line-clamp-1">{promptText}</span>
                <ArrowRight size={13} className="shrink-0 text-[#FEC908]" />
              </button>
            ))}
          </div>
        </aside>

        {/* Painel Direito: Chat de Geração de Templates + Upload */}
        <section className="flex h-[540px] max-h-[540px] flex-col overflow-hidden rounded-2xl border border-[#e1e6ea] bg-white">
          <div className="shrink-0 border-b border-[#edf0f2] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[#FEC908]">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#111827]">STARTIN IA · TEMPLATES</p>
                  <p className="text-[10.5px] text-[#7a8793]">
                    {activeOpp
                      ? `Foco ativo: ${activeOpp.title}`
                      : "Pronta para estruturar templates de editais, POCs e compras"}
                  </p>
                </div>
              </div>
              {activeOpp && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2.5 py-1 text-[10px] font-extrabold text-[#854d0e]">
                  <Sparkles size={11} /> {formatOppType(activeOpp.type)}
                </span>
              )}
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-4 overflow-y-auto p-5 scroll-smooth"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[86%] break-words rounded-2xl px-4 py-3.5 text-xs leading-6 ${
                    m.from === "me"
                      ? "rounded-br-sm bg-[#111827] text-white whitespace-pre-line"
                      : "rounded-bl-sm border border-[#e3eaf0] bg-[#f6f9fc] text-[#1e3a56] whitespace-pre-line"
                  }`}
                >
                  <div>{m.from === "ai" ? stripMarkdownToPlainText(m.text) : m.text}</div>
                  {m.from === "ai" && i > 0 && (
                    <div className="mt-3 flex justify-end border-t border-[#e2e8f0] pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(stripMarkdownToPlainText(m.text), i)}
                        className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[10.5px] font-bold text-[#111827] shadow-2xs transition hover:bg-gray-100"
                      >
                        {copiedIdx === i ? (
                          <>
                            <Check size={11} /> Texto copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copiar resposta
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#f0f5f8] px-4 py-3 text-xs font-semibold text-[#557089]">
                  Interpretando sua pergunta e analisando o contexto da startup...
                </div>
              </div>
            )}
          </div>

          {/* Chip de arquivo anexado */}
          {attachmentName && (
            <div className="mx-4 mt-2 flex items-center justify-between rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-xs">
              <div className="flex items-center gap-2 truncate font-bold text-[#111827]">
                <FileText size={14} className="shrink-0 text-[#111827]" />
                <span className="truncate">{attachmentName}</span>
              </div>
              <button
                type="button"
                onClick={clearAttachment}
                className="ml-2 rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-black"
                title="Remover anexo"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="m-4 shrink-0 flex items-center gap-2 rounded-xl bg-[#f5f7f9] p-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar arquivo do edital ou documento (PDF, DOCX, TXT)"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8e0e7] bg-white text-[#111827] transition hover:bg-gray-100"
            >
              <Paperclip size={15} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Pergunte sobre a plataforma, tire dúvidas do edital, peça propostas ou anexe PDF..."
              className="h-9 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-[#99a4ad]"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-[#FEC908] transition hover:bg-black disabled:opacity-60"
            >
              <Send size={15} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
