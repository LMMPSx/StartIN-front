import {
  Bookmark,
  Bot,
  Building2,
  Compass,
  FilePlus2,
  FileText,
  Heart,
  HomeIcon,
  Rocket,
  Sparkles,
} from "@/icons";

export type AccountType = "STARTUP" | "COMPANY";

export type Screen =
  | "login"
  | "signup"
  | "recovery"
  | "reset"
  | "verify"
  | "onboarding"
  | "dashboard"
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
  | "interest-success"
  | "opportunity-success";

export type OpportunityType = "Todos" | "Editais" | "Eventos" | "POCs" | "Compras";

export const NAV_ITEMS_STARTUP = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon },
  { id: "for-you", label: "Para você", icon: Sparkles },
  { id: "search-companies", label: "Buscar empresas", icon: Building2 },
  { id: "saved-opportunities", label: "Salvos", icon: Bookmark },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;

export const NAV_ITEMS_COMPANY = [
  { id: "search-startups", label: "Buscar startups", icon: Rocket },
  { id: "my-opportunities", label: "Lançar oportunidades", icon: FileText },
  { id: "create-opportunity", label: "Nova POC / Compra", icon: FilePlus2 },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;

export const NAV_ITEMS = NAV_ITEMS_STARTUP;
