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
  providerId?: number;
  accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
  plan?: "FREE" | "PRO" | string;
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

export function isProUser(sessionOverride?: UserSession | null): boolean {
  const s = sessionOverride !== undefined ? sessionOverride : getSession();
  if (!s) return false;
  if (s.accountType === "ADMIN") return true;
  return String(s.plan || "FREE").toUpperCase() === "PRO";
}

/**
 * Aplica a regra do Plano Free:
 * - Retorna 1 item com o maior match (>= 90% ou o melhor disponível)
 * - Retorna até `maxLowCount` itens com match <= 70% (ou adaptados para <= 70% caso o banco tenha poucos itens)
 * - No Plano Pro, retorna 100% dos itens sem restrição.
 */
export function applyFreeTierFilter<T extends Record<string, any>>(
  items: T[],
  getScore: (item: T) => number,
  maxLowCount = 3,
  _setScore?: (item: T, newScore: number) => T
): { visible: T[]; hiddenCount: number; isFree: boolean } {
  const pro = isProUser();
  if (pro || !items || items.length === 0) {
    return { visible: items || [], hiddenCount: 0, isFree: !pro };
  }

  const sorted = [...items].sort((a, b) => getScore(b) - getScore(a));
  const highItem = sorted[0];

  const rest = sorted.filter((it) => it !== highItem);
  const naturalLow = rest.filter((it) => getScore(it) <= 70);
  const lowList: T[] = [];

  for (const item of naturalLow) {
    if (maxLowCount > 0 && lowList.length >= maxLowCount) break;
    lowList.push(item);
  }

  if (lowList.length < maxLowCount) {
    for (const item of rest) {
      if (lowList.length >= maxLowCount) break;
      if (lowList.includes(item)) continue;
      lowList.push(item);
    }
  }

  const visible = highItem ? [highItem, ...lowList] : lowList;
  const hiddenCount = Math.max(1, items.length - visible.length);
  return { visible, hiddenCount, isFree: true };
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
  startupId?: number;
  startupName?: string;
  targetCategory?: string;
  proMember?: boolean;
}

export interface ServiceProviderData {
  id?: number;
  userId?: number;
  photoUrl?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  name: string;
  providerType: "PROFISSIONAL" | "EMPRESA" | string;
  category: string;
  description: string;
  location: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  availability?: string;
  mainService: string;
  serviceExperience?: string;
  toolsAndSkills?: string;
  complementaryCategory?: string;
  targetSegment?: string;
  experienceYears?: number | string;
  projectName?: string;
  projectLink?: string;
  projectDescription?: string;
  projectYear?: string;
  projectRepoUrl?: string;
  projectTools?: string;
  projectType?: string;
  projectCoverUrl?: string;
  interestSectors?: string;
  connectionPreference?: string;
  opportunitiesSought?: string;
  interestRegion?: string;
  targetStartupSize?: string;
  communicationLanguage?: string;
  tags?: string;
  savedStartupIds?: string;
  matchScore?: number;
  justification?: string;
  matchReasons?: Record<string, string>;
  activeConnectionsCount?: number;
}

