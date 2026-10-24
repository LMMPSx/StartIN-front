import {
  Bookmark,
  Bot,
  Compass,
  FileText,
  Heart,
  HomeIcon,
  Sparkles,
} from "@/icons";

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
  | "matches"
  | "saved-opportunities"
  | "my-opportunities"
  | "assistant"
  | "startup"
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

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon },
  { id: "for-you", label: "Para você", icon: Sparkles },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "matches", label: "Matches", icon: Heart },
  { id: "saved-opportunities", label: "Salvos", icon: Bookmark },
  { id: "my-opportunities", label: "Minhas oportunidades", icon: FileText },
  { id: "assistant", label: "Assistente IA", icon: Bot },
] as const;
