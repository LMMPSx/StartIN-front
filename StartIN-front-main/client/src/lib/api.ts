/**
 * Cliente de Integração Completa com o Backend Spring Boot (Java 21 + MySQL) e IA Python do StartIn
 */
import { stripMarkdownToPlainText } from "@/utils/formatters";

const API_BASE_URL = "http://localhost:8080/api";

export interface UserSession {
  token?: string;
  userId: number;
  startupProfileId?: number;
  companyId?: number;
  accountType?: "STARTUP" | "COMPANY";
  email: string;
  name: string;
  cnpj?: string;
  phone?: string;
  avatarUrl?: string;
}

const SESSION_KEY = "startin-session";

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("startin-auth", "1");
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("startin-auth");
}

export interface OpportunityItem {
  id: string | number;
  matchId?: number;
  code?: string;
  type: string;
  title: string;
  short: string;
  shortDescription?: string;
  description: string;
  match: number;
  matchScore?: number;
  meta: string;
  metaInfo?: string;
  tags: string;
  color?: string;
  status?: string;
  externalUrl?: string;
  url?: string;
  companyId?: number;
  companyName?: string;
}

export interface CompanyProfileData {
  id?: number;
  userId?: number;
  name: string;
  type: string;
  sector: string;
  location: string;
  cnpj?: string;
  phone?: string;
  website?: string;
  description: string;
  demands: string;
  tags: string;
  preferredStage?: string;
  operationMode?: string;
  avatarUrl?: string;
}

export interface StartupMatchItem {
  id?: number;
  startupId: number;
  startupName: string;
  name?: string;
  mainArea: string;
  description: string;
  shortDescription?: string;
  problem?: string;
  howItWorks?: string;
  cnpj?: string;
  technologies: string;
  businessModel: string;
  currentStage: string;
  trlScore?: number;
  tractionAttested?: boolean;
  location: string;
  website?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  matchScore: number;
  justification: string;
  recommendedAction: string;
  reasons: MatchReasonDetails;
  interestedInCompanyPoc?: boolean;
  matchedCompanyOpportunitiesCount?: number;
  interestedOpportunities?: Array<{
    opportunityId: number;
    title: string;
    type: string;
    status: string;
    matchScore?: number;
  }>;
}

export interface CompanyMatchItem {
  id?: number;
  companyId: number;
  companyName: string;
  name?: string;
  companyType: string;
  type?: string;
  sector: string;
  description: string;
  demands?: string;
  tags: string;
  location: string;
  website?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  operationMode?: string;
  preferredStage?: string;
  avatarUrl?: string;
  matchScore: number;
  justification: string;
  recommendedAction: string;
  reasons: MatchReasonDetails;
}

export interface MatchReasonDetails {
  perfil?: string;
  requisitos?: string;
  objetivo?: string;
  contexto?: string;
}

export interface MatchItem {
  id: number;
  startupId: number;
  startupName: string;
  opportunityId: number;
  opportunityCode?: string;
  opportunityTitle: string;
  opportunityType: string;
  opportunityShort?: string;
  opportunityMeta?: string;
  opportunityDescription?: string;
  opportunityTags?: string;
  opportunityColor?: string;
  opportunityExternalUrl?: string;
  opportunityCompanyId?: number;
  opportunityCompanyName?: string;
  matchScore: number;
  justification: string;
  recommendedAction: string;
  reasons: MatchReasonDetails;
  status: string;
}

export interface StartupProfileData {
  id?: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  name: string;
  mainArea: string;
  description: string;
  location: string;
  cnpj: string;
  phone?: string;
  website: string;
  foundedYear: string;
  problem: string;
  howItWorks: string;
  differentiator: string;
  impact: string;
  technologies: string;
  businessModel: string;
  targetAudience: string;
  mainSector: string;
  operationRegion: string;
  state: string;
  customerProfile: string;
  marketSize: string;
  competitors: string;
  mainChannel: string;
  currentStage: string;
  trlScore?: number;
  tractionAttested?: boolean;
  tractionAttestationInfo?: string;
  cumulativeOpportunitiesFound?: number;
  lastUpdateNewMatchesCount?: number;
  tractionCustomers: string;
  productMaturity: string;
  teamSize: string;
  annualRevenue: string;
  recentGrowth: string;
  investmentRaised: string;
  mainObjective: string;
  investmentNeed: string;
  executionDeadline: string;
  resourceUse: string;
  twelveMonthGoal: string;
  strategicPriority: string;
  desiredPartners: string;
  areasOfInterest: string;
  opportunityTypes: string;
  receiveAiRecommendations: boolean;
  emailNotifications?: boolean;
  matchAlerts?: boolean;
}

