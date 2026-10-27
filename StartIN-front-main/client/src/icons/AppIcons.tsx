import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Bookmark,
  Bot,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Filter,
  Heart,
  Home as HomeIcon,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

// =========================================================================
// ÍCONE OFICIAL DO FOGUETE STARTIN (EXTRAÍDO DA IMAGEM OFICIAL DA MARCA)
// =========================================================================
export const Rocket = React.forwardRef<any, { size?: number | string; className?: string; style?: React.CSSProperties; fill?: string }>(
  ({ size = 20, className = "", style }, ref) => {
    const s = typeof size === "number" ? `${size}px` : size;
    return (
      <span
        ref={ref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: s,
          height: s,
          flexShrink: 0,
          verticalAlign: "middle",
          ...style,
        }}
        className={className}
      >
        <img
          src="/icons/rocket-icon.png"
          alt="StartIn Rocket"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </span>
    );
  }
);
Rocket.displayName = "Rocket";

export const Startup = Rocket;
export const StartupRocket = Rocket;

// =========================================================================
// ÍCONES PADRÃO RESTAURADOS (LUCIDE ORIGINAL COM STROKE LIMPO)
// =========================================================================
export {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Bookmark,
  Bot,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Filter,
  Heart,
  HomeIcon,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  SettingsIcon,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
};

// Aliases de compatibilidade para toda a plataforma
export const Alerta = Bell;
export const Conexoes = ArrowUpDown;
export const BriefcaseBusiness = Compass;
export const MessageCircle = CircleHelp;
export const AddIcon = Plus;
