export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "NH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

export function formatOppType(type?: string): string {
  if (!type) return "Edital";
  const upper = type.trim().toUpperCase();
  if (upper === "PRIMEIRA_COMPRA" || upper === "PRIMEIRA COMPRA") return "Primeira Compra";
  if (upper === "EDITAL") return "Edital";
  if (upper === "EVENTO") return "Evento";
  if (upper === "COMPRA") return "Compra";
  if (upper === "POC") return "POC";
  return type;
}

export function getBadgeColorByType(type?: string, customColor?: string): string {
  if (customColor) return customColor;
  const upper = (type || "").trim().toUpperCase();
  if (upper === "PRIMEIRA_COMPRA" || upper === "PRIMEIRA COMPRA")
    return "bg-[#fef3c7] text-[#92400e]";
  if (upper === "POC") return "startin-badge-poc";
  if (upper === "EVENTO") return "startin-badge-evento";
  if (upper === "COMPRA") return "startin-badge-compra";
  return "startin-badge-edital";
}

/**
 * Converte qualquer texto gerado pela IA para texto plano puro (sem Markdown:
 * remove *, **, #, ---, >, listas - / *, tabelas |, crases `, links [t](url) e tags HTML),
 * preservando quebras de parágrafo, numeração (1., 2.) e campos entre colchetes [campo].
 */
