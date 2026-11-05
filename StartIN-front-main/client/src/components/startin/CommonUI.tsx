import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Eye, EyeOff, MapPin, Sparkles } from "@/icons";
import type { OpportunityItem } from "@/lib/api";
import {
  detectBrowserCityState,
  formatCityStateOnly,
  formatOppType,
  getBadgeColorByType,
} from "@/utils/formatters";

export function BackButton({
  label = "Voltar",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-2 rounded-lg py-1 text-xs font-bold text-gray-500 transition hover:text-black"
    >
      <ArrowLeft size={14} /> {label}
    </button>
  );
}

export function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block">
      <span className="startin-field-label">{label}</span>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`startin-input transition ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((prev) => !prev)}
            title={showPassword ? "Ocultar senha" : "Visualizar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </label>
  );
}

export function LocationField({
  label = "Localização (Cidade, UF)",
  placeholder = "Ex: Recife, PE",
  value,
  onChange,
  autoDetect = true,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  autoDetect?: boolean;
}) {
  const [detecting, setDetecting] = useState(false);
  const userEditedRef = useRef(false);
  const autoDetectedRef = useRef(false);
  const detectedLocationRef = useRef("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleDetectLocation = async (isAuto = false) => {
    setDetecting(true);
    try {
      const detected = await detectBrowserCityState();
      if (detected) {
        const cleanDetected = formatCityStateOnly(detected);
        detectedLocationRef.current = cleanDetected;
        if (!isAuto || !userEditedRef.current) {
          onChangeRef.current?.(cleanDetected);
        }
      }
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!autoDetect || autoDetectedRef.current) return;
    autoDetectedRef.current = true;
    handleDetectLocation(true);
  }, [autoDetect]);

  useEffect(() => {
    if (userEditedRef.current) return;
    if (!value || /^(brasil|brazil|remoto|nacional)$/i.test(value.trim())) {
      if (detectedLocationRef.current) {
        onChangeRef.current?.(detectedLocationRef.current);
      }
      return;
    }
    const cleaned = formatCityStateOnly(value);
    if (cleaned && cleaned !== value) {
      onChangeRef.current?.(cleaned);
    }
  }, [value]);

  return (
    <label className="block">
      <span className="startin-field-label">{label}</span>
      <div className="relative">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => {
            userEditedRef.current = true;
            onChange?.(e.target.value);
          }}
          onBlur={() => {
            if (value && value.trim()) {
              const formatted = formatCityStateOnly(value);
              if (formatted && formatted !== value) {
                onChange?.(formatted);
              }
            }
          }}
          placeholder={placeholder}
          className="startin-input pr-9 text-xs transition"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            userEditedRef.current = false;
            handleDetectLocation(false);
          }}
          disabled={detecting}
          title={detecting ? "Detectando localização..." : "Puxar localização atual (Cidade, UF)"}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition hover:bg-gray-100 hover:text-[#111827] ${
            detecting ? "animate-pulse text-[#111827]" : "text-gray-400"
          }`}
        >
          <MapPin size={15} />
        </button>
      </div>
    </label>
  );
}

