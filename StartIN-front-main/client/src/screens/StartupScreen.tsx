import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, Plus, X } from "@/icons";
import { BackButton, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, getSession, saveSession, type StartupProfileData } from "@/lib/api";
import type { Screen } from "@/types/startin";
import { getInitials } from "@/utils/formatters";

const DEFAULT_INTEREST_AREAS = [
  "IA",
  "Saúde",
  "Dados",
  "Automação",
  "SaaS B2B",
  "FinTech",
  "Cloud",
  "IoT",
  "Analytics",
  "Educação",
];

const OPPORTUNITY_TYPE_OPTIONS = ["POC", "Compra", "Editais", "Eventos"];

export function Startup({
  go,
  startupId,
  profile,
  onProfileUpdated,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  profile: StartupProfileData | null;
  onProfileUpdated: (p: StartupProfileData) => void;
}) {
  const [receiveRecs, setReceiveRecs] = useState(profile?.receiveAiRecommendations ?? true);
  const [selectedOppTypes, setSelectedOppTypes] = useState<string[]>(() => {
    const raw = profile?.opportunityTypes || "POC, Compra, Editais";
    const parsed = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : ["POC", "Compra", "Editais"];
  });

  const [selectedAreas, setSelectedAreas] = useState<string[]>(() => {
    const raw = profile?.areasOfInterest || profile?.technologies || "IA, Saúde, Dados, Automação";
    const parsed = raw
      .split(/[,•]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : ["IA", "Saúde", "Dados", "Automação"];
  });

  const [customAreaInput, setCustomAreaInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>(
    profile?.avatarUrl || getSession()?.avatarUrl || ""
  );
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setReceiveRecs(profile.receiveAiRecommendations ?? true);
      if (profile.opportunityTypes) {
        const parsedTypes = profile.opportunityTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (parsedTypes.length > 0) setSelectedOppTypes(parsedTypes);
      }
      const rawAreas = profile.areasOfInterest || profile.technologies;
      if (rawAreas) {
        const parsedAreas = rawAreas
          .split(/[,•]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parsedAreas.length > 0) setSelectedAreas(parsedAreas);
      }
      if (profile.avatarUrl) {
        setAvatarUrl(profile.avatarUrl);
      }
    }
  }, [profile]);

  const toggleOppType = (t: string) => {
    setSelectedOppTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]
    );
  };

  const handleAddCustomArea = () => {
    const clean = customAreaInput.trim();
    if (!clean) return;
    if (!selectedAreas.includes(clean)) {
      setSelectedAreas((prev) => [...prev, clean]);
    }
    setCustomAreaInput("");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setAvatarUrl(dataUrl);
      const session = getSession();
      if (session) {
        saveSession({ ...session, avatarUrl: dataUrl });
      }
      try {
        const targetId = profile?.id || startupId || session?.startupProfileId || 1;
        const updated = await api.updatePreferences(targetId, { avatarUrl: dataUrl });
        onProfileUpdated(updated);
        setFeedbackMsg("Foto de perfil atualizada com sucesso!");
        setTimeout(() => setFeedbackMsg(""), 3500);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const allAvailableAreas = Array.from(new Set([...DEFAULT_INTEREST_AREAS, ...selectedAreas]));

  const savePrefs = async () => {
    setSaving(true);
    setFeedbackMsg("");
    try {
      const session = getSession();
      const targetId = profile?.id || startupId || session?.startupProfileId || 1;
      const updated = await api.updatePreferences(targetId, {
        areasOfInterest: selectedAreas.join(", "),
        opportunityTypes: selectedOppTypes.join(", "),
        receiveAiRecommendations: receiveRecs,
        avatarUrl: avatarUrl || undefined,
      });
      onProfileUpdated(updated);
      setFeedbackMsg(
        "Preferências de matching salvas! As oportunidades em 'Para você' foram filtradas pelo seu perfil."
      );
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch {
      setFeedbackMsg("Preferências atualizadas localmente.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name || "Nexa Health";
  const displaySubtitle =
    [profile?.mainArea, profile?.businessModel, profile?.location].filter(Boolean).join(" · ") ||
    "Healthtech · SaaS · B2B";

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />
      <PageTitle
        title="Minha startup"
        description="Perfil usado para personalizar os matches e as buscas da IA."
        action={
          <PrimaryButton secondary onClick={() => go("onboarding")}>
            Editar perfil completo
          </PrimaryButton>
        }
      />

      {feedbackMsg && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-[#b9e6d0] bg-[#ebfaf2] px-4 py-3 text-xs font-bold text-[#166d48]">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg("")} className="text-[#166d48]">
            <X size={14} />
          </button>
        </div>
      )}

      <section className="mt-8 flex flex-col justify-between gap-5 rounded-2xl border border-[#e2e7eb] bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-16 w-16 rounded-full border-2 border-[#075394] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#062f61] text-lg font-extrabold text-white">
                {getInitials(displayName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Adicionar ou alterar foto de perfil"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#075394] text-white shadow transition hover:bg-[#062f61]"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#123b62]">{displayName}</h2>
            <p className="mt-1 text-sm text-[#76838d]">{displaySubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d6e0e7] bg-[#f8fafc] px-4 py-2.5 text-xs font-bold text-[#075394] transition hover:bg-[#eaf2f8] sm:self-auto"
        >
          <Camera size={14} />
          {avatarUrl ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
        </button>
      </section>

      <section className="mt-7 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-extrabold text-[#123b62]">Preferências de matching</h2>
            <p className="mt-1 text-xs text-[#7d8a95]">
              Selecione as áreas e os tipos de oportunidade que deseja priorizar nas recomendações da IA.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#075394]">
            {selectedAreas.length} áreas · {selectedOppTypes.length} tipos ativos
          </span>
        </div>

        <div className="mt-7 grid gap-7 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-[#50697f]">
              Áreas de interesse (clique para ativar/desativar)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {allAvailableAreas.map((area) => {
                const isSelected = selectedAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                      isSelected
                        ? "bg-[#075394] text-white shadow-sm"
                        : "bg-[#eaf2f8] text-[#075394] opacity-75 hover:opacity-100"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={customAreaInput}
                onChange={(e) => setCustomAreaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomArea())}
                placeholder="Adicionar nova área (ex: Biotecnologia)..."
                className="h-9 flex-1 rounded-lg border border-[#d9e1e7] bg-[#f9fbfc] px-3 text-xs outline-none focus:border-[#075394]"
              />
              <button
                type="button"
                onClick={handleAddCustomArea}
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#eaf2f8] px-3 text-xs font-bold text-[#075394] hover:bg-[#dce9f4]"
              >
                <Plus size={13} /> Adicionar
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#50697f]">
              Tipos de oportunidade de interesse
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {OPPORTUNITY_TYPE_OPTIONS.map((x) => {
                const active = selectedOppTypes.includes(x);
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => toggleOppType(x)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-[#075394] text-white shadow-sm"
                        : "bg-[#f3f5f6] text-[#557086] hover:bg-[#e5ebef]"
                    }`}
                  >
                    {x}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-[#83919c]">
              As abas <strong>Para você</strong> e <strong>Matches</strong> filtram automaticamente as oportunidades de acordo com os tipos e áreas selecionados acima.
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[#edf0f2] pt-6">
          <div>
            <p className="text-sm font-bold text-[#284a67]">Receber recomendações da IA</p>
            <p className="mt-1 text-xs text-[#82909a]">
              Use seu perfil para personalizar novas oportunidades diariamente às 08h.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReceiveRecs(!receiveRecs)}
            className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
              receiveRecs ? "bg-[#075394]" : "bg-[#b8c4cc]"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                receiveRecs ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="mt-7 flex justify-end">
          <PrimaryButton disabled={saving} onClick={savePrefs}>
            Salvar preferências <Check size={15} />
          </PrimaryButton>
        </div>
      </section>
    </>
  );
}