export function stripMarkdownToPlainText(text?: string): string {
  if (!text) return "";

  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/?(?:b|strong|i|em|u|s|code|pre|blockquote|h[1-6]|ul|ol|li|p|hr|span|div|table|thead|tbody|tr|th|td)(?:\s[^>]*)?>/gi,
      ""
    )
    .replace(/```[a-zA-Z0-9_-]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, "$1 ($2)")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|www\.[^)\s]+)\)/g, "$1 ($2)")
    .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, "")
    .replace(/^[ \t]*={3,}[ \t]*$/gm, "")
    .replace(/^[ \t]*\|?(?:[ \t]*:?-+:?[ \t]*\|)+[ \t]*:?-*:?[ \t]*\n?/gm, "");

  cleaned = cleaned
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 2) {
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        return cells.join(" — ");
      }
      return line;
    })
    .join("\n");

  return cleaned
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*>+[ \t]?/gm, "")
    .replace(/(\*\*\*|\*\*|~~|`)/g, "")
    .replace(/(?<!_)__(?=\S)([\s\S]*?)(?<=\S)__(?!_)/g, "$1")
    .replace(/^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]+/gm, "")
    .replace(/^[ \t]*[-*+][ \t]+/gm, "")
    .replace(/\*(?=\S)([\s\S]*?)(?<=\S)\*/g, "$1")
    .replace(/(?<![\p{L}\p{N}_])_(?=\S)([^_\n]+?)(?<=\S)_(?![\p{L}\p{N}_])/gu, "$1")
    .replace(/^[ \t]*\*+[ \t]*|[ \t]*\*+[ \t]*$/gm, "")
    .replace(/\*(?=[\p{L}\p{N}([{"'])|(?<=[\p{L}\p{N})\]}"'.,;:!?])\*/gu, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const CLIENT_DOMAIN_CLUSTERS: Record<string, string[]> = {
  saude_biotech: [
    "healthtech",
    "saude",
    "health",
    "medtech",
    "biotech",
    "biotecnologia",
    "clinica",
    "hospital",
    "telemedicina",
    "prontuario",
    "diagnostico",
    "farmac",
  ],
  financas_seguros: [
    "fintech",
    "financ",
    "insurtech",
    "banco",
    "pagamento",
    "credito",
    "contabil",
    "fiscal",
    "cobranca",
  ],
  agro_alimentos: [
    "agtech",
    "agro",
    "agronegocio",
    "agricola",
    "agricultura",
    "foodtech",
    "pecuaria",
    "safra",
    "fazenda",
    "irrigacao",
  ],
  educacao_rh: [
    "edtech",
    "educac",
    "ensino",
    "aprendizagem",
    "hrtech",
    "recursos humanos",
    "treinamento",
    "capacitacao",
  ],
  energia_sustentabilidade: [
    "cleantech",
    "greentech",
    "energia",
    "solar",
    "sustentab",
    "esg",
    "carbono",
    "ambiental",
    "residuos",
    "saneamento",
  ],
  industria_manufatura: [
    "industria",
    "manufatura",
    "automacao industrial",
    "fabrica",
    "manutencao preditiva",
    "mineracao",
    "oleo e gas",
  ],
  logistica_mobilidade: [
    "logtech",
    "logistica",
    "transporte",
    "frota",
    "mobilidade",
    "supply chain",
    "armazem",
    "roteirizacao",
  ],
  varejo_consumo: [
    "retailtech",
    "varejo",
    "ecommerce",
    "e-commerce",
    "comercio",
    "marketplace",
    "martech",
  ],
  governo_cidades: [
    "govtech",
    "governo",
    "setor publico",
    "smart city",
    "cidades inteligentes",
    "gestao publica",
    "prefeitura",
  ],
  ciberseguranca_juridico: [
    "ciberseguranca",
    "cybersecurity",
    "seguranca da informacao",
    "lgpd",
    "antifraude",
    "legaltech",
    "juridico",
    "compliance",
    "regtech",
  ],
  construcao_imobiliario: [
    "construtech",
    "proptech",
    "construcao",
    "imobiliario",
    "infraestrutura",
  ],
  ia_software_dados: [
    "inteligencia artificial",
    "ia & dados",
    "ciencia de dados",
    "deeptech",
    "deep tech",
    "transformacao digital",
    "software corporativo",
  ],
};

const CLIENT_TECH_CANONICAL: Record<string, string[]> = {
  ia: ["ia", "ai", "inteligencia artificial", "llm", "ia generativa", "genai", "nlp"],
  machine_learning: ["machine learning", "ml", "deep learning", "modelos preditivos", "preditivo"],
  dados_analytics: ["dados", "data", "analytics", "big data", "bi", "business intelligence", "data science"],
  saas: ["saas", "saas b2b", "software como servico", "plataforma web"],
  cloud: ["cloud", "nuvem", "aws", "azure", "gcp", "microservicos"],
  automacao_rpa: ["automacao", "rpa", "automacao de processos", "workflow"],
  iot_hardware: ["iot", "internet das coisas", "sensores", "embarcados", "hardware", "edge computing"],
  api_integracao: ["api", "apis", "integracao", "integracoes", "erp", "crm", "interoperabilidade", "hl7"],
  visao_computacional: ["visao computacional", "computer vision", "ocr"],
  ciberseguranca: ["ciberseguranca", "cybersecurity", "criptografia", "antifraude", "lgpd"],
  blockchain_web3: ["blockchain", "smart contracts", "tokenizacao", "web3"],
  mobile_app: ["mobile", "aplicativo", "android", "ios"],
};

function normMatchText(value?: string | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function detectDomains(text: string): Set<string> {
  const found = new Set<string>();
  if (!text) return found;
  for (const [domain, terms] of Object.entries(CLIENT_DOMAIN_CLUSTERS)) {
    if (terms.some((t) => text.includes(t))) {
      found.add(domain);
    }
  }
  return found;
}

function detectTechs(rawTags: string, contextText: string): Set<string> {
  const combined = `${rawTags} ${contextText}`;
  const found = new Set<string>();
  for (const [canon, aliases] of Object.entries(CLIENT_TECH_CANONICAL)) {
    const matched = aliases.some((alias) => {
      if (alias.length <= 3) {
        return new RegExp(`(^|[^a-z0-9])${alias}([^a-z0-9]|$)`).test(combined);
      }
      return combined.includes(alias);
    });
    if (matched) found.add(canon);
  }
  rawTags
    .split(/[,•;/|]+/)
    .map((t) => normMatchText(t))
    .filter((t) => t.length >= 3 && !["setor", "tecnologia", "objetivo", "b2b", "b2c", "poc", "compra", "edital"].includes(t))
    .forEach((tok) => {
      const alreadyMapped = Object.values(CLIENT_TECH_CANONICAL).some((aliases) =>
        aliases.some((alias) =>
          alias.length <= 3
            ? new RegExp(`(^|[^a-z0-9])${alias}([^a-z0-9]|$)`).test(tok)
            : tok.includes(alias)
        )
      );
      if (!alreadyMapped) found.add(`tag:${tok}`);
    });
  return found;
}

/**
 * Balança auditada de Matchmaking (0 a 100%) sincronizada com o motor Python (IA.py):
 * - 40% (0..40 pts): Mesma Área de Atuação / Setor
 * - 30% (0..30 pts): Tecnologias iguais / compatíveis (crescimento progressivo)
 * - 30% (0..30 pts): Demais critérios (10 Estágio/TRL + 10 Modalidade/Modelo + 5 Problema/Demanda + 5 Localização)
 */
export function computeAuditedClientMatchScore(
  startup?: {
    mainArea?: string;
    mainSector?: string;
    technologies?: string;
    areasOfInterest?: string;
    problem?: string;
    howItWorks?: string;
    description?: string;
    currentStage?: string;
    trlScore?: number;
    tractionAttested?: boolean;
    opportunityTypes?: string;
    businessModel?: string;
    location?: string;
    operationRegion?: string;
    mainObjective?: string;
  } | null,
  target?: {
    title?: string;
    sector?: string;
    type?: string;
    operationMode?: string;
    preferredStage?: string;
    tags?: string;
    short?: string;
    shortDescription?: string;
    description?: string;
    demands?: string;
    meta?: string;
    metaInfo?: string;
    location?: string;
  } | null
): number {
  if (!startup || !target) return 25;

  const stAreaText = normMatchText(`${startup.mainArea || ""} ${startup.mainSector || ""}`);
  const stProblemText = normMatchText(
    `${startup.problem || ""} ${startup.howItWorks || ""} ${startup.description || ""} ${startup.mainObjective || ""}`
  );
  const tgPrimaryAreaText = normMatchText(
    `${target.sector || ""} ${target.title || ""} ${target.tags || ""}`
  );
  const tgContextText = normMatchText(
    `${target.shortDescription || target.short || ""} ${target.description || ""} ${target.demands || ""}`
  );
  const tgFullText = `${tgPrimaryAreaText} ${tgContextText}`.trim();

  // 1. PILAR ÁREA DE ATUAÇÃO (0..40)
  const stDomains = detectDomains(stAreaText || stProblemText);
  const tgPrimaryDomains = detectDomains(tgPrimaryAreaText);
  const tgAllDomains = detectDomains(tgFullText);

  const areaTokens = stAreaText
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !["para", "como", "tecnologia", "inovacao"].includes(w));
  const subHits = areaTokens.filter((w) => tgFullText.includes(w)).length;
  const directLabelMatch =
    Boolean(stAreaText) &&
    stAreaText.length >= 4 &&
    (tgPrimaryAreaText.includes(stAreaText) || stAreaText.includes(normMatchText(target.sector)));

  const hasPrimaryDomainOverlap = Array.from(stDomains).some((d) => tgPrimaryDomains.has(d));
  const hasContextDomainOverlap = Array.from(stDomains).some((d) => tgAllDomains.has(d));
  const isMultiSector = [
    "inovacao aberta",
    "multissetorial",
    "subvencao",
    "pipe",
    "finep",
    "sebrae",
    "centelha",
    "empresas inovadoras",
  ].some((kw) => tgFullText.includes(kw));

  let areaScore = 0;
  if (hasPrimaryDomainOverlap || directLabelMatch) {
    areaScore = Math.min(40, 31 + Math.min(9, subHits * 2 + (directLabelMatch ? 3 : 1)));
  } else if (hasContextDomainOverlap) {
    areaScore = Math.min(31, 22 + Math.min(9, subHits * 2 + 2));
  } else if (isMultiSector) {
    areaScore = Math.min(26, 16 + Math.min(10, subHits * 3));
  } else if (subHits > 0) {
    areaScore = Math.min(15, subHits * 6);
  }

  // 2. PILAR TECNOLOGIAS (0..30)
  const stTechRaw = normMatchText(`${startup.technologies || ""}, ${startup.areasOfInterest || ""}`);
  const tgTechRaw = normMatchText(target.tags || "");
  const stTechs = detectTechs(stTechRaw, `${stAreaText} ${stProblemText}`);
  const tgCoreTechs = detectTechs(tgTechRaw, "");
  const tgAllTechs = detectTechs(tgTechRaw, tgFullText);

  const matchedTechCount = Array.from(stTechs).filter((t) => tgAllTechs.has(t)).length;
  let techScore = 0;
  if (matchedTechCount > 0) {
    const reqCount = Math.max(1, Math.min(tgAllTechs.size || 1, Math.max(2, tgCoreTechs.size)));
    const coverageRatio = Math.min(1, matchedTechCount / reqCount);
    const coveragePts = Math.round(18 * coverageRatio);
    const countPts =
      matchedTechCount === 1
        ? 5
        : matchedTechCount === 2
          ? 8
          : matchedTechCount === 3
            ? 10
            : 12;
    techScore = Math.min(30, coveragePts + countPts);
  }

  // 3. PILAR DEMAIS CRITÉRIOS (0..30 = 10 Estágio/TRL + 10 Modalidade/Modelo + 5 Semântica + 5 Localização)
  const stStage = normMatchText(startup.currentStage);
  const isTracao = stStage.includes("tracao");
  const tgType = normMatchText(`${target.type || ""} ${target.operationMode || ""} ${target.preferredStage || ""}`);
  const trl = startup.trlScore ?? (isTracao ? 7 : 4);

  let stageTrlScore = 5;
  if (isTracao) {
    if (tgType.includes("compra") && !tgType.includes("primeira")) {
      stageTrlScore = 6 + (startup.tractionAttested || trl >= 8 ? 4 : trl >= 7 ? 3 : 1);
    } else if (tgType.includes("edital") || tgType.includes("evento") || tgType.includes("tracao")) {
      stageTrlScore = 6 + (startup.tractionAttested || trl >= 7 ? 3 : 1);
    } else {
      stageTrlScore = 3;
    }
  } else {
    if (tgType.includes("poc") || tgType.includes("primeira") || tgType.includes("validacao")) {
      stageTrlScore = 7 + (stProblemText.length > 30 ? 2 : 0) + (trl >= 4 ? 1 : 0);
    } else if (tgType.includes("edital") || tgType.includes("evento")) {
      stageTrlScore = 6 + (stProblemText.length > 30 ? 2 : 0);
    } else {
      stageTrlScore = 2;
    }
  }
  stageTrlScore = Math.min(10, stageTrlScore);

  const stOppPrefs = normMatchText(startup.opportunityTypes);
  let modalityScore = 2;
  if (
    stOppPrefs &&
    ((tgType.includes("edital") && stOppPrefs.includes("edita")) ||
      (tgType.includes("poc") && stOppPrefs.includes("poc")) ||
      (tgType.includes("primeira") && stOppPrefs.includes("primeira")) ||
      (tgType.includes("compra") && stOppPrefs.includes("compra")) ||
      (tgType.includes("evento") && stOppPrefs.includes("evento")))
  ) {
    modalityScore = 6;
  } else if (!stOppPrefs) {
    modalityScore = 4;
  }

  const stModel = normMatchText(startup.businessModel);
  const modelScore =
    stModel.includes("b2b") || stModel.includes("saas") || stModel.includes("b2g")
      ? 4
      : stModel
        ? 2
        : 1;
  const modalityModelScore = Math.min(10, modalityScore + modelScore);

  const stop = new Set([
    "para",
    "como",
    "mais",
    "pela",
    "pelo",
    "com",
    "sem",
    "startup",
    "startups",
    "empresa",
    "empresas",
    "solucao",
    "solucoes",
    "sistema",
    "plataforma",
  ]);
  const stStems = Array.from(
    new Set(
      stProblemText
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 5 && !stop.has(w))
        .map((w) => w.slice(0, 5))
    )
  );
  const semanticHits = stStems.filter((stem) => tgFullText.includes(stem)).length;
  const semanticScore =
    semanticHits === 0
      ? 0
      : semanticHits === 1
        ? 1
        : semanticHits === 2
          ? 2
          : semanticHits <= 4
            ? 3
            : semanticHits <= 6
              ? 4
              : 5;

  const stLoc = normMatchText(`${startup.location || ""} ${startup.operationRegion || ""}`);
  const tgLoc = normMatchText(`${target.location || ""} ${target.meta || ""} ${target.metaInfo || ""}`);
  const cityToken = stLoc.split(/[,·/-]/)[0]?.trim() || "";
  let locationScore = 3;
  if (cityToken.length >= 3 && tgLoc.includes(cityToken)) {
    locationScore = 5;
  } else if (
    ["brasil", "nacional", "remoto", "global"].some((k) => tgLoc.includes(k)) ||
    !tgLoc
  ) {
    locationScore = 4;
  } else {
    locationScore = 1;
  }

  return Math.max(
    0,
    Math.min(
      100,
      areaScore + techScore + stageTrlScore + modalityModelScore + semanticScore + locationScore
    )
  );
}
