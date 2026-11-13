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
import { Download, Lock } from "lucide-react";
import { BackButton, PageTitle } from "@/components/startin/CommonUI";
import {
  ProUpgradeModal,
  exportTemplateAsDocx,
  exportTemplateAsPdf,
} from "@/components/startin/PlanComponents";
import {
  api,
  getSession,
  isProUser,
  type CompanyProfileData,
  type OpportunityItem,
  type ServiceProviderData,
  type StartupProfileData,
} from "@/lib/api";
import type { AccountType, Screen } from "@/types/startin";
import { formatOppType, stripMarkdownToPlainText } from "@/utils/formatters";
import { getLocalSavedOpportunities } from "./OpportunitiesScreen";

export function Assistant({
  go,
  profile,
  startupId,
  accountType = "STARTUP",
  providerProfile,
  selectedOpportunity,
  onSelectOpportunity,
}: {
  go: (s: Screen) => void;
  profile: StartupProfileData | null;
  startupId?: number;
  accountType?: AccountType;
  providerProfile?: ServiceProviderData | null;
  selectedOpportunity?: OpportunityItem | null;
  onSelectOpportunity?: (opp: OpportunityItem | null) => void;
}) {
  const isProvider = accountType === "PROVIDER";
  const isCompany = accountType === "COMPANY";
  const [sessionState, setSessionState] = useState(() => getSession());
  const session = sessionState;
  const proUnlocked = isProUser(session);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [resolvedProvider, setResolvedProvider] = useState<ServiceProviderData | null>(
    providerProfile || null
  );
  const [resolvedCompany, setResolvedCompany] = useState<CompanyProfileData | null>(null);
  const [activeOpp, setActiveOpp] = useState<OpportunityItem | null>(
    selectedOpportunity || null
  );
  const [availableOpps, setAvailableOpps] = useState<OpportunityItem[]>([]);
  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [templateStyle, setTemplateStyle] = useState("padrão");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Estado de anexo no chat (PDF, DOCX, TXT, MD)
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentBase64, setAttachmentBase64] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (providerProfile) {
      setResolvedProvider(providerProfile);
    } else if (isProvider && session?.userId) {
      api
        .getProviderByUser(session.userId)
        .then((p) => {
          if (p) setResolvedProvider(p);
        })
        .catch(() => {});
    } else if (isCompany && session?.userId) {
      api
        .getCompanyByUser(session.userId)
        .then((c) => {
          if (c) setResolvedCompany(c);
        })
        .catch(() => {});
    }
  }, [isProvider, isCompany, providerProfile, session?.userId]);

  // Sincroniza oportunidade pré-selecionada (ex: vinda da aba Salvos)
  useEffect(() => {
    if (selectedOpportunity) {
      setActiveOpp(selectedOpportunity);
    }
  }, [selectedOpportunity]);

  // Carrega itens salvos para o seletor do chat (Startups Salvas para Prestador; Oportunidades Salvas para Startup)
  useEffect(() => {
    if (isProvider) {
      api
        .getProviderMatchingStartups({ onlySaved: true })
        .then((savedStartups) => {
          const mapped: OpportunityItem[] = (Array.isArray(savedStartups) ? savedStartups : []).map(
            (st: any) => ({
              id: st.startupId ?? st.id,
              type: "Startup em Tração",
              title: st.name || "Startup em Tração",
              short: st.description || st.problem || "",
              description: [
                st.description ? `Descrição: ${st.description}` : "",
                st.problem ? `Problema/Desafio: ${st.problem}` : "",
                st.openDemandTitle ? `Demanda aberta: ${st.openDemandTitle}` : "",
                st.technologies ? `Tecnologias: ${st.technologies}` : "",
              ]
                .filter(Boolean)
                .join("\n"),
              match: st.matchScore ?? 0,
              meta: `${st.mainArea || "Inovação"} · ${st.location || "Brasil"}`,
              tags: st.technologies || st.mainArea || "",
              companyName: st.name,
            })
          );
          setAvailableOpps(mapped);
          setActiveOpp((prev) => {
            if (!prev) return null;
            return (
              mapped.find(
                (item) =>
                  String(item.id) === String(prev.id) ||
                  item.title.toLowerCase() === prev.title.toLowerCase()
              ) || null
            );
          });
        })
        .catch(() => setAvailableOpps([]));
      return;
    }

    if (isCompany) {
      const compId = resolvedCompany?.id || session?.companyId;
      api
        .getOpportunities(undefined, undefined, compId)
        .then((opps) => {
          setAvailableOpps(Array.isArray(opps) ? opps : []);
        })
        .catch(() => setAvailableOpps([]));
      return;
    }

    const targetId = profile?.id || startupId || session?.startupProfileId;
    const localSaved = getLocalSavedOpportunities(targetId);
    Promise.all([
      targetId || session?.userId ? api.getMatches(targetId).catch(() => []) : Promise.resolve([]),
      api.getOpportunities().catch(() => []),
    ]).then(([matches, allOpps]) => {
      const oppCatalogByTitle = new Map<string, OpportunityItem>();
      const oppCatalogById = new Map<string, OpportunityItem>();
      allOpps.forEach((o) => {
        if (o?.title) oppCatalogByTitle.set(o.title.toLowerCase(), o);
        if (o?.id !== undefined && o?.id !== null) oppCatalogById.set(String(o.id), o);
      });

      const savedFromMatches: OpportunityItem[] = matches
        .filter(
          (m) =>
            (m.status === "INTERESSE_ENVIADO" || m.status === "SALVO") &&
            (!targetId || !m.startupId || Number(m.startupId) === Number(targetId))
        )
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
            match: m.matchScore || catalogItem?.match || 0,
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
  }, [isProvider, profile?.id, startupId]);

  // Mensagem inicial contextualizada conforme o perfil (Prestador ou Startup) e o item selecionado
  useEffect(() => {
    if (isProvider) {
      const provName = resolvedProvider?.name || session?.name || "Prestador";
      const provCat = resolvedProvider?.category || "Serviços Especializados";
      if (activeOpp) {
        setMessages([
          {
            from: "ai",
            text: `Startup salva em foco: "${activeOpp.title}" (${activeOpp.meta}).\n\nJá carreguei seu perfil profissional de ${provName} (${provCat}) e os dados desta startup em Tração. Você pode pedir uma proposta comercial e técnica sob medida, estruturar sua mensagem de abordagem, sugerir escopo de entregáveis/sprints ou anexar um briefing em PDF no clipe abaixo!`,
          },
        ]);
      } else {
        setMessages([
          {
            from: "ai",
            text: `Olá, ${provName}! Sou o Assistente IA da StartIn para Prestadores de Serviços (${provCat}).\n\nPosso responder qualquer dúvida sobre a atuação de prestadores na plataforma, modelos de contratação com startups em Tração (Squad, Projeto Fechado, Consultoria, Contrato PJ), precificação, otimização do seu perfil para aumentar o índice de match ou elaborar propostas técnicas e mensagens comerciais personalizadas!`,
          },
        ]);
      }
      return;
    }

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
  }, [
    isProvider,
    activeOpp?.id,
    activeOpp?.title,
    profile?.name,
    resolvedProvider?.name,
    resolvedProvider?.category,
    session?.name,
  ]);

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

    const defaultAttachmentPrompt = isProvider
      ? "Analise o documento anexado e monte uma proposta técnica e comercial estruturada."
      : "Analise o documento anexado e monte o template de submissão.";

    const visibleMessage = attachmentName
      ? `${textToSend || defaultAttachmentPrompt}\n[Arquivo anexado: ${attachmentName}]`
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
      const targetStartupId = isProvider || isCompany ? undefined : profile?.id || startupId;
      const effectiveStyle = (templateStyle || "padrão").trim() || "padrão";
      const res = await api.chatAI(nextMessages, targetStartupId, {
        accountType: isProvider ? "PROVIDER" : isCompany ? "COMPANY" : "STARTUP",
        providerId: isProvider ? resolvedProvider?.id || session?.providerId : undefined,
        userId: session?.userId,
        provider: isProvider ? resolvedProvider : undefined,
        company: isCompany ? resolvedCompany : undefined,
        templateStyle: effectiveStyle,
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

  const isTemplateResponse = (aiText: string, msgIndex: number, prevUserText?: string): boolean => {
    if (msgIndex === 0) return false;
    const normalize = (s: string) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const aiNorm = normalize(aiText);
    const userNorm = normalize(prevUserText || "");

    if (!aiNorm) return false;
    if (
      aiNorm.startsWith("nao foi possivel consultar") ||
      aiNorm.startsWith("ola! sou o assistente") ||
      aiNorm.startsWith("sou o assistente") ||
      aiNorm.startsWith("oportunidade salva em foco:") ||
      aiNorm.startsWith("demanda de trabalho salva em foco:") ||
      aiNorm.includes("atuo exclusivamente em temas ligados a plataforma startin")
    ) {
      return false;
    }

    const explicitTemplateTriggers = [
      "template",
      "proposta comercial",
      "proposta tecnica",
      "proposta",
      "plano de trabalho",
      "minuta",
      "termo de referencia",
      "roteiro de avaliacao",
      "roteiro",
      "mensagem executiva",
      "mensagem persuasiva",
      "mensagem de abordagem",
      "abordagem inicial",
      "texto persuasivo",
      "texto de merito",
      "escopo de entregaveis",
      "modelo de contrato",
      "analise o documento anexado e monte",
      "redigir",
      "escrever proposta",
      "gerar proposta",
      "criar mensagem",
      "gerar template",
    ];

    const userAskedForTemplate =
      userNorm === "padrao" ||
      explicitTemplateTriggers.some((kw) => userNorm.includes(kw));

    const generalQuestionPatterns = [
      "como funciona",
      "o que e",
      "qual o prazo",
      "quais os documentos",
      "como otimizar",
      "avaliar",
      "dicas",
      "explique",
      "resuma",
      "quem e voce",
      "qual a diferenca",
      "como melhorar",
      "quais sao",
    ];

    if (!userAskedForTemplate && generalQuestionPatterns.some((kw) => userNorm.includes(kw))) {
      return false;
    }

    const aiTemplateHeaders = [
      "template de",
      "proposta comercial",
      "proposta tecnica",
      "plano de trabalho",
      "texto de merito",
      "mensagem de abordagem",
      "assunto:",
      "termo de referencia",
      "roteiro de avaliacao",
      "estilo de template aplicado:",
      "1. identificacao",
      "1. apresentacao",
      "1. diagnostico",
      "1. objetivo",
      "1. escopo",
      "1. tese de inovacao",
    ];

    return userAskedForTemplate || aiTemplateHeaders.some((hdr) => aiNorm.includes(hdr));
  };

  const templateQuickPrompts = isProvider
    ? [
        "Gerar proposta comercial e técnica personalizada para atender uma startup em Tração",
        "Criar mensagem persuasiva de abordagem inicial para solicitar conexão com startup",
        "Sugerir escopo de entregáveis, cronograma de sprints e modelo de contrato PJ/Squad",
        "Como otimizar meu perfil e portfólio para aumentar meu índice de match com startups?",
      ]
    : isCompany
      ? [
          "Gerar template completo de chamada de POC / Primeira Compra para startups",
          "Criar termo de referência técnica e KPIs para contratação de solução inovadora",
          "Redigir mensagem executiva de convite para startup com alto match",
          "Estruturar roteiro de avaliação de prova de conceito (POC) em 90 dias",
        ]
      : [
          "Gerar template completo de submissão pronto para preencher e enviar",
          "Escrever proposta técnica detalhada e plano de trabalho para esta oportunidade",
          "Criar texto persuasivo de mérito, diferencial tecnológico e impacto esperado",
          "Redigir mensagem executiva de apresentação comercial da startup",
        ];

  const actorDisplayName = isProvider
    ? resolvedProvider?.name || session?.name || "seu perfil de prestador"
    : isCompany
      ? resolvedCompany?.name || session?.name || "sua empresa"
      : profile?.name || "sua startup";

  // Bloqueio do Chatbot para contas do Plano Free em todos os perfis
  if (!proUnlocked) {
    return (
      <>
        <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
        <PageTitle
          title="Assistente IA — Exclusivo Plano Pro"
          description="O acesso ao Chatbot gerador de templates personalizados com exportação em PDF e DOCX é exclusivo para assinantes do Plano Pro em todos os perfis."
        />

        <div className="mt-8 rounded-3xl border-2 border-[#f5c800] bg-[#111827] p-8 text-white shadow-xl md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f5c800] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-black">
                <Lock size={13} /> Recurso Exclusivo Plano Pro · R$ 30,00/mês
              </div>
              <h2 className="mt-4 font-['Poppins'] text-2xl font-bold text-white md:text-3xl">
                Desbloqueie o Assistente IA com Definição de Template e Exportação em PDF e DOCX
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                No Plano Free, o acesso ao Chatbot Assistente IA está desativado. Ao assinar o Plano Pro (R$ 30,00/mês), você libera imediatamente:
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-200">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#f5c800]" />
                  <span>Definição de estilo de template personalizado ou geração no formato padrão da IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#f5c800]" />
                  <span>Exportação imediata de qualquer template ou proposta em PDF e DOCX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#f5c800]" />
                  <span>Acesso a 100% dos melhores matches, RAG diário às 08h da manhã e selo Pro Member</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#f5c800] px-6 py-4 text-xs font-extrabold text-black shadow-lg transition hover:bg-[#eab308]"
            >
              Assinar Plano Pro — R$ 30/mês
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {showUpgradeModal && (
          <ProUpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            profileType={accountType}
            isTraction={Boolean(profile?.currentStage?.toLowerCase().includes("tra"))}
            onUpgraded={() => {
              setShowUpgradeModal(false);
              setSessionState(getSession());
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <BackButton label="Voltar para Home" onClick={() => go("dashboard")} />
      <PageTitle
        title={
          isProvider
            ? "Assistente IA — Propostas, Escopos & Consultoria para Prestadores"
            : "Assistente IA — Gerador de Propostas & Templates"
        }
        description={
          isProvider
            ? "Tire dúvidas sobre sua atuação na plataforma, selecione uma startup salva ou anexe um briefing/escopo em PDF para gerar propostas comerciais, planos de entrega e mensagens de abordagem sob medida."
            : "Selecione uma oportunidade salva ou anexe um edital/documento para gerar templates estruturados e textos persuasivos com os dados da sua startup."
        }
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
        {/* Painel Esquerdo: Contexto da Oportunidade/Startup, Anexo e Ações Rápidas */}
        <aside className="flex flex-col justify-between rounded-2xl bg-[#111827] p-6 text-white lg:min-h-[540px]">
          <div>
            <div className="flex items-center justify-between">
              <Bot size={25} className="text-[#FEC908]" />
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-[#FEC908]">
                {isProvider ? "Exclusivo Prestador" : "Exclusivo Startup"}
              </span>
            </div>
            <h2 className="mt-5 text-[23px] font-extrabold leading-7 tracking-[-.04em]">
              {isProvider
                ? "Estruture propostas e conexões com IA"
                : "Estruture sua inscrição com IA"}
            </h2>
            <p className="mt-2.5 text-xs leading-5 text-gray-300">
              {isProvider ? (
                <>
                  A IA combina automaticamente as competências de{" "}
                  <strong className="text-white">{actorDisplayName}</strong>
                  {resolvedProvider?.category ? ` (${resolvedProvider.category})` : ""} com a
                  startup em Tração selecionada e documentos anexados.
                </>
              ) : (
                <>
                  A IA combina automaticamente o perfil de{" "}
                  <strong className="text-white">{actorDisplayName}</strong> com a oportunidade
                  selecionada e arquivos anexados.
                </>
              )}
            </p>

            {/* Seletor de Oportunidade / Demanda Salva (Prestador) ou Oportunidade Salva (Startup) */}
            <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3.5">
              <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-[#FEC908]">
                {isProvider
                  ? "Demanda / Trabalho em foco (Oportunidades salvas)"
                  : "Oportunidade / Edital em foco (Salvos)"}
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
                    ? isProvider
                      ? "Selecionar oportunidade / demanda salva..."
                      : "Selecionar oportunidade salva..."
                    : isProvider
                    ? "Nenhuma oportunidade salva na aba 'Oportunidades salvas'"
                    : "Nenhuma oportunidade salva na aba 'Salvos'"}
                </option>
                {availableOpps.map((opp) => (
                  <option key={`${opp.id}-${opp.title}`} value={opp.title}>
                    {isProvider
                      ? `${opp.title} (${opp.meta})`
                      : `[${formatOppType(opp.type)}] ${opp.title}`}
                  </option>
                ))}
              </select>
              {availableOpps.length === 0 && (
                <button
                  type="button"
                  onClick={() => go("for-you")}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#FEC908] hover:underline"
                >
                  {isProvider ? (
                    <>
                      Salvar demandas e oportunidades em &quot;Recomendações&quot; <ArrowRight size={11} />
                    </>
                  ) : (
                    <>
                      Salvar oportunidades em &quot;Para você&quot; <ArrowRight size={11} />
                    </>
                  )}
                </button>
              )}
              {activeOpp && (
                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-gray-300">
                  {!isProvider && activeOpp.companyName
                    ? `Empresa: ${activeOpp.companyName} · `
                    : ""}
                  {activeOpp.meta}
                </p>
              )}
            </div>

            {/* Botão rápido de anexar documento */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#FEC908]/50 bg-[#FEC908]/10 px-3 py-2.5 text-xs font-extrabold text-[#FEC908] transition hover:bg-[#FEC908]/20"
              >
                <Paperclip size={14} />
                {attachmentName
                  ? `Anexado: ${attachmentName}`
                  : isProvider
                  ? "Anexar PDF / Escopo / Briefing / Contrato"
                  : "Anexar PDF / Edital / Regulamento"}
              </button>
            </div>
          </div>

          {/* Ações Rápidas Correlatas ao Perfil */}
          <div className="mt-6 space-y-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
              {isProvider
                ? "Perguntas e modelos úteis para prestadores"
                : "Modelos rápidos de geração"}
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

        {/* Painel Direito: Chat de Geração de Templates + Definição de Template + Exportação PDF/DOCX */}
        <section className="flex h-[600px] max-h-[600px] flex-col overflow-hidden rounded-2xl border border-[#e1e6ea] bg-white">
          <div className="shrink-0 border-b border-[#edf0f2] px-5 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[#FEC908]">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#111827]">
                    {isProvider
                      ? "STARTIN IA · PRESTADORES (PRO)"
                      : isCompany
                        ? "STARTIN IA · EMPRESAS (PRO)"
                        : "STARTIN IA · TEMPLATES (PRO)"}
                  </p>
                  <p className="text-[10.5px] text-[#7a8793]">
                    {activeOpp
                      ? `Foco ativo: ${activeOpp.title}`
                      : "Defina o estilo do template abaixo (ou digite 'padrão') e exporte em PDF ou DOCX"}
                  </p>
                </div>
              </div>
              {activeOpp && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2.5 py-1 text-[10px] font-extrabold text-[#854d0e]">
                  <Sparkles size={11} />{" "}
                  {isProvider ? "Startup em Tração" : formatOppType(activeOpp.type)}
                </span>
              )}
            </div>

            {/* Barra de Definição de Estilo de Template (Personalizado ou 'padrão') */}
            <div className="mt-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="shrink-0 text-[10.5px] font-extrabold uppercase tracking-wider text-[#111827]">
                  Definição de Template:
                </span>
                <input
                  type="text"
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value)}
                  placeholder="Digite o estilo/estrutura do template ou digite 'padrão'..."
                  className="h-8 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-900 outline-none focus:border-[#111827]"
                />
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { label: "Padrão", value: "padrão" },
                    { label: "Executivo (3 blocos)", value: "Executivo objetivo em 3 blocos: Diagnóstico, Solução e ROI" },
                    { label: "Técnico + Sprints", value: "Técnico detalhado com Arquitetura, Cronograma de Sprints e Entregáveis" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTemplateStyle(preset.value)}
                      className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                        templateStyle.toLowerCase() === preset.value.toLowerCase()
                          ? "bg-[#111827] text-[#f5c800]"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-4 overflow-y-auto p-5 scroll-smooth"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] break-words rounded-2xl px-4 py-3.5 text-xs leading-6 ${
                    m.from === "me"
                      ? "rounded-br-sm bg-[#111827] text-white whitespace-pre-line"
                      : "rounded-bl-sm border border-[#e3eaf0] bg-[#f6f9fc] text-[#1e3a56] whitespace-pre-line"
                  }`}
                >
                  <div>{m.from === "ai" ? stripMarkdownToPlainText(m.text) : m.text}</div>
                  {m.from === "ai" && i > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-[#e2e8f0] pt-2">
                      {isTemplateResponse(m.text, i, messages[i - 1]?.text) && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              exportTemplateAsPdf(
                                stripMarkdownToPlainText(m.text),
                                activeOpp?.title || `Template ${actorDisplayName}`,
                                templateStyle || "padrão"
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[10.5px] font-bold text-[#111827] shadow-2xs transition hover:bg-gray-100"
                            title="Exportar este template em formato PDF"
                          >
                            <Download size={11} /> Exportar PDF
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              exportTemplateAsDocx(
                                stripMarkdownToPlainText(m.text),
                                activeOpp?.title || `Template ${actorDisplayName}`,
                                templateStyle || "padrão"
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-2.5 py-1 text-[10.5px] font-bold text-[#f5c800] shadow-2xs transition hover:bg-black"
                            title="Exportar este template em formato DOCX (Word)"
                          >
                            <Download size={11} /> Exportar DOCX
                          </button>
                        </>
                      )}
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
                  {isProvider
                    ? "Interpretando sua pergunta e analisando seu perfil de prestador..."
                    : "Interpretando sua pergunta e analisando o contexto da startup..."}
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
              title={
                isProvider
                  ? "Anexar briefing, escopo ou contrato (PDF, DOCX, TXT)"
                  : "Anexar arquivo do edital ou documento (PDF, DOCX, TXT)"
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8e0e7] bg-white text-[#111827] transition hover:bg-gray-100"
            >
              <Paperclip size={15} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={
                isProvider
                  ? "Pergunte sobre propostas, abordagem para startups, escopo de sprints, precificação ou anexe PDF..."
                  : "Pergunte sobre a plataforma, tire dúvidas do edital, peça propostas ou anexe PDF..."
              }
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