export interface DashboardSummary {
  startupName: string;
  greeting: string;
  opportunitiesFoundCount?: number;
  companyMatchesCount?: number;
  newMatchesLastUpdateCount?: number;
  savedOpportunitiesCount: number;
  newMatchesCount: number;
  deadlinesThisWeekCount: number;
  trackingCount: number;
  pendingActionsCount: number;
  pendingActionsText: string;
  upcomingDeadlines: Array<{
    id?: string;
    type: string;
    title: string;
    subtitle: string;
    companyId?: string;
    companyName?: string;
  }>;
  recentActivities: Array<{ text: string; time: string }>;
}

export interface CompanyDashboardSummary {
  companyId?: number;
  companyName: string;
  greeting: string;
  matchedStartupsCount: number;
  pocsPurchasesCreatedCount: number;
  bannerTitle: string;
  bannerText: string;
  recentOpportunities: OpportunityItem[];
  recentStartupMatches: StartupMatchItem[];
  startupMatchesHistory: StartupMatchItem[];
}

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  timeAgo: string;
  type: string;
  read: boolean;
  recipientRole?: string;
  startupId?: number;
  companyId?: number;
  targetScreen?: string;
  targetId?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errJson = await response.json();
      errorMessage = errJson.message || errJson.detail || errJson.error || JSON.stringify(errJson);
    } catch {
      const errText = await response.text();
      if (errText) errorMessage = errText;
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  // Autenticação e Conta
  login: (data: { email: string; password: string }) =>
    request<{
      success: boolean;
      token: string;
      userId: number;
      email: string;
      name: string;
      cnpj?: string;
      phone?: string;
      avatarUrl?: string;
      startupProfileId?: number;
      companyId?: number;
      accountType?: "STARTUP" | "COMPANY";
      message?: string;
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  signup: (data: {
    cnpj: string;
    email: string;
    password: string;
    confirm?: string;
    name?: string;
    phone?: string;
    accountType?: "STARTUP" | "COMPANY";
  }) =>
    request<{
      success: boolean;
      token: string;
      userId: number;
      email: string;
      name: string;
      cnpj?: string;
      phone?: string;
      avatarUrl?: string;
      startupProfileId?: number;
      companyId?: number;
      accountType?: "STARTUP" | "COMPANY";
      message?: string;
    }>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  getUser: (userId: number) =>
    request<{
      success: boolean;
      userId: number;
      email: string;
      name: string;
      cnpj?: string;
      phone?: string;
      avatarUrl?: string;
      startupProfileId?: number;
      companyId?: number;
      accountType?: "STARTUP" | "COMPANY";
    }>(`/auth/user/${userId}`),

  updateUser: (
    userId: number,
    data: { name?: string; email?: string; cnpj?: string; phone?: string; avatarUrl?: string; accountType?: "STARTUP" | "COMPANY" }
  ) =>
    request<{
      success: boolean;
      userId: number;
      email: string;
      name: string;
      cnpj?: string;
      phone?: string;
      avatarUrl?: string;
      startupProfileId?: number;
      companyId?: number;
      accountType?: "STARTUP" | "COMPANY";
    }>(`/auth/user/${userId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteUser: (userId: number) =>
    request<void>(`/auth/user/${userId}`, { method: "DELETE" }),

  resetPassword: (data: { email: string; newPassword?: string }) =>
    request<void>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),

  // Startup Profile
  getAllStartups: () => request<StartupProfileData[]>("/startups"),
  getDefaultProfile: () => request<StartupProfileData>("/startups/default"),
  getProfile: (id: number) => request<StartupProfileData>(`/startups/${id}`),
  getProfileByUser: (userId: number) => request<StartupProfileData>(`/startups/user/${userId}`),
  updateProfile: (id: number, data: Partial<StartupProfileData>) =>
    request<StartupProfileData>(`/startups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updatePreferences: (
    id: number,
    data: {
      areasOfInterest?: string;
      opportunityTypes?: string;
      receiveAiRecommendations?: boolean;
      emailNotifications?: boolean;
      matchAlerts?: boolean;
      mainSector?: string;
      technologies?: string;
      operationRegion?: string;
      currentStage?: string;
      trlScore?: number;
      tractionAttested?: boolean;
      tractionAttestationInfo?: string;
      investmentNeed?: string;
      avatarUrl?: string;
    }
  ) =>
    request<StartupProfileData>(`/startups/${id}/preferences`, { method: "PUT", body: JSON.stringify(data) }),

  // Oportunidades e Empresas
  getOpportunities: (type?: string, query?: string, companyId?: number) => {
    const params = new URLSearchParams();
    if (type && type !== "Todos") params.set("type", type);
    if (query) params.set("query", query);
    if (companyId) params.set("companyId", String(companyId));
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request<OpportunityItem[]>(`/opportunities${queryString}`);
  },

  getOpportunity: (id: string | number) => request<OpportunityItem>(`/opportunities/${id}`),

  createOpportunity: (data: {
    type: string;
    title: string;
    description: string;
    tags?: string;
    meta?: string;
    externalUrl?: string;
    status?: string;
    companyId?: number;
    companyName?: string;
  }) =>
    request<OpportunityItem>("/opportunities", { method: "POST", body: JSON.stringify(data) }),

  updateOpportunity: (
    id: string | number,
    data: {
      type?: string;
      title?: string;
      description?: string;
      tags?: string;
      meta?: string;
      externalUrl?: string;
      status?: string;
      companyId?: number;
    }
  ) =>
    request<OpportunityItem>(`/opportunities/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getCompanies: () => request<CompanyProfileData[]>("/companies"),
  getDefaultCompany: () => request<CompanyProfileData>("/companies/default"),
  getCompany: (id: number) => request<CompanyProfileData>(`/companies/${id}`),
  getCompanyByUser: (userId: number) => request<CompanyProfileData>(`/companies/user/${userId}`),
  updateCompany: (id: number, data: Partial<CompanyProfileData>) =>
    request<CompanyProfileData>(`/companies/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  createCompany: (data: Partial<CompanyProfileData>) =>
    request<CompanyProfileData>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Matches e IA
  getMatches: (startupId?: number) => {
    const s = getSession();
    if (!startupId && s?.accountType === "COMPANY") {
      return Promise.resolve([]);
    }
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    if (!resolvedId) {
      return Promise.resolve([]);
    }
    return request<MatchItem[]>(`/matches?startupId=${resolvedId}`);
  },
  getMatch: (id: number) => request<MatchItem>(`/matches/${id}`),
  recalculateMatches: (startupId?: number, scrapeLiveWeb = true) => {
    const s = getSession();
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    return request<MatchItem[]>("/matches/recalculate", {
      method: "POST",
      body: JSON.stringify({ startupId: resolvedId, scrapeLiveWeb }),
    });
  },
  participateInOpportunity: (startupId: number | undefined, opportunityId: string | number) => {
    const s = getSession();
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    return request<MatchItem>("/matches/participate", {
      method: "POST",
      body: JSON.stringify({ startupId: resolvedId, opportunityId }),
    });
  },
  unparticipateInOpportunity: (
    startupId: number | undefined,
    opportunityId?: string | number,
    matchId?: number,
    title?: string
  ) => {
    const s = getSession();
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    return request<{ removed: boolean }>("/matches/unparticipate", {
      method: "POST",
      body: JSON.stringify({ startupId: resolvedId, opportunityId, matchId, title }),
    });
  },
  updateMatchStatus: (matchId: number, status: string) =>
    request<MatchItem>(`/matches/${matchId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getCompanyStartupsMatches: (companyId?: number) => {
    const s = getSession();
    const resolvedId = companyId ?? s?.companyId ?? s?.userId;
    const qs = resolvedId ? `?companyId=${resolvedId}` : "";
    return request<StartupMatchItem[]>(`/matches/company-startups${qs}`);
  },
  getStartupCompaniesMatches: (startupId?: number) => {
    const s = getSession();
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    const qs = resolvedId ? `?startupId=${resolvedId}` : "";
    return request<CompanyMatchItem[]>(`/matches/startup-companies${qs}`);
  },
  expressInterestInCompany: (startupId?: number, companyId?: number) => {
    const s = getSession();
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    return request<{ registered: boolean; companyId: number; companyName: string; opportunitiesLinked: number }>(
      "/matches/company-interest",
      {
        method: "POST",
        body: JSON.stringify({ startupId: resolvedId, companyId }),
      }
    );
  },
  expressInterestInStartup: (companyId?: number, startupId?: number) => {
    const s = getSession();
    const resolvedCompanyId = companyId ?? s?.companyId ?? s?.userId;
    return request<{ registered: boolean; companyId: number; companyName: string; startupId: number; startupName: string }>(
      "/matches/startup-interest",
      {
        method: "POST",
        body: JSON.stringify({ companyId: resolvedCompanyId, startupId }),
      }
    );
  },

  // Home / Dashboard
  getDashboardSummary: (startupId?: number) => {
    const s = getSession();
    const resolvedId = startupId ?? s?.startupProfileId ?? s?.userId;
    const qs = resolvedId ? `?startupId=${resolvedId}` : "";
    return request<DashboardSummary>(`/dashboard/summary${qs}`);
  },
  getCompanyDashboardSummary: (companyId?: number) => {
    const s = getSession();
    const resolvedId = companyId ?? s?.companyId ?? s?.userId;
    const qs = resolvedId ? `?companyId=${resolvedId}` : "";
    return request<CompanyDashboardSummary>(`/dashboard/company-summary${qs}`);
  },

  // Notificações integradas por perfil (Startup e Empresa)
  getNotifications: (
    params?:
      | string
      | {
          type?: string;
          role?: string;
          userId?: number;
          startupId?: number;
          companyId?: number;
        }
  ) => {
    const search = new URLSearchParams();
    if (typeof params === "string") {
      if (params && params !== "Todas") search.set("type", params);
      const sess = getSession();
      if (sess?.accountType) search.set("role", sess.accountType);
      if (sess?.userId) search.set("userId", String(sess.userId));
      if (sess?.startupProfileId) search.set("startupId", String(sess.startupProfileId));
      if (sess?.companyId) search.set("companyId", String(sess.companyId));
    } else if (params) {
      if (params.type && params.type !== "Todas") search.set("type", params.type);
      if (params.role) search.set("role", params.role);
      if (params.userId) search.set("userId", String(params.userId));
      if (params.startupId) search.set("startupId", String(params.startupId));
      if (params.companyId) search.set("companyId", String(params.companyId));
    } else {
      const sess = getSession();
      if (sess?.accountType) search.set("role", sess.accountType);
      if (sess?.userId) search.set("userId", String(sess.userId));
      if (sess?.startupProfileId) search.set("startupId", String(sess.startupProfileId));
      if (sess?.companyId) search.set("companyId", String(sess.companyId));
    }
    const qs = search.toString() ? `?${search.toString()}` : "";
    return request<NotificationItem[]>(`/notifications${qs}`);
  },

  markNotificationRead: (id: number) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: "PUT" }),

  markAllNotificationsRead: (params?: {
    role?: string;
    userId?: number;
    startupId?: number;
    companyId?: number;
  }) => {
    const sess = getSession();
    const search = new URLSearchParams();
    const role = params?.role || sess?.accountType;
    const userId = params?.userId || sess?.userId;
    const startupId = params?.startupId || sess?.startupProfileId;
    const companyId = params?.companyId || sess?.companyId;
    if (role) search.set("role", role);
    if (userId) search.set("userId", String(userId));
    if (startupId) search.set("startupId", String(startupId));
    if (companyId) search.set("companyId", String(companyId));
    const qs = search.toString() ? `?${search.toString()}` : "";
    return request<void>(`/notifications/read-all${qs}`, { method: "POST" });
  },

  // IA Assistente, Melhoria de Texto e Atestado de Tração
  enhanceProblemAI: (data: { text: string; mainArea?: string; startupName?: string }) =>
    request<{
      enhancedText: string;
      tags: string[];
      technologies: string;
      businessModel: string;
      howItWorks: string;
      differentiator: string;
      impact: string;
      targetAudience: string;
    }>("/ai/enhance-problem", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => ({
      ...res,
      enhancedText: stripMarkdownToPlainText(res.enhancedText),
      howItWorks: stripMarkdownToPlainText(res.howItWorks),
      differentiator: stripMarkdownToPlainText(res.differentiator),
      impact: stripMarkdownToPlainText(res.impact),
      targetAudience: stripMarkdownToPlainText(res.targetAudience),
    })),

  verifyTractionPdfAI: (data: {
    fileName: string;
    fileBase64: string;
    trlScore: number;
    trlAnswers?: Array<{ question: string; answer: string; level?: number }>;
    startupName?: string;
    mainArea?: string;
  }) =>
    request<{
      attested: boolean;
      trlLevel: number;
      attestationSummary: string;
      productMaturity: string;
      tractionCustomers: string;
      annualRevenue: string;
      recentGrowth: string;
      extractedHighlights: string[];
    }>("/ai/verify-traction-pdf", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => ({
      ...res,
      attestationSummary: stripMarkdownToPlainText(res.attestationSummary),
    })),

  chatAI: (
    messages: Array<{ from: string; text: string }>,
    startupId?: number,
    extra?: {
      selectedOpportunity?: Partial<OpportunityItem> | null;
      attachmentName?: string;
      attachmentBase64?: string;
      attachmentText?: string;
    }
  ) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, startupId, ...(extra || {}) }),
    }).then((res) => ({
      ...res,
      reply: stripMarkdownToPlainText(res.reply),
    })),

  getAiStatus: () => request<{ status: string; groqConnected: boolean; model: string }>("/ai/status"),
};
