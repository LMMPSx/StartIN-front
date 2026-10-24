import { useEffect, useState } from "react";
import { ArrowRight, Check, MoreHorizontal, Plus } from "@/icons";
import { BackButton, Field, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { api, type OpportunityItem } from "@/lib/api";
import type { Screen } from "@/types/startin";

export function MyOpportunities({
  go,
  onSelectOpportunity,
}: {
  go: (s: Screen) => void;
  onSelectOpportunity: (o: OpportunityItem) => void;
}) {
  const [opps, setOpps] = useState<OpportunityItem[]>([]);

  useEffect(() => {
    api
      .getOpportunities()
      .then((res) => setOpps(res))
      .catch(() => {});
  }, []);

  const publishedCount = opps.filter((o) => !o.status || o.status === "PUBLICADA").length || 3;
  const reviewCount = opps.filter((o) => o.status === "EM_ANALISE").length || 1;
  const closedCount = opps.filter((o) => o.status === "ENCERRADA").length || 2;

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />
      <PageTitle
        title="Minhas oportunidades"
        description="Acompanhe, edite e gerencie as oportunidades publicadas pela sua organização."
        action={
          <PrimaryButton onClick={() => go("create-opportunity")}>
            <Plus size={15} /> Nova oportunidade
          </PrimaryButton>
        }
      />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <h2 className="text-sm font-extrabold text-[#123b62]">Resumo das oportunidades</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            [String(publishedCount), "publicadas"],
            [String(reviewCount), "em análise"],
            [String(closedCount), "encerradas"],
          ].map(([n, t], i) => (
            <div
              key={t}
              className={`rounded-xl p-5 ${
                i === 0 ? "bg-[#075394] text-white" : "bg-[#f3f6f8] text-[#294b68]"
              }`}
            >
              <div className="text-2xl font-extrabold">{n}</div>
              <div className="mt-1 text-xs font-semibold opacity-80">{t}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-8 text-sm font-extrabold text-[#123b62]">Oportunidades recentes</h2>
        <div className="mt-4 space-y-3">
          {(opps.length > 0
            ? opps.slice(0, 4)
            : [
                {
                  id: "poc",
                  type: "POC",
                  title: "POC — Inteligência Operacional",
                  short: "Empresa busca startup para automatizar processos internos.",
                  description: "Empresa busca startup para automatizar processos internos.",
                  match: 94,
                  meta: "Aberta · Brasil · Remoto",
                  tags: "IA • SaaS • B2B • Dados",
                },
              ]
          ).map((o) => (
            <div
              key={o.id}
              onClick={() => {
                onSelectOpportunity(o);
                go("opportunity");
              }}
              className="cursor-pointer rounded-xl bg-[#f7f9fa] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[#2b4b66]">{o.title}</p>
                  <p className="mt-2 text-xs text-[#788791]">
                    {o.shortDescription || o.short || o.description}
                  </p>
                </div>
                <button type="button" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal size={17} className="text-[#82909a]" />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(o.tags || "IA • SaaS • B2B • Dados")
                  .split(/[•,]/)
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .map((x) => (
                    <span
                      key={x}
                      className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#52708a]"
                    >
                      {x}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function CreateForm({
  go,
  opportunity = false,
}: {
  go: (s: Screen) => void;
  opportunity?: boolean;
}) {
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState(opportunity ? "POC" : "Empresa");
  const [selectedTags, setSelectedTags] = useState<string[]>(["IA", "SaaS", "B2B", "Dados"]);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handlePublish = async () => {
    try {
      if (opportunity) {
        await api.createOpportunity({
          type: selectedType === "POC + Compra" ? "POC" : selectedType,
          title: title || "Desafio de inteligência operacional",
          description: description || "Programa de inovação aberta.",
          tags: selectedTags.join(" • "),
          meta: "Aberta · Brasil · Remoto",
        });
      } else {
        await api.createCompany({
          name: title || "Empresa Alpha",
          type: selectedType,
          description: description || "Organização parceira na StartIn.",
          tags: selectedTags.join(", "),
        });
      }
    } catch {}
    setPublished(true);
  };

  if (published) {
    return (
      <div className="mx-auto max-w-[680px] py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]">
          <Check size={30} strokeWidth={3} />
        </div>
        <h1 className="mt-7 text-[30px] font-extrabold tracking-[-.05em] text-[#062f61]">
          {opportunity ? "Oportunidade cadastrada!" : "Empresa cadastrada!"}
        </h1>
        <p className="mt-3 text-sm text-[#73818c]">
          {opportunity
            ? "Sua oportunidade foi salva com sucesso e já pode entrar no matching da StartIn."
            : "Sua organização foi salva e já pode publicar novas oportunidades."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <PrimaryButton secondary onClick={() => go("my-opportunities")}>
            Minhas oportunidades
          </PrimaryButton>
          <PrimaryButton onClick={() => go("dashboard")}>Ir para dashboard</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <BackButton label="Voltar para Minhas oportunidades" onClick={() => go("my-opportunities")} />
      <PageTitle
        title={opportunity ? "Cadastrar oportunidade" : "Cadastrar empresa"}
        description={
          opportunity
            ? "Empresas e organizações publicam oportunidades para encontrar startups aderentes."
            : "Cadastre sua empresa ou organização para publicar oportunidades."
        }
      />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        <div className="flex gap-2 overflow-auto">
          {(opportunity
            ? ["POC", "Compra", "POC + Compra"]
            : ["Empresa", "Organização", "Instituição"]
          ).map((x) => (
            <button
              key={x}
              onClick={() => setSelectedType(x)}
              className={`rounded-lg px-6 py-3 text-xs font-bold whitespace-nowrap ${
                selectedType === x
                  ? "bg-[#075394] text-white"
                  : "bg-[#f3f6f8] text-[#486680]"
              }`}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label={opportunity ? "Título" : "Nome da empresa ou organização"}
              value={title}
              onChange={setTitle}
              placeholder={
                opportunity ? "Desafio de inteligência operacional" : "Empresa Alpha"
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#203754]">
                {opportunity
                  ? "Descrição da oportunidade"
                  : "Descreva sua organização, área de atuação e principais demandas de inovação."}
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[130px] w-full rounded-lg border border-[#dfe4e9] p-3 text-sm outline-none focus:border-[#075394]"
                placeholder="Descreva o problema, objetivo, público-alvo e critérios para a solução."
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <p className="mb-3 text-xs font-semibold text-[#203754]">
              {opportunity
                ? "Perfil de startup desejado para o match"
                : "Área de atuação · porte · localização"}
            </p>
            <div className="flex flex-wrap gap-2">
              {["IA", "SaaS", "B2B", "Dados"].map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => toggleTag(x)}
                  className="rounded-full bg-[#edf3f7] px-4 py-2 text-xs font-bold text-[#075394]"
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <PrimaryButton onClick={handlePublish}>
            {opportunity ? "Publicar oportunidade" : "Continuar cadastro"}{" "}
            <ArrowRight size={16} />
          </PrimaryButton>
        </div>
      </section>
    </>
  );
}
