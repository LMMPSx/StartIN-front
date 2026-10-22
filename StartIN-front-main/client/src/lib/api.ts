/**
 * Cliente de Integração Completa com o Backend Spring Boot (Java 21 + MySQL) e IA Python do StartIn
 */

const API_BASE_URL = "http://localhost:8080/api";

export interface UserSession {
  token?: string;
  userId: number;
  startupProfileId: number;
  email: string;
  name: string;
  cnpj?: string;
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
  name: string;
  mainArea: string;
  description: string;
  location: string;
  cnpj: string;
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
}

export interface DashboardSummary {
  startupName: string;
  greeting: string;
  savedOpportunitiesCount: number;
  newMatchesCount: number;
  deadlinesThisWeekCount: number;
  trackingCount: number;
  pendingActionsCount: number;
  pendingActionsText: string;
  upcomingDeadlines: Array<{ id?: string; type: string; title: string; subtitle: string }>;
  recentActivities: Array<{ text: string; time: string }>;
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
    request<{ success: boolean; token: string; userId: number; email: string; name: string; cnpj?: string; startupProfileId: number; message?: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(data) }
    ),

  signup: (data: { cnpj: string; email: string; password: string; confirm?: string; name?: string }) =>
    request<{ success: boolean; token: string; userId: number; email: string; name: string; cnpj?: string; startupProfileId: number; message?: string }>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify(data) }
    ),

  getUser: (userId: number) =>
    request<{ success: boolean; userId: number; email: string; name: string; cnpj?: string; startupProfileId: number }>(`/auth/user/${userId}`),

  updateUser: (userId: number, data: { name?: string; email?: string; cnpj?: string }) =>
    request<{ success: boolean; userId: number; email: string; name: string; cnpj?: string; startupProfileId: number }>(
      `/auth/user/${userId}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),

  deleteUser: (userId: number) =>
    request<void>(`/auth/user/${userId}`, { method: "DELETE" }),

  resetPassword: (data: { email: string; newPassword?: string }) =>
    request<void>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),

  // Startup Profile
  getDefaultProfile: () => request<StartupProfileData>("/startups/default"),
  getProfile: (id: number) => request<StartupProfileData>(`/startups/${id}`),
  getProfileByUser: (userId: number) => request<StartupProfileData>(`/startups/user/${userId}`),
  updateProfile: (id: number, data: Partial<StartupProfileData>) =>
    request<StartupProfileData>(`/startups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updatePreferences: (id: number, data: { areasOfInterest?: string; opportunityTypes?: string; receiveAiRecommendations?: boolean }) =>
    request<StartupProfileData>(`/startups/${id}/preferences`, { method: "PUT", body: JSON.stringify(data) }),

  // Oportunidades e Empresas
  getOpportunities: (type?: string, query?: string) => {
    const params = new URLSearchParams();
    if (type && type !== "Todos") params.set("type", type);
    if (query) params.set("query", query);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request<OpportunityItem[]>(`/opportunities${queryString}`);
  },

  getOpportunity: (id: string | number) => request<OpportunityItem>(`/opportunities/${id}`),

  createOpportunity: (data: { type: string; title: string; description: string; tags?: string; meta?: string; externalUrl?: string }) =>
    request<OpportunityItem>("/opportunities", { method: "POST", body: JSON.stringify(data) }),

  createCompany: (data: { name: string; type: string; description: string; tags?: string }) =>
    request<{ id: number; name: string; type: string; description: string; tags: string }>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Matches e IA
  getMatches: (startupId?: number) => {
    const qs = startupId ? `?startupId=${startupId}` : "";
    return request<MatchItem[]>(`/matches${qs}`);
  },
  getMatch: (id: number) => request<MatchItem>(`/matches/${id}`),
  recalculateMatches: (startupId?: number, scrapeLiveWeb = true) =>
    request<MatchItem[]>("/matches/recalculate", {
      method: "POST",
      body: JSON.stringify({ startupId, scrapeLiveWeb }),
    }),
  participateInOpportunity: (startupId: number | undefined, opportunityId: string | number) =>
    request<MatchItem>("/matches/participate", {
      method: "POST",
      body: JSON.stringify({ startupId, opportunityId }),
    }),
  updateMatchStatus: (matchId: number, status: string) =>
    request<MatchItem>(`/matches/${matchId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Dashboard
  getDashboardSummary: (startupId?: number) => {
    const qs = startupId ? `?startupId=${startupId}` : "";
    return request<DashboardSummary>(`/dashboard/summary${qs}`);
  },

  // Notificações
  getNotifications: (type?: string) => {
    const qs = type && type !== "Todas" ? `?type=${encodeURIComponent(type)}` : "";
    return request<Array<{ id: number; title: string; description: string; timeAgo: string; type: string; read: boolean }>>(
      `/notifications${qs}`
    );
  },

  // IA Assistente
  chatAI: (messages: Array<{ from: string; text: string }>, startupId?: number) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, startupId }),
    }),

  getAiStatus: () => request<{ status: string; groqConnected: boolean; model: string }>("/ai/status"),
};
