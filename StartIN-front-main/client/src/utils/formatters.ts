export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "NH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Formata estritamente como CNPJ (XX.XXX.XXX/XXXX-XX), limitando a exatos 14 dígitos (18 caracteres com pontuação).
 */
export function formatCNPJ(raw?: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Valida se o CNPJ possui exatos 14 dígitos e dígitos verificadores autênticos (algoritmo oficial da Receita Federal),
 * rejeitando sequências repetidas ou inválidas.
 */
export function isValidCNPJ(raw?: string): boolean {
  if (!raw) return false;
  const cnpj = raw.replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(cnpj.slice(0, 12), weights1);
  if (d1 !== Number(cnpj[12])) return false;

  const d2 = calcDigit(cnpj.slice(0, 13), weights2);
  if (d2 !== Number(cnpj[13])) return false;

  return true;
}

/**
 * Formata telefone brasileiro no padrão (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX (máx 11 dígitos).
 */
export function formatPhoneBR(raw?: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Valida se o telefone brasileiro possui DDD autêntico (11 a 99) e 10 ou 11 dígitos não repetidos.
 */
export function isValidPhoneBR(raw?: string): boolean {
  if (!raw) return false;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (digits.length === 11 && digits[2] !== "9") return false;
  return true;
}

/**
 * Valida formato autêntico de e-mail corporativo/profissional.
 */
export function isValidEmail(raw?: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed);
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
  if (tgType.includes("evento")) {
    modalityScore = Math.max(modalityScore, 5);
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

  if (tgType.includes("evento") && locationScore >= 3) {
    locationScore = Math.min(5, locationScore + 1);
  }

  return Math.max(
    0,
    Math.min(
      100,
      areaScore + techScore + stageTrlScore + modalityModelScore + semanticScore + locationScore
    )
  );
}

const BRAZIL_STATE_TO_UF: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

const VALID_UFS = new Set(Object.values(BRAZIL_STATE_TO_UF));

function resolveStateToUf(rawState?: string): string {
  if (!rawState) return "";
  const cleaned = rawState
    .replace(/^BR-/i, "")
    .replace(/\b(brasil|brazil)\b/gi, "")
    .trim();
  if (!cleaned) return "";
  const upper = cleaned.toUpperCase();
  if (upper.length === 2 && VALID_UFS.has(upper)) {
    return upper;
  }
  const norm = normMatchText(cleaned);
  if (BRAZIL_STATE_TO_UF[norm]) {
    return BRAZIL_STATE_TO_UF[norm];
  }
  for (const [stateName, uf] of Object.entries(BRAZIL_STATE_TO_UF)) {
    if (norm.includes(stateName)) {
      return uf;
    }
  }
  return upper.length <= 3 ? upper : "";
}

/**
 * Normaliza qualquer string de localização para exibir SOMENTE "Cidade, UF"
 * (ex: "Recife, Pernambuco, Brasil" -> "Recife, PE"; "São Paulo - SP · Brasil" -> "São Paulo, SP").
 */
export function formatCityStateOnly(raw?: string | null): string {
  if (!raw) return "";
  let cleaned = raw
    .replace(/[·•|]/g, ",")
    .replace(/\s+-\s+/g, ", ")
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\([^)]*\)/g, "")
    .trim();

  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length > 0 &&
        !/^(brasil|brazil|remoto|nacional|todo o brasil|100% remoto)$/i.test(p)
    );

  if (parts.length === 0) return "";

  if (parts.length === 1) {
    const single = parts[0];
    const matchInlineUf = single.match(/^(.+?)\s+([A-Za-z]{2})$/);
    if (matchInlineUf && VALID_UFS.has(matchInlineUf[2].toUpperCase())) {
      return `${matchInlineUf[1].trim()}, ${matchInlineUf[2].toUpperCase()}`;
    }
    return single;
  }

  const city = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const uf = resolveStateToUf(parts[i]);
    if (uf) {
      return `${city}, ${uf}`;
    }
  }

  const fallbackUf = resolveStateToUf(parts[1]);
  return fallbackUf ? `${city}, ${fallbackUf}` : `${city}, ${parts[1]}`;
}

/**
 * Obtém a localização exata do usuário via navegador (Geolocation API + Reverse Geocoding)
 * e retorna estritamente no formato "Cidade, UF" (ex: "Recife, PE").
 */
export async function detectBrowserCityState(): Promise<string> {
  const reverseGeocodeCoords = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=pt-BR`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data?.address || {};
        const city =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.village ||
          addr.city_district ||
          addr.suburb ||
          "";
        const isoUf = (addr["ISO3166-2-lvl4"] || "").replace(/^BR-/i, "");
        const uf = resolveStateToUf(isoUf || addr.state || "");
        if (city && uf) return `${city}, ${uf}`;
        if (city) return formatCityStateOnly(`${city}, ${addr.state || ""}`);
      }
    } catch {
      // Continua para o fallback
    }

    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
      );
      if (res.ok) {
        const data = await res.json();
        const city = data?.city || data?.locality || "";
        const uf = resolveStateToUf(
          data?.principalSubdivisionCode || data?.principalSubdivision || ""
        );
        if (city && uf) return `${city}, ${uf}`;
        if (city) return formatCityStateOnly(`${city}, ${data?.principalSubdivision || ""}`);
      }
    } catch {
      // Continua para o fallback
    }

    return "";
  };

  if (typeof window !== "undefined" && "geolocation" in navigator) {
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });
      const exactCityUf = await reverseGeocodeCoords(coords.latitude, coords.longitude);
      if (exactCityUf) return exactCityUf;
    } catch {
      // Se o usuário negar permissão de GPS ou der timeout, usa fallback de geolocalização do navegador
    }
  }

  try {
    const res = await fetch(
      "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=pt"
    );
    if (res.ok) {
      const data = await res.json();
      const city = data?.city || data?.locality || "";
      const uf = resolveStateToUf(
        data?.principalSubdivisionCode || data?.principalSubdivision || ""
      );
      if (city && uf) return `${city}, ${uf}`;
    }
  } catch {
    // ignore
  }

  return "";
}
