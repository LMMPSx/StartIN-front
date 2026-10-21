/**
 * Cliente de Integração com o Backend Spring Boot (Java 21) e IA Python do StartIn
 */

const API_BASE_URL = "http://localhost:8080/api";

export interface OpportunityItem {
  id: string | number;
  code?: string;
  type: string;
  title: string;
  short: string;
  shortDescription?: string;
  description: string;
  match: number;
  meta: string;
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
  upcomingDeadlines: Array<{ type: string; title: string; subtitle: string }>;
  recentActivities: Array<{ text: string; time: string }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
  }
  return response.json();
}

export const api = {
  // Autenticação
  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; token: string; userId: number; email: string; name: string; startupProfileId: number }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(data) }
    ),

  signup: (data: { cnpj: string; email: string; password: string; confirm?: string; name?: string }) =>
    request<{ success: boolean; token: string; userId: number; startupProfileId: number }>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify(data) }
    ),

  resetPassword: (data: { email: string; newPassword?: string }) =>
    request<void>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),

  // Startup Profile
  getDefaultProfile: () => request<StartupProfileData>("/startups/default"),
  getProfile: (id: number) => request<StartupProfileData>(`/startups/${id}`),
  updateProfile: (id: number, data: Partial<StartupProfileData>) =>
    request<StartupProfileData>(`/startups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updatePreferences: (id: number, data: { areasOfInterest?: string; opportunityTypes?: string; receiveAiRecommendations?: boolean }) =>
    request<StartupProfileData>(`/startups/${id}/preferences`, { method: "PUT", body: JSON.stringify(data) }),

  // Oportunidades
  getOpportunities: (type?: string, query?: string) => {
    const params = new URLSearchParams();
    if (type && type !== "Todos") params.set("type", type);
    if (query) params.set("query", query);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request<OpportunityItem[]>(`/opportunities${queryString}`);
  },

  getOpportunity: (id: string | number) => request<OpportunityItem>(`/opportunities/${id}`),

  createOpportunity: (data: { type: string; title: string; description: string; tags?: string; meta?: string }) =>
    request<OpportunityItem>("/opportunities", { method: "POST", body: JSON.stringify(data) }),

  // Matches
  getMatches: (startupId = 1) => request<MatchItem[]>(`/matches?startupId=${startupId}`),
  getMatch: (id: number) => request<MatchItem>(`/matches/${id}`),
  recalculateMatches: (startupId = 1, scrapeLiveWeb = false) =>
    request<MatchItem[]>("/matches/recalculate", {
      method: "POST",
      body: JSON.stringify({ startupId, scrapeLiveWeb }),
    }),
  updateMatchStatus: (matchId: number, status: string) =>
    request<MatchItem>(`/matches/${matchId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Dashboard
  getDashboardSummary: (startupId = 1) => request<DashboardSummary>(`/dashboard/summary?startupId=${startupId}`),

  // Notificações
  getNotifications: (type?: string) => {
    const qs = type && type !== "Todas" ? `?type=${encodeURIComponent(type)}` : "";
    return request<Array<{ id: number; title: string; description: string; timeAgo: string; type: string; read: boolean }>>(
      `/notifications${qs}`
    );
  },

  // IA Assistente
  chatAI: (messages: Array<{ from: string; text: string }>, startup?: Partial<StartupProfileData>) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, startup }),
    }),

  getAiStatus: () => request<{ status: string; groqConnected: boolean; model: string }>("/ai/status"),
};
