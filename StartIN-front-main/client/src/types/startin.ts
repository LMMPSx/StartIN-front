import {
  ArrowUpDown,
  Bookmark,
  Bot,
  Briefcase,
  Building2,
  FilePlus2,
  FileText,
  HomeIcon,
  Rocket,
  Search,
  Sparkles,
} from "@/icons";

export type AccountType = "STARTUP" | "COMPANY" | "PROVIDER" | "ADMIN";

export type Screen =
  | "landing"
  | "login"
  | "signup"
  | "recovery"
  | "reset"
  | "verify"
  | "onboarding"
  | "dashboard"
  | "admin"
  | "for-you"
  | "explore"
  | "search-companies"
  | "search-startups"
  | "company-detail"
  | "startup-detail"
  | "matches"
  | "saved-opportunities"
  | "my-opportunities"
  | "assistant"
  | "startup"
  | "company-profile"
  | "settings"
  | "notifications"
  | "account"
  | "privacy"
  | "preferences"
  | "opportunity"
  | "match"
  | "create-company"
  | "create-opportunity"
  | "edit-opportunity"
  | "company-matches-history"
  | "interest-success"
  | "opportunity-success"
  | "provider-onboarding"
  | "provider-dashboard"
  | "explore-startups"
  | "explore-providers"
  | "provider-detail"
  | "request-connection"
  | "connection-sent"
  | "connections"
  | "connection-received"
  | "connection-accepted"
  | "connection-rejected"
  | "saved-providers"
  | "saved-startups"
  | "provider-profile"
  | "my-service-demands"
  | "create-service-demand"
  | "edit-service-demand";

export type OpportunityType =
  | "Todos"
  | "Editais"
  | "Eventos"
  | "POCs"
  | "Primeira Compra"
  | "Compras"
  | "Serviços";

export const NAV_ITEMS_STARTUP = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "for-you", label: "Para você", icon: Sparkles },
  { id: "search-companies", label: "Buscar empresas", icon: Building2 },
  { id: "saved-opportunities", label: "Salvos", icon: Bookmark },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;

export const NAV_ITEMS_STARTUP_TRACAO = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "for-you", label: "Para você", icon: Sparkles },
  { id: "explore-providers", label: "Explorar prestadores", icon: Briefcase },
  { id: "my-service-demands", label: "Demandas p/ prestadores", icon: FileText },
  { id: "connections", label: "Conexões", icon: ArrowUpDown },
  { id: "search-companies", label: "Buscar empresas", icon: Building2 },
  { id: "saved-opportunities", label: "Salvos", icon: Bookmark },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;

export const NAV_ITEMS_COMPANY = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "search-startups", label: "Buscar startups", icon: Rocket },
  { id: "my-opportunities", label: "Lançar oportunidades", icon: FileText },
  { id: "create-opportunity", label: "Nova POC / Compra", icon: FilePlus2 },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;

export const NAV_ITEMS_ADMIN = [
  { id: "admin", label: "Moderação & Controle", icon: Sparkles },
] as const;

export const NAV_ITEMS_PROVIDER = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "for-you", label: "Recomendações", icon: Sparkles },
  { id: "connections", label: "Conexões", icon: ArrowUpDown },
  { id: "saved-startups", label: "Oportunidades salvas", icon: Bookmark },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;

export const NAV_ITEMS = NAV_ITEMS_STARTUP;
