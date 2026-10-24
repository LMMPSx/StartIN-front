import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "@/icons";
import type { OpportunityItem } from "@/lib/api";
import { formatOppType, getBadgeColorByType } from "@/utils/formatters";

export function BackButton({
  label = "Voltar",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-2 rounded-lg py-1 text-xs font-bold text-[#6d7b87] transition hover:text-[#075394]"
    >
      <ArrowLeft size={14} /> {label}
    </button>
  );
}

export function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block">
      <span className="startin-field-label">{label}</span>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`startin-input transition ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((prev) => !prev)}
            title={showPassword ? "Ocultar senha" : "Visualizar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#75838f] transition hover:bg-[#edf2f6] hover:text-[#075394]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </label>
  );
}

export function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="startin-field-label">{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="startin-textarea transition"
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  full = false,
  secondary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  full?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${full ? "w-full" : ""} startin-btn transition ${
        secondary ? "startin-btn-secondary" : "startin-btn-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8d98a2]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[29px] font-extrabold tracking-[-.06em] text-[#062f61] md:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#707c87]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function OpportunityCard({
  item,
  onSelect,
}: {
  item: OpportunityItem;
  onSelect: (item: OpportunityItem) => void;
}) {
  const badgeColor = getBadgeColorByType(item.type, item.color);
  return (
    <article className="startin-opp-card transition">
      <div className="flex items-start justify-between">
        <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${badgeColor}`}>
          {formatOppType(item.type)}
        </span>
        <div className="text-right">
          <div className="text-[24px] font-extrabold tracking-[-.06em] text-[#25805e]">
            {item.match}%
          </div>
          <div className="text-[10px] text-[#94a0a8]">match</div>
        </div>
      </div>
      <h3 className="mt-4 text-[15px] font-extrabold leading-5 text-[#123b62]">{item.title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#75818b]">{item.short}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef1f3] pt-4">
        <span className="text-[10px] text-[#89959e]">Combina por: {item.tags}</span>
        <button
          onClick={() => onSelect(item)}
          className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#075394]"
        >
          Ver oportunidade <ArrowRight size={13} />
        </button>
      </div>
    </article>
  );
}
