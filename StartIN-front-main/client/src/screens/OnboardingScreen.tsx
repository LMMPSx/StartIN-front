import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Logo, Rocket } from "@/icons";
import { Field, PrimaryButton, TextAreaField } from "@/components/startin/CommonUI";
import {
  api,
  getSession,
  saveSession,
  type CompanyProfileData,
  type StartupProfileData,
} from "@/lib/api";
import type { AccountType, Screen } from "@/types/startin";

export function Onboarding({
  go,
  startupId,
  companyId,
  onProfileUpdated,
  onCompanyUpdated,
}: {
  go: (s: Screen) => void;
  startupId?: number;
  companyId?: number;
  onProfileUpdated: (p: StartupProfileData) => void;
  onCompanyUpdated?: (c: CompanyProfileData) => void;
}) {
  const session = getSession();
  const [accountType, setAccountType] = useState<AccountType>(
    session?.accountType === "COMPANY" ? "COMPANY" : "STARTUP"
  );
  const [step, setStep] = useState(0);
  const [companyStep, setCompanyStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<StartupProfileData>({
    name: session?.accountType === "STARTUP" && session?.name ? session.name : "Nexa Health",
    phone: session?.phone || "",
    mainArea: "",
    description: "",
    location: "",
    cnpj: session?.cnpj || "",
    website: "",
    foundedYear: "",
    problem: "",
    howItWorks: "",
    differentiator: "",
    impact: "",
    technologies: "",
    businessModel: "",
    targetAudience: "",
    mainSector: "",
    operationRegion: "",
    state: "",
    customerProfile: "",
    marketSize: "",
    competitors: "",
    mainChannel: "",
    currentStage: "",
    tractionCustomers: "",
    productMaturity: "",
    teamSize: "",
    annualRevenue: "",
    recentGrowth: "",
    investmentRaised: "",
    mainObjective: "",
    investmentNeed: "",
    executionDeadline: "",
    resourceUse: "",
    twelveMonthGoal: "",
    strategicPriority: "",
    desiredPartners: "",
    areasOfInterest: "",
    opportunityTypes: "POC, Compra, Editais",
    receiveAiRecommendations: true,
  });

  const [companyForm, setCompanyForm] = useState<CompanyProfileData>({
    id: companyId || session?.companyId,
    userId: session?.userId,
    name: session?.accountType === "COMPANY" && session?.name ? session.name : "Empresa Alpha",
    phone: session?.phone || "",
    type: "Empresa",
    sector: "Saúde / Operações Corporativas",
    location: "Brasil",
    cnpj: session?.cnpj || "",
    website: "",
    description: "",
    demands: "",
    tags: "IA, SaaS, B2B, Dados",
    preferredStage: "Tração / Validação",
    operationMode: "POC + Compra",
  });

  const setField = (key: keyof StartupProfileData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setCompanyField = (key: keyof CompanyProfileData) => (val: string) =>
    setCompanyForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    const idToLoad = startupId || session?.startupProfileId;
    const loader = idToLoad ? api.getProfile(idToLoad) : api.getDefaultProfile();
    loader
      .then((p) => {
        if (p) {
          setForm((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ""])),
            name: p.name || prev.name,
            receiveAiRecommendations: p.receiveAiRecommendations ?? true,
          }));
        }
      })
      .catch(() => {});

    const compIdToLoad = companyId || session?.companyId;
    const compLoader = compIdToLoad
      ? api.getCompany(compIdToLoad)
      : session?.userId
      ? api.getCompanyByUser(session.userId)
      : api.getDefaultCompany();
    compLoader
      .then((c) => {
        if (c) {
          setCompanyForm((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ""])),
            name: c.name || prev.name,
          }));
        }
      })
      .catch(() => {});
  }, [startupId, companyId]);

  const labels = ["Identidade", "Solução", "Mercado", "Momento", "Objetivos", "Matching"];
  const companyLabels = [
    "Identidade da Empresa",
    "Demandas (POC / Compra)",
    "Perfil de Startup",
    "Concluído",
  ];

  const handleNextStartupStep = async () => {
    const targetId = form.id || startupId || session?.startupProfileId || 1;
    if (step < 4) {
      setStep((s) => Math.min(5, s + 1));
      api
        .updateProfile(targetId, {
          ...form,
          name: form.name.trim() || "Nexa Health",
          areasOfInterest: form.areasOfInterest || form.technologies,
        })
        .catch(() => {});
      return;
    }

    setSaving(true);
    try {
      if (session?.userId) {
        await api.updateUser(session.userId, { accountType: "STARTUP" }).catch(() => {});
      }
      const updated = await api.updateProfile(targetId, {
        ...form,
        name: form.name.trim() || "Nexa Health",
        areasOfInterest: form.areasOfInterest || form.technologies,
      });
      onProfileUpdated(updated);
      if (session) {
        saveSession({
          ...session,
          accountType: "STARTUP",
          startupProfileId: updated.id || targetId,
          name: updated.name || session.name,
        });
      }
      await api.recalculateMatches(updated.id || targetId, false).catch(() => {});
    } catch {
      // ignora erro de rede local se ocorrer
    } finally {
      setSaving(false);
      setStep(5);
    }
  };

  const handleNextCompanyStep = async () => {
    if (companyStep < 2) {
      setCompanyStep((s) => s + 1);
      return;
    }

    setSaving(true);
    try {
      if (session?.userId) {
        await api.updateUser(session.userId, { accountType: "COMPANY" }).catch(() => {});
      }
      const payload: CompanyProfileData = {
        ...companyForm,
        userId: session?.userId,
        name: companyForm.name.trim() || "Empresa Alpha",
      };
      const saved = companyForm.id
        ? await api.updateCompany(companyForm.id, payload)
        : await api.createCompany(payload);
      setCompanyForm(saved);
      onCompanyUpdated?.(saved);
      if (session) {
        saveSession({
          ...session,
          accountType: "COMPANY",
          companyId: saved.id,
          name: saved.name || session.name,
        });
      } else {
        saveSession({
          token: "company-token",
          userId: saved.userId || 1,
          companyId: saved.id,
          accountType: "COMPANY",
          email: "empresa@startin.com",
          name: saved.name,
        });
      }
    } catch {
      // ignora erro de rede local
    } finally {
      setSaving(false);
      setCompanyStep(3);
    }
  };

  if (accountType === "STARTUP" && step === 5) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6 md:p-10">
        <div className="mx-auto max-w-[1180px]">
          <Logo />
          <div className="mx-auto mt-20 max-w-[650px] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]">
              <Check size={30} strokeWidth={3} />
            </div>
            <h1 className="mt-7 text-[34px] font-extrabold tracking-[-.05em] text-[#111827]">
              Sua startup está pronta!
            </h1>
            <p className="mt-3 text-sm text-[#6d7781]">
              Seu perfil foi configurado e a StartIn já pode começar a encontrar oportunidades e empresas.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {["Identidade", "Solução", "Mercado", "Objetivos"].map((x, i) => (
                <div key={x} className="rounded-xl border border-[#dfe5ea] bg-white p-4 text-left">
                  <div className="text-xs font-bold text-[#111827]">0{i + 1}</div>
                  <div className="mt-3 text-xs font-semibold text-[#263f5d]">{x}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#29815d]">
                    <Check size={11} /> Concluído
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton secondary onClick={() => setStep(4)}>
                <ArrowLeft size={15} /> Voltar e revisar etapas
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  localStorage.setItem("startin-auth", "1");
                  go("dashboard");
                }}
              >
                Ir para o Dashboard <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accountType === "COMPANY" && companyStep === 3) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6 md:p-10">
        <div className="mx-auto max-w-[1180px]">
          <Logo />
          <div className="mx-auto mt-20 max-w-[650px] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]">
              <Check size={30} strokeWidth={3} />
            </div>
            <h1 className="mt-7 text-[34px] font-extrabold tracking-[-.05em] text-[#111827]">
              Sua empresa está pronta!
            </h1>
            <p className="mt-3 text-sm text-[#6d7781]">
              Seu perfil corporativo foi salvo. Agora você pode buscar startups compatíveis avaliadas pela IA e lançar oportunidades de POC, Compra ou POC + Compra.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
              {["Identidade da Empresa", "Demandas de POC e Compra", "Perfil de Startup Buscado"].map(
                (x, i) => (
                  <div key={x} className="rounded-xl border border-[#dfe5ea] bg-white p-4 text-left">
                    <div className="text-xs font-bold text-[#111827]">0{i + 1}</div>
                    <div className="mt-3 text-xs font-semibold text-[#263f5d]">{x}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#29815d]">
                      <Check size={11} /> Concluído
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton secondary onClick={() => setCompanyStep(2)}>
                <ArrowLeft size={15} /> Voltar e revisar
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  localStorage.setItem("startin-auth", "1");
                  go("search-startups");
                }}
              >
                Buscar Startups com IA <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conteúdo das etapas para Empresa
  if (accountType === "COMPANY") {
    const companyStep0 = (
      <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Nome da empresa ou organização"
            placeholder="Ex: Empresa Alpha S.A."
            value={companyForm.name}
            onChange={setCompanyField("name")}
          />
          <Field
            label="Setor de atuação"
            placeholder="Saúde, Finanças, Indústria, Varejo..."
            value={companyForm.sector || ""}
            onChange={setCompanyField("sector")}
          />
          <div className="md:col-span-2">
            <TextAreaField
              label="Descrição da empresa"
              placeholder="Descreva sua organização, área de atuação e contexto operacional."
              value={companyForm.description || ""}
              onChange={setCompanyField("description")}
            />
          </div>
          <Field
            label="Localização"
            placeholder="Recife, PE · Brasil"
            value={companyForm.location || ""}
            onChange={setCompanyField("location")}
          />
          <Field
            label="Telefone / WhatsApp corporativo"
            placeholder="(00) 00000-0000"
            value={companyForm.phone || ""}
            onChange={setCompanyField("phone")}
          />
          <Field
            label="CNPJ"
            placeholder="AA.AAA.AAA/AAAA-DV"
            value={companyForm.cnpj || ""}
            onChange={setCompanyField("cnpj")}
          />
          <Field
            label="Site corporativo"
            placeholder="https://"
            value={companyForm.website || ""}
            onChange={setCompanyField("website")}
          />
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#203754]">
              Tipo de organização
            </span>
            <div className="flex gap-2">
              {["Empresa", "Organização", "Instituição"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCompanyField("type")(t)}
                  className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                    companyForm.type === t
                      ? "bg-[#111827] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
    );

    const companyStep1 = (
      <div className="grid gap-5">
        <div>
          <span className="mb-2 block text-xs font-semibold text-[#203754]">
            Modalidades de oportunidades que sua empresa deseja lançar
          </span>
          <div className="flex flex-wrap gap-2">
            {["POC", "Compra", "POC + Compra"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCompanyField("operationMode")(mode)}
                className={`rounded-lg px-5 py-3 text-xs font-bold transition ${
                  companyForm.operationMode === mode
                    ? "bg-[#111827] text-[#FEC908]"
                    : "bg-[#f3f6f8] text-[#486680]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <TextAreaField
          label="Principais desafios e demandas de inovação aberta (POC / Compra)"
          placeholder="Descreva os problemas operacionais, desafios tecnológicos ou soluções que sua empresa busca contratar ou testar via POC."
          value={companyForm.demands || ""}
          onChange={setCompanyField("demands")}
        />
      </div>
    );

    const companyStep2 = (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field
            label="Tecnologias e áreas buscadas nas startups"
            placeholder="IA, SaaS, B2B, Dados, Automação, Healthtech, Fintech..."
            value={companyForm.tags || ""}
            onChange={setCompanyField("tags")}
          />
        </div>
        <div className="md:col-span-2">
          <Field
            label="Estágio de maturidade desejado para as startups"
            placeholder="MVP validado, Operação inicial, Tração ou Escala"
            value={companyForm.preferredStage || ""}
            onChange={setCompanyField("preferredStage")}
          />
        </div>
      </div>
    );

    const compContents = [companyStep0, companyStep1, companyStep2];
    const compSubtitles = [
      "Cadastre os dados da sua empresa para encontrar startups e publicar POCs ou Compras.",
      "Defina se sua empresa busca POC, Compra ou POC + Compra e quais problemas quer resolver.",
      "Esses critérios serão usados pela IA para calcular o match com todas as startups cadastradas.",
    ];

    return (
      <div className="min-h-screen bg-[#f7f9fb] px-5 py-7 md:px-10">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => {
                if (companyStep > 0) {
                  setCompanyStep((s) => s - 1);
                } else {
                  go(localStorage.getItem("startin-auth") ? "search-startups" : "login");
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#6d7b87] transition hover:bg-white hover:text-[#111827]"
            >
              <ArrowLeft size={14} />{" "}
              {companyStep > 0
                ? `Voltar para 0${companyStep} — ${companyLabels[companyStep - 1]}`
                : "Voltar para o início"}
            </button>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[225px_1fr]">
            <div>
              <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-.06em] text-[#111827]">
                Encontre startups que combinam{" "}
                <span className="text-[#111827]">com sua empresa.</span>
              </h1>
              <p className="mt-4 text-sm leading-5 text-[#78828d]">
                Lance oportunidades de POC, Compra ou POC + Compra e veja o match calculado pela IA com todas as startups da plataforma.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6d7781]">Cadastro Corporativo · Empresa</p>
              <p className="mt-1 text-xs text-[#9aa2aa]">{compSubtitles[companyStep]}</p>
              <div className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4">
                {companyLabels.map((x, i) => (
                  <button
                    key={x}
                    type="button"
                    disabled={i > 2}
                    onClick={() => i <= 2 && setCompanyStep(i)}
                    className={`border-t-2 pt-2 text-left text-[10px] font-semibold transition ${
                      i <= companyStep
                        ? "border-[#FEC908] text-[#111827]"
                        : "border-[#dce2e7] text-[#9ca5ad] hover:text-[#5d6c79]"
                    }`}
                  >
                    0{i + 1} {x}
                  </button>
                ))}
              </div>
              <div className="mt-10 rounded-2xl border border-[#e0e5e9] bg-white p-6 md:p-8">
                <h2 className="text-[22px] font-extrabold tracking-[-.04em] text-[#111827]">
                  0{companyStep + 1} — {companyLabels[companyStep]}
                </h2>
                <p className="mt-2 text-sm text-[#77818c]">{compSubtitles[companyStep]}</p>
                <div className="mt-7">{compContents[companyStep]}</div>
                <div className="mt-8 flex items-center justify-between gap-3">
                  <PrimaryButton
                    secondary
                    onClick={() => {
                      if (companyStep > 0) {
                        setCompanyStep((s) => s - 1);
                      } else {
                        go(localStorage.getItem("startin-auth") ? "search-startups" : "login");
                      }
                    }}
                  >
                    <ArrowLeft size={15} /> {companyStep > 0 ? "Voltar etapa" : "Voltar"}
                  </PrimaryButton>
                  <PrimaryButton disabled={saving} onClick={handleNextCompanyStep}>
                    {companyStep === 2 ? "Finalizar perfil da empresa" : "Continuar"}{" "}
                    <ArrowRight size={16} />
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const common = (
    <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome da startup" value={form.name} onChange={setField("name")} />
        <Field
          label="Área principal"
          placeholder="Healthtech"
          value={form.mainArea}
          onChange={setField("mainArea")}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Descrição curta da startup"
            placeholder="Plataforma de IA para apoiar a gestão e análise de dados em saúde."
            value={form.description}
            onChange={setField("description")}
          />
        </div>
        <Field
          label="Localização"
          placeholder="Recife, PE"
          value={form.location}
          onChange={setField("location")}
        />
        <Field
          label="Telefone / WhatsApp"
          placeholder="(00) 00000-0000"
          value={form.phone || ""}
          onChange={setField("phone")}
        />
        <Field
          label="CNPJ"
          placeholder="AA.AAA.AAA/AAAA-DV"
          value={form.cnpj}
          onChange={setField("cnpj")}
        />
        <Field
          label="Site"
          placeholder="https://"
          value={form.website}
          onChange={setField("website")}
        />
        <Field
          label="Ano de fundação"
          placeholder="2024"
          value={form.foundedYear}
          onChange={setField("foundedYear")}
        />
      </div>
  );

  const solution = (
    <div className="grid gap-5 md:grid-cols-2">
      <TextAreaField
        label="Problema que resolve"
        placeholder="Gestão ineficiente e decisões baseadas em dados fragmentados."
        value={form.problem}
        onChange={setField("problem")}
      />
      <TextAreaField
        label="Como a solução funciona"
        placeholder="Explique o produto, o fluxo e a tecnologia utilizada."
        value={form.howItWorks}
        onChange={setField("howItWorks")}
      />
      <TextAreaField
        label="O que torna sua solução diferente?"
        placeholder="Diferenciais competitivos e ganhos para o cliente."
        value={form.differentiator}
        onChange={setField("differentiator")}
      />
      <TextAreaField
        label="Impacto gerado"
        placeholder="Resultados que a solução pode gerar."
        value={form.impact}
        onChange={setField("impact")}
      />
      <Field
        label="Tecnologias principais"
        placeholder="IA, dados, automação"
        value={form.technologies}
        onChange={setField("technologies")}
      />
      <Field
        label="Modelo de negócio"
        placeholder="SaaS B2B"
        value={form.businessModel}
        onChange={setField("businessModel")}
      />
    </div>
  );

  const market = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field
        label="Público-alvo"
        placeholder="Empresas de saúde e operações B2B"
        value={form.targetAudience}
        onChange={setField("targetAudience")}
      />
      <Field
        label="Setor principal"
        placeholder="Saúde"
        value={form.mainSector}
        onChange={setField("mainSector")}
      />
      <Field
        label="Região de atuação"
        placeholder="Brasil"
        value={form.operationRegion}
        onChange={setField("operationRegion")}
      />
      <Field
        label="Estado"
        placeholder="Pernambuco"
        value={form.state}
        onChange={setField("state")}
      />
      <Field
        label="Perfil de cliente"
        placeholder="Médias e grandes empresas"
        value={form.customerProfile}
        onChange={setField("customerProfile")}
      />
      <Field
        label="Tamanho do mercado"
        placeholder="R$ 2 bilhões"
        value={form.marketSize}
        onChange={setField("marketSize")}
      />
      <Field
        label="Concorrentes"
        placeholder="Liste seus principais concorrentes"
        value={form.competitors}
        onChange={setField("competitors")}
      />
      <Field
        label="Canal principal"
        placeholder="Vendas consultivas"
        value={form.mainChannel}
        onChange={setField("mainChannel")}
      />
    </div>
  );

  const moment = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field
        label="Estágio atual"
        placeholder="Tração"
        value={form.currentStage}
        onChange={setField("currentStage")}
      />
      <Field
        label="Tração / clientes"
        placeholder="12 clientes ativos"
        value={form.tractionCustomers}
        onChange={setField("tractionCustomers")}
      />
      <Field
        label="Maturidade do produto"
        placeholder="Produto validado"
        value={form.productMaturity}
        onChange={setField("productMaturity")}
      />
      <Field
        label="Tamanho do time"
        placeholder="8 pessoas"
        value={form.teamSize}
        onChange={setField("teamSize")}
      />
      <Field
        label="Receita anual"
        placeholder="R$ 240 mil"
        value={form.annualRevenue}
        onChange={setField("annualRevenue")}
      />
      <Field
        label="Crescimento recente"
        placeholder="+80% no último ano"
        value={form.recentGrowth}
        onChange={setField("recentGrowth")}
      />
      <Field
        label="Investimento captado"
        placeholder="R$ 500 mil"
        value={form.investmentRaised}
        onChange={setField("investmentRaised")}
      />
    </div>
  );

  const goals = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field
        label="Principal objetivo"
        placeholder="Expandir para novos mercados"
        value={form.mainObjective}
        onChange={setField("mainObjective")}
      />
      <Field
        label="Necessidade de investimento"
        placeholder="R$ 1 milhão"
        value={form.investmentNeed}
        onChange={setField("investmentNeed")}
      />
      <Field
        label="Prazo de execução"
        placeholder="12 meses"
        value={form.executionDeadline}
        onChange={setField("executionDeadline")}
      />
      <Field
        label="Uso dos recursos"
        placeholder="Produto, equipe e expansão comercial"
        value={form.resourceUse}
        onChange={setField("resourceUse")}
      />
      <Field
        label="Meta para os próximos 12 meses"
        placeholder="Dobrar a base de clientes"
        value={form.twelveMonthGoal}
        onChange={setField("twelveMonthGoal")}
      />
      <Field
        label="Prioridade estratégica"
        placeholder="Escala comercial"
        value={form.strategicPriority}
        onChange={setField("strategicPriority")}
      />
      <Field
        label="Parceiros desejados"
        placeholder="Fusões, canais e clientes"
        value={form.desiredPartners}
        onChange={setField("desiredPartners")}
      />
    </div>
  );

  const content = [common, solution, market, moment, goals][step];
  const subtitles = [
    "Essas informações alimentam o matching da StartIn.",
    "Conte como sua startup resolve um problema real e gera valor.",
    "Descreva o mercado em que sua startup atua.",
    "Entenda em que estágio sua startup está e quais resultados já alcançou.",
    "Defina o que sua startup busca e como pretende crescer nos próximos meses.",
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb] px-5 py-7 md:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => {
              if (step > 0) {
                setStep((s) => s - 1);
              } else {
                go(localStorage.getItem("startin-auth") ? "dashboard" : "login");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#6d7b87] transition hover:bg-white hover:text-[#111827]"
          >
            <ArrowLeft size={14} />{" "}
            {step > 0 ? `Voltar para 0${step} — ${labels[step - 1]}` : "Voltar para o início"}
          </button>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[225px_1fr]">
          <div>
            <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-.06em] text-[#111827]">
              Oportunidades que combinam <span className="text-[#111827]">com sua startup.</span>
            </h1>
            <p className="mt-4 text-sm leading-5 text-[#78828d]">
              Vamos conhecer sua startup para encontrar os melhores matches.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#6d7781]">Vamos conhecer sua startup</p>
            <p className="mt-1 text-xs text-[#9aa2aa]">{subtitles[step]}</p>
            <div className="mt-7 grid grid-cols-3 gap-2 md:grid-cols-6">
              {labels.map((x, i) => (
                <button
                  key={x}
                  type="button"
                  disabled={i > 4}
                  onClick={() => i <= 4 && setStep(i)}
                  className={`border-t-2 pt-2 text-left text-[10px] font-semibold transition ${
                    i <= step
                      ? "border-[#FEC908] text-[#111827]"
                      : "border-[#dce2e7] text-[#9ca5ad] hover:text-[#5d6c79]"
                  }`}
                >
                  0{i + 1} {x}
                </button>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-[#e0e5e9] bg-white p-6 md:p-8">
              <h2 className="text-[22px] font-extrabold tracking-[-.04em] text-[#111827]">
                0{step + 1} — {labels[step]}
              </h2>
              <p className="mt-2 text-sm text-[#77818c]">{subtitles[step]}</p>
              <div className="mt-7">{content}</div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <PrimaryButton
                  secondary
                  onClick={() => {
                    if (step > 0) {
                      setStep((s) => s - 1);
                    } else {
                      go(localStorage.getItem("startin-auth") ? "dashboard" : "login");
                    }
                  }}
                >
                  <ArrowLeft size={15} /> {step > 0 ? "Voltar etapa" : "Voltar"}
                </PrimaryButton>
                <PrimaryButton disabled={saving} onClick={handleNextStartupStep}>
                  {step === 4 ? "Finalizar perfil" : "Continuar"} <ArrowRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