export function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="startin-field-label">{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="startin-textarea transition"
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  full = false,
  secondary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  full?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${full ? "w-full" : ""} startin-btn transition ${
        secondary ? "startin-btn-secondary" : "startin-btn-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8d98a2]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[29px] font-extrabold tracking-[-.05em] text-[#111827] md:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#4b5563]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function OpportunityCard({
  item,
  onSelect,
}: {
  item: OpportunityItem;
  onSelect: (item: OpportunityItem) => void;
}) {
  const badgeColor = getBadgeColorByType(item.type, item.color);
  return (
    <article className="startin-opp-card flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#111827] hover:shadow-md overflow-hidden min-w-0 w-full">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold shrink-0 ${badgeColor}`}>
          {formatOppType(item.type)}
        </span>
        <div className="text-right shrink-0">
          <div className="text-[24px] font-extrabold tracking-[-.06em] text-[#15803d]">
            {item.match}%
          </div>
          <div className="text-[10px] text-[#94a0a8]">match</div>
        </div>
      </div>
      <div className="my-3 min-w-0 flex-1 overflow-hidden">
        <h3 className="text-[15px] font-extrabold leading-5 text-[#111827] break-words line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-[#4b5563] break-all break-words line-clamp-3 overflow-hidden text-ellipsis">
          {item.short}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef1f3] pt-4 min-w-0">
        <span className="text-[10px] text-[#89959e] truncate max-w-[65%]">Combina por: {item.tags}</span>
        <button
          onClick={() => onSelect(item)}
          className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#111827] hover:underline"
        >
          Ver oportunidade <ArrowRight size={13} />
        </button>
      </div>
    </article>
  );
}

// =========================================================================
// MINI TUTORIAL: O QUE ESCREVER PARA A IA LER E MELHORAR (PALETA OFICIAL STARTIN)
// =========================================================================
export function AiPromptTutorialGuide({
  role = "company",
  fieldContext = "bio",
  defaultExpanded = true,
}: {
  role?: "company" | "startup" | "provider";
  fieldContext?: "bio" | "services" | "project";
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isCompany = role === "company";
  const isProvider = role === "provider";

  const headerSubtitle = isCompany
    ? "Como descrever seus desafios para a IA"
    : isProvider
    ? fieldContext === "project"
      ? "Como descrever seu case ou projeto para a IA"
      : fieldContext === "services"
      ? "Como descrever sua experiência e serviços para a IA"
      : "Como descrever sua atuação profissional para a IA"
    : "Como descrever seu problema e solução para a IA";

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs transition">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1 text-[11px] font-black text-[#FEC908] shadow-xs">
            <Sparkles size={12} className="text-[#FEC908] fill-[#FEC908]" />
            Mini Tutorial · Guia de Estruturação com IA
          </span>
          <span className="text-xs font-bold text-[#111827]">
            {headerSubtitle}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748b] hover:text-[#111827] transition"
        >
          {isExpanded ? "Ocultar orientações" : "Ver o que escrever"}
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {isExpanded && (
        <div className="relative z-10 mt-3.5 space-y-3">
          {!isProvider && (
            <p className="text-xs font-medium text-[#475569] leading-relaxed">
              {isCompany ? (
                <>
                  A IA do StartIn <strong>lê com profundidade</strong> o que você escrever abaixo para articular uma narrativa executiva personalizada e extrair as tags que conectam sua empresa às startups certas. Para um resultado de excelência, mencione:
                </>
              ) : (
                <>
                  A IA do StartIn <strong>analisa a essência</strong> do seu rascunho para montar uma apresentação técnica coesa e atraente para editais e grandes empresas. Para um resultado de excelência, mencione:
                </>
              )}
            </p>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            {isCompany ? (
              <>
                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      1
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Contexto & Segmento
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Indique se atua em <strong>B2B ou B2C</strong>, seu setor e quem consome a operação (clientes finais, equipe interna ou fornecedores).
                  </p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      2
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Dor ou Gargalo Operacional
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Qual rotina hoje é <strong>manual, lenta ou gera erros</strong> (ex: conciliação, atendimento, análise de dados ou processos repetitivos)?
                  </p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      3
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Tecnologias Desejadas
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    O que você gostaria de testar (ex: <strong>IA aplicada, automação RPA, inteligência de dados, visão computacional ou APIs</strong>)?
                  </p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      4
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Formato de Parceria
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Deseja validar uma <strong>prova de conceito (POC)</strong>, contratar lote inicial (Primeira Compra) ou buscar contratação contínua em escala?
                  </p>
                </div>
              </>
            ) : isProvider ? (
              fieldContext === "project" ? (
                <>
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        1
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Desafio ou Problema do Cliente
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      Qual necessidade ou gargalo a startup enfrentava (ex: <strong>baixa presença no Instagram, necessidade de MVP rápido ou baixa conversão</strong>)?
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        2
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Sua Atuação & Estratégia
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      O que você executou na prática e quais <strong>canais, métodos ou ferramentas</strong> aplicou na solução?
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        3
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Entregáveis Construídos
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      O que foi entregue ao final (ex: <strong>posicionamento de marca, campanhas de growth, plataforma web, design system</strong>)?
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        4
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Resultados & Impacto Real
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      Qual evolução o projeto gerou (ex: <strong>escalabilidade da marca, ganho de alcance e vendas, redução de tempo ou mais retenção</strong>)?
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        1
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Sua Especialidade & Foco
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      Com o que você trabalha e qual é sua frente principal (ex: <strong>Marketing e crescimento de marca, Desenvolvimento, UX/UI, Jurídico, Financeiro</strong>)?
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        2
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Canais, Ferramentas & Métodos
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      Quais plataformas, tecnologias ou estratégias você utiliza (ex: <strong>Instagram, Tráfego Pago, Branding, React, Figma, Sprints Ágeis</strong>)?
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        3
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Como Ajuda as Startups
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      Qual necessidade você resolve (ex: <strong>escalabilidade da marca, aquisição de clientes, construção de MVP, estruturação jurídica/financeira</strong>)?
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                        4
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Diferencial & Resultados
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                      Qual entrega ou impacto você proporciona (ex: <strong>autoridade digital, engajamento qualificado, entregas rápidas e foco em conversão</strong>)?
                    </p>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      1
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Dor Real do Mercado
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Qual <strong>problema crítico, custo ou ineficiência</strong> seus clientes enfrentam hoje sem a sua solução?
                  </p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      2
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Sua Solução & Tecnologia
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Como seu produto funciona na prática e quais <strong>tecnologias fundamentais</strong> você aplica (ex: IA generativa, SaaS, IoT)?
                  </p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      3
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Público-Alvo & Modelo
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Para quem vende (<strong>B2B, B2C, clínicas, indústrias, PMEs</strong>) e como monetiza (SaaS mensal, comissão, licença)?
                  </p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 shadow-2xs hover:border-[#111827]/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-[10px] font-black text-[#FEC908]">
                      4
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#111827]">
                      Diferencial & Impacto Mensurável
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#475569] leading-snug">
                    Qual <strong>ganho tangível</strong> você entrega (ex: reduz faltas em 30%, economiza 40% de tempo ou corta custos)?
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl bg-[#111827]/[0.03] border border-[#e2e8f0] px-3.5 py-2.5 text-[11px] font-medium text-[#334155] flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#111827] shrink-0">
              <Sparkles size={13} className="text-[#FEC908] fill-[#FEC908]" />
              Dica StartIn:
            </span>
            <span className="text-[#475569]">
              {isCompany
                ? "Escreva com suas próprias palavras no campo abaixo. Ao clicar em 'Melhorar desafios e demandas com IA', o motor integrará 100% das suas ideias em parágrafos executivos fluidos e preencherá as tags de matchmaking automaticamente."
                : isProvider
                ? "Escreva com suas próprias palavras no campo abaixo. Ao clicar em 'Melhorar com IA', o motor reescreverá o texto em 1ª pessoa (como se você mesmo tivesse escrito), articulando suas informações com coesão e sem frases genéricas em 3ª pessoa."
                : "Escreva com suas próprias palavras no campo abaixo. Ao clicar em 'Melhorar texto com IA', o motor integrará 100% das suas ideias em uma apresentação técnica fluida, sem templates robóticos e com tags prontas para editais e empresas."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