export interface ServiceConnectionItem {
  id: number;
  startupId: number;
  startupName: string;
  startupSegment?: string;
  startupStage?: string;
  startupMainArea?: string;
  startupDescription?: string;
  startupAvatarUrl?: string;
  startupEmail?: string;
  startupPhone?: string;
  startupWebsite?: string;
  startupLocation?: string;
  providerId: number;
  providerName: string;
  providerType?: string;
  providerCategory?: string;
  providerMainService?: string;
  providerAvatarUrl?: string;
  providerEmail?: string;
  providerPhone?: string;
  providerLinkedinUrl?: string;
  providerPortfolioUrl?: string;
  providerLocation?: string;
  senderType: "STARTUP" | "PROVIDER" | string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | string;
  matchScore: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceConnectionPayload {
  startupId: number;
  providerId: number;
  senderType: "STARTUP" | "PROVIDER" | string;
  message: string;
  matchScore?: number;
}

export interface ProviderDashboardSummary {
  providerId?: number;
  providerName: string;
  providerCategory?: string;
  greeting: string;
  savedStartupsCount: number;
  suggestedStartupsCount: number;
  receivedRequestsCount: number;
  activeConnectionsCount: number;
  recommendedStartups: Array<{
    id: number;
    name: string;
    area: string;
    matchScore: number;
    location: string;
    description: string;
  }>;
  recentActivities: Array<{ text: string; time: string }>;
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
      providerId?: number;
      accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
      plan?: "FREE" | "PRO" | string;
      message?: string;
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  signup: (data: {
    cnpj: string;
    email: string;
    password: string;
    confirm?: string;
    name?: string;
    phone?: string;
    accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
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
      providerId?: number;
      accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
      plan?: "FREE" | "PRO" | string;
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
      providerId?: number;
      accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
      plan?: "FREE" | "PRO" | string;
    }>(`/auth/user/${userId}`),

  updateUser: (
    userId: number,
    data: {
      name?: string;
      email?: string;
      cnpj?: string;
      phone?: string;
      password?: string;
      avatarUrl?: string;
      accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
      plan?: "FREE" | "PRO" | string;
    }
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
      providerId?: number;
      accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
      plan?: "FREE" | "PRO" | string;
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

  // Oportunidades e Demandas
  getOpportunities: (type?: string, query?: string, companyId?: number, startupId?: number) => {
    const params = new URLSearchParams();
    if (type && type !== "Todos") params.set("type", type);
    if (query) params.set("query", query);
    if (companyId) params.set("companyId", String(companyId));
    if (startupId) params.set("startupId", String(startupId));
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
    startupId?: number;
    startupName?: string;
    targetCategory?: string;
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
      startupId?: number;
      targetCategory?: string;
    }
  ) =>
    request<OpportunityItem>(`/opportunities/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteOpportunity: (id: string | number) =>
    request<{ deleted: boolean; id: number }>(`/opportunities/${id}`, {
      method: "DELETE",
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

  // Prestadores de Serviço (Providers)
  getProviders: (category?: string, query?: string, startupId?: number) => {
    const s = getSession();
    const params = new URLSearchParams();
    if (category && category !== "Todos") params.set("category", category);
    if (query) params.set("q", query);
    const resolvedStartupId = startupId ?? (s?.accountType === "STARTUP" ? s?.startupProfileId : undefined);
    if (resolvedStartupId) params.set("startupId", String(resolvedStartupId));
    if (s?.userId && s?.accountType === "STARTUP") params.set("userId", String(s.userId));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<ServiceProviderData[]>(`/providers${qs}`);
  },
  getProvider: (id: number, startupId?: number) => {
    const s = getSession();
    const params = new URLSearchParams();
    const resolvedStartupId = startupId ?? (s?.accountType === "STARTUP" ? s?.startupProfileId : undefined);
    if (resolvedStartupId) params.set("startupId", String(resolvedStartupId));
    if (s?.userId && s?.accountType === "STARTUP") params.set("userId", String(s.userId));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<ServiceProviderData>(`/providers/${id}${qs}`);
  },
  getProviderByUser: (userId: number) => request<ServiceProviderData>(`/providers/user/${userId}`),
  createProvider: (data: Partial<ServiceProviderData>) =>
    request<ServiceProviderData>("/providers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProvider: (id: number, data: Partial<ServiceProviderData>) =>
    request<ServiceProviderData>(`/providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Startups em Tração recomendadas/salvas para o Prestador (com cálculo real de IA)
  getProviderMatchingStartups: (options?: { providerId?: number; onlySaved?: boolean }) => {
    const s = getSession();
    const params = new URLSearchParams();
    const resolvedProviderId = options?.providerId ?? s?.providerId;
    if (resolvedProviderId) params.set("providerId", String(resolvedProviderId));
    if (s?.userId) params.set("userId", String(s.userId));
    if (options?.onlySaved) params.set("onlySaved", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<any[]>(`/providers/matching-startups${qs}`);
  },

  toggleProviderSavedStartup: (startupId: number, providerId?: number) => {
    const s = getSession();
    const params = new URLSearchParams();
    const resolvedProviderId = providerId ?? s?.providerId;
    if (resolvedProviderId) params.set("providerId", String(resolvedProviderId));
    if (s?.userId) params.set("userId", String(s.userId));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<{
      saved: boolean;
      startupId: number;
      savedStartupIds: number[];
      savedStartupsCount: number;
    }>(`/providers/saved-startups/${startupId}${qs}`, {
      method: "POST",
    });
  },

  // Conexões e Solicitações entre Startups e Prestadores
  getConnections: (params?: { startupId?: number; providerId?: number; status?: string }) => {
    const s = getSession();
    const search = new URLSearchParams();
    const stId = params?.startupId ?? (s?.accountType === "STARTUP" ? s?.startupProfileId : undefined);
    const prId = params?.providerId ?? (s?.accountType === "PROVIDER" ? s?.providerId : undefined);
    if (stId) search.set("startupId", String(stId));
    if (prId) search.set("providerId", String(prId));
    if (s?.userId) search.set("userId", String(s.userId));
    if (s?.accountType) search.set("role", s.accountType);
    if (params?.status && params.status !== "ALL") search.set("status", params.status);
    const qs = search.toString() ? `?${search.toString()}` : "";
    return request<ServiceConnectionItem[]>(`/connections${qs}`);
  },
  createConnection: (payload: CreateServiceConnectionPayload) =>
    request<ServiceConnectionItem>("/connections", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateConnectionStatus: (id: number, status: "ACCEPTED" | "REJECTED" | "PENDING" | string) =>
    request<ServiceConnectionItem>(`/connections/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  acceptConnection: (id: number) =>
    request<ServiceConnectionItem>(`/connections/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ACCEPTED" }),
    }),
  rejectConnection: (id: number) =>
    request<ServiceConnectionItem>(`/connections/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "REJECTED" }),
    }),
  deleteConnection: (id: number) =>
    request<{ deleted: boolean; id: number }>(`/connections/${id}`, {
      method: "DELETE",
    }),

  // Provider Dashboard Summary
  getProviderDashboardSummary: (providerId?: number) => {
    const s = getSession();
    const params = new URLSearchParams();
    const resolvedId = providerId ?? s?.providerId;
    if (resolvedId) params.set("providerId", String(resolvedId));
    if (s?.userId) params.set("userId", String(s.userId));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<any>(`/providers/dashboard-summary${qs}`);
  },

  // Matches e IA
  getMatches: (startupId?: number) => {
    const s = getSession();
    if (!startupId && s?.accountType === "COMPANY") {
      return Promise.resolve([]);
    }
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    if (!resolvedStartupId && !resolvedUserId) {
      return Promise.resolve([]);
    }
    const params = new URLSearchParams();
    if (resolvedStartupId) params.set("startupId", String(resolvedStartupId));
    if (resolvedUserId) params.set("userId", String(resolvedUserId));
    return request<MatchItem[]>(`/matches?${params.toString()}`);
  },
  getMatch: (id: number) => request<MatchItem>(`/matches/${id}`),
  recalculateMatches: (startupId?: number, scrapeLiveWeb = true) => {
    const s = getSession();
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    return request<MatchItem[]>("/matches/recalculate", {
      method: "POST",
      body: JSON.stringify({ startupId: resolvedStartupId, userId: resolvedUserId, scrapeLiveWeb }),
    });
  },
  participateInOpportunity: (startupId: number | undefined, opportunityId: string | number) => {
    const s = getSession();
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    return request<MatchItem>("/matches/participate", {
      method: "POST",
      body: JSON.stringify({ startupId: resolvedStartupId, userId: resolvedUserId, opportunityId }),
    });
  },
  unparticipateInOpportunity: (
    startupId: number | undefined,
    opportunityId?: string | number,
    matchId?: number,
    title?: string
  ) => {
    const s = getSession();
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    return request<{ removed: boolean }>("/matches/unparticipate", {
      method: "POST",
      body: JSON.stringify({ startupId: resolvedStartupId, userId: resolvedUserId, opportunityId, matchId, title }),
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
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    const params = new URLSearchParams();
    if (resolvedStartupId) params.set("startupId", String(resolvedStartupId));
    if (resolvedUserId) params.set("userId", String(resolvedUserId));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<CompanyMatchItem[]>(`/matches/startup-companies${qs}`);
  },
  expressInterestInCompany: (startupId?: number, companyId?: number) => {
    const s = getSession();
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    return request<{ registered: boolean; companyId: number; companyName: string; opportunitiesLinked: number }>(
      "/matches/company-interest",
      {
        method: "POST",
        body: JSON.stringify({ startupId: resolvedStartupId, userId: resolvedUserId, companyId }),
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
    const resolvedStartupId = startupId ?? s?.startupProfileId;
    const resolvedUserId = s?.userId;
    const params = new URLSearchParams();
    if (resolvedStartupId) params.set("startupId", String(resolvedStartupId));
    if (resolvedUserId) params.set("userId", String(resolvedUserId));
    const qs = params.toString() ? `?${params.toString()}` : "";
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

  enhanceCompanyDemandsAI: (data: {
    text: string;
    sector?: string;
    companyName?: string;
    operationMode?: string;
  }) =>
    request<{
      enhancedText: string;
      tags: string[];
      technologies: string;
      priorityTopics: string[];
      howItWorks: string;
      impact: string;
    }>("/ai/enhance-company-demands", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => ({
      ...res,
      enhancedText: stripMarkdownToPlainText(res.enhancedText),
      howItWorks: stripMarkdownToPlainText(res.howItWorks),
      impact: stripMarkdownToPlainText(res.impact),
    })),

  enhanceProviderServicesAI: (data: {
    text: string;
    category?: string;
    providerName?: string;
    mainService?: string;
    providerType?: string;
    fieldType?: "bio" | "services" | "project";
  }) =>
    request<{
      enhancedText: string;
      tags: string[];
      toolsAndSkills?: string;
      technologies?: string;
      mainService?: string;
      serviceHighlights?: string[];
      valueProposition?: string;
    }>("/ai/enhance-provider-services", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => ({
      ...res,
      enhancedText: stripMarkdownToPlainText(res.enhancedText),
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

  extractProviderResumeAI: (data: {
    fileName: string;
    fileBase64: string;
    providerName?: string;
    providerType?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  }) =>
    request<{
      extracted: boolean;
      fileName: string;
      category: string;
      mainService: string;
      toolsAndSkills: string;
      tags: string[];
      experienceYears: string;
      location: string;
      projectName: string;
      projectType?: string;
      projectYear?: string;
      interestSectors?: string;
      connectionPreference?: string;
      opportunitiesSought?: string;
      description: string;
      serviceExperience?: string;
      projectDescription?: string;
      extractedHighlights?: string[];
    }>("/ai/extract-provider-resume", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => ({
      ...res,
      description: stripMarkdownToPlainText(res.description),
      serviceExperience: stripMarkdownToPlainText(res.serviceExperience || res.description),
      projectDescription: stripMarkdownToPlainText(res.projectDescription || res.description),
    })),

  chatAI: (
    messages: Array<{ from: string; text: string }>,
    startupId?: number,
    extra?: {
      accountType?: "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";
      providerId?: number;
      userId?: number;
      provider?: Partial<ServiceProviderData> | null;
      company?: Partial<CompanyProfileData> | null;
      selectedOpportunity?: Partial<OpportunityItem> | null;
      attachmentName?: string;
      attachmentBase64?: string;
      attachmentText?: string;
      templateStyle?: string;
    }
  ) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages,
        startupId,
        userId: extra?.userId ?? getSession()?.userId,
        ...(extra || {}),
      }),
    }).then((res) => ({
      ...res,
      reply: stripMarkdownToPlainText(res.reply),
    })),

  getAiStatus: () => request<{ status: string; groqConnected: boolean; model: string }>("/ai/status"),

  // Administração Geral (user: admin / password: 0000)
  getAdminOverview: () => request<Record<string, number>>("/admin/overview"),
  getAdminUsers: () => request<any[]>("/admin/users"),
  updateAdminUser: (id: number, data: Record<string, any>) =>
    request<any>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAdminUser: (id: number) =>
    request<{ deleted: boolean; id: number }>(`/admin/users/${id}`, { method: "DELETE" }),
  getAdminOpportunities: () => request<OpportunityItem[]>("/admin/opportunities"),
  updateAdminOpportunity: (id: number | string, data: Record<string, any>) =>
    request<OpportunityItem>(`/admin/opportunities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAdminOpportunity: (id: number | string) =>
    request<{ deleted: boolean; id: number }>(`/admin/opportunities/${id}`, { method: "DELETE" }),
  getAdminProcesses: () => request<any[]>("/admin/processes"),
  deleteAdminProcess: (type: "MATCH" | "CONNECTION" | string, id: number) =>
    request<{ deleted: boolean; id: number }>(`/admin/processes/${type}/${id}`, { method: "DELETE" }),
};
