export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "NH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

export function formatOppType(type?: string): string {
  if (!type) return "Edital";
  const upper = type.toUpperCase();
  if (upper === "EDITAL") return "Edital";
  if (upper === "EVENTO") return "Evento";
  if (upper === "COMPRA") return "Compra";
  if (upper === "POC") return "POC";
  return type;
}

export function getBadgeColorByType(type?: string, customColor?: string): string {
  if (customColor) return customColor;
  const upper = (type || "").toUpperCase();
  if (upper === "POC") return "startin-badge-poc";
  if (upper === "EVENTO") return "startin-badge-evento";
  if (upper === "COMPRA") return "startin-badge-compra";
  return "startin-badge-edital";
}
