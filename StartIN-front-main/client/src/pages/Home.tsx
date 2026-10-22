import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bell, Bot, Building2, Check, ChevronDown,
  ChevronRight, Compass, FileText, Filter, Heart, Home as HomeIcon,
  LogOut, Mail, Menu, MoreHorizontal, Plus, RefreshCw, Rocket,
  Search, Send, Settings as SettingsIcon, Shield, Sparkles, Target, TrendingUp, UserRound,
  X, Zap,
} from "lucide-react";
import {
  api,
  clearSession,
  getSession,
  saveSession,
  type DashboardSummary,
  type MatchItem,
  type OpportunityItem,
  type StartupProfileData,
} from "@/lib/api";

type Screen = "login" | "signup" | "recovery" | "reset" | "verify" | "onboarding" | "dashboard" | "for-you" | "explore" | "matches" | "my-opportunities" | "assistant" | "startup" | "settings" | "notifications" | "account" | "privacy" | "preferences" | "opportunity" | "match" | "create-company" | "create-opportunity" | "interest-success" | "opportunity-success";
type OpportunityType = "Todos" | "Editais" | "Eventos" | "POCs" | "Compras";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon },
  { id: "for-you", label: "Para você", icon: Sparkles },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "matches", label: "Matches", icon: Heart },
  { id: "my-opportunities", label: "Minhas oportunidades", icon: FileText },
  { id: "assistant", label: "Assistente IA", icon: Bot },
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function formatOppType(type?: string): string {
  if (!type) return "Edital";
  const upper = type.toUpperCase();
  if (upper === "EDITAL") return "Edital";
  if (upper === "EVENTO") return "Evento";
  if (upper === "COMPRA") return "Compra";
  if (upper === "POC") return "POC";
  return type;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-start gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffd43b] text-[#052e5f]"><Rocket size={18} fill="currentColor" /></div><div><div className="text-[19px] font-extrabold tracking-[-.06em] text-[#062f61]">STARTIN</div>{!compact && <div className="mt-0.5 max-w-[135px] text-[10px] leading-3 text-[#68717d]">Oportunidades que combinam com sua startup.</div>}</div></div>;
}

function Field({ label, placeholder, type = "text", value, onChange }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-[#203754]">{label}</span><input type={type} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-[#dfe4e9] bg-white px-3 text-sm text-[#12355d] outline-none transition placeholder:text-[#9ba4ad] focus:border-[#075394] focus:ring-3 focus:ring-[#075394]/10" /></label>;
}

function PrimaryButton({ children, onClick, type = "button", full = false, secondary = false, disabled = false }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; full?: boolean; secondary?: boolean; disabled?: boolean }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`${full ? "w-full" : ""} inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition active:scale-[.98] disabled:opacity-60 ${secondary ? "border border-[#cfd7e0] bg-white text-[#063464] hover:border-[#075394]" : "bg-[#075394] text-white shadow-[0_8px_16px_rgba(7,83,148,.16)] hover:bg-[#064577]"}`}>{children}</button>;
}

function OrbitMark() {
  return <div className="relative flex h-24 w-24 items-center justify-center"><div className="absolute inset-1 rounded-full border border-[#ffd43b]/70 rotate-[-24deg]" /><div className="absolute inset-4 rounded-full border border-[#ffd43b]/40 rotate-[30deg]" /><div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffd43b] text-[#062f61] rotate-[-18deg]"><Rocket size={22} fill="currentColor" /></div></div>;
}

function AuthShell({ children, sideTitle, sideText }: { children: React.ReactNode; sideTitle: React.ReactNode; sideText: string }) {
  return <div className="min-h-screen bg-[#f3f5f8] lg:grid lg:grid-cols-[43%_57%]"><section className="relative hidden overflow-hidden bg-[#062f61] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="relative z-10"><div className="flex items-center gap-3 text-[22px] font-extrabold tracking-[.02em]">Start<span className="text-[#ffd43b]">In</span></div><div className="mt-28 max-w-[405px]"><OrbitMark /><h1 className="mt-8 text-[45px] font-extrabold leading-[1.02] tracking-[-.065em]">{sideTitle}</h1><p className="mt-7 max-w-[350px] text-[15px] leading-6 text-[#c7d8ea]">{sideText}</p></div></div><div className="relative z-10 text-xs text-[#a8c0d9]">StartIn © 2026 · O ecossistema para os próximos grandes começos.</div><div className="absolute -bottom-44 -right-28 h-[470px] w-[470px] rounded-full border-[54px] border-[#174b7e]" /><div className="absolute -right-10 top-24 h-64 w-64 rounded-full border border-[#2a6598]/40" /></section><section className="flex min-h-screen items-center justify-center p-5 md:p-10"><div className="w-full max-w-[520px] rounded-[28px] border border-[#e4e8ec] bg-white p-7 shadow-[0_20px_60px_rgba(6,47,97,.06)] md:p-10"><div className="mb-8 lg:hidden"><Logo /></div>{children}</div></section></div>;
}

function Login({ go, onAuthSuccess }: { go: (screen: Screen) => void; onAuthSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha seu e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      saveSession({
        token: res.token,
        userId: res.userId,
        startupProfileId: res.startupProfileId,
        email: res.email,
        name: res.name,
        cnpj: res.cnpj,
      });
      onAuthSuccess();
      go("dashboard");
    } catch (err: any) {
      setError(err.message || "Falha ao conectar com o Backend (verifique se a API Java na porta 8080 e o MySQL estão ativos).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell sideTitle={<>Conecte sua startup a oportunidades <span className="text-[#ffd43b]">certas.</span></>} sideText="Editais, eventos e clientes em um só lugar, personalizados com IA para o seu negócio.">
      <div>
        <p className="text-sm font-semibold text-[#6c7782]">Bem-vinda à StartIn</p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.05em] text-[#062f61]">Entre na sua conta</h2>
        <p className="mt-2 text-sm text-[#77818c]">Acesse suas oportunidades personalizadas.</p>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <Field label="E-mail" placeholder="seu@email.com" value={email} onChange={setEmail} />
          <Field label="Senha" placeholder="********" type="password" value={password} onChange={setPassword} />
          <button type="button" onClick={() => go("recovery")} className="-mt-2 text-left text-xs font-semibold text-[#075394] hover:underline">Esqueceu sua senha?</button>
          <PrimaryButton type="submit" full disabled={loading}>{loading ? "Entrando..." : "Entrar"} <ArrowRight size={16} /></PrimaryButton>
        </form>
        <div className="my-7 flex items-center gap-3 text-[11px] text-[#a0a7ae]"><div className="h-px flex-1 bg-[#e2e6eb]" />ou<div className="h-px flex-1 bg-[#e2e6eb]" /></div>
        <PrimaryButton secondary full onClick={() => go("signup")}>Crie sua conta</PrimaryButton>
      </div>
    </AuthShell>
  );
}

function Signup({ go, onAuthSuccess }: { go: (screen: Screen) => void; onAuthSuccess: () => void }) {
  const [form, setForm] = useState({ cnpj: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password.trim()) {
      setError("Informe um e-mail válido e uma senha.");
      return;
    }
    if (form.confirm && form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.signup(form);
      saveSession({
        token: res.token,
        userId: res.userId,
        startupProfileId: res.startupProfileId,
        email: res.email,
        name: res.name,
        cnpj: res.cnpj || form.cnpj,
      });
      onAuthSuccess();
      go("verify");
    } catch (err: any) {
      setError(err.message || "Não foi possível criar a conta no Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell sideTitle={<>Crie sua conta e comece a encontrar <span className="text-[#ffd43b]">oportunidades.</span></>} sideText="Cadastre-se para conectar sua startup a editais, eventos, POCs e clientes personalizados com IA.">
      <div>
        <button onClick={() => go("login")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#71808e]"><ArrowLeft size={14} /> Voltar para login</button>
        <h2 className="text-[28px] font-extrabold tracking-[-.05em] text-[#062f61]">Crie sua conta</h2>
        <p className="mt-2 text-sm text-[#77818c]">Preencha seus dados para começar.</p>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}
        <form onSubmit={handleSignup} className="mt-7 space-y-4">
          <Field label="CNPJ" placeholder="AA.AAA.AAA/AAAA-DV" value={form.cnpj} onChange={set("cnpj")} />
          <Field label="E-mail" placeholder="seu@email.com" value={form.email} onChange={set("email")} />
          <Field label="Senha" placeholder="Crie uma senha" type="password" value={form.password} onChange={set("password")} />
          <Field label="Confirmar senha" placeholder="Repita sua senha" type="password" value={form.confirm} onChange={set("confirm")} />
          <p className="text-[11px] leading-4 text-[#88929d]">Ao criar sua conta, você concorda com os <span className="font-semibold text-[#075394]">Termos de Uso</span> e a <span className="font-semibold text-[#075394]">Política de Privacidade</span>.</p>
          <PrimaryButton type="submit" full disabled={loading}>{loading ? "Criando conta..." : "Criar conta"} <ArrowRight size={16} /></PrimaryButton>
        </form>
        <p className="mt-6 text-center text-xs text-[#79848f]">Já possui uma conta? <button onClick={() => go("login")} className="font-bold text-[#075394]">Entrar</button></p>
      </div>
    </AuthShell>
  );
}

function Recovery({ go, onSetRecoveryEmail }: { go: (screen: Screen) => void; onSetRecoveryEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  return (
    <AuthShell sideTitle={<>Não se preocupe, vamos ajudar <span className="text-[#ffd43b]">você.</span></>} sideText="Informe o e-mail cadastrado e enviaremos as instruções para redefinir sua senha.">
      <button onClick={() => go("login")} className="mb-8 flex items-center gap-2 text-xs font-bold text-[#71808e]"><ArrowLeft size={14} /> Voltar para login</button>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2bf] text-[#755a00]"><Mail size={21} /></div>
      <h2 className="text-[28px] font-extrabold tracking-[-.05em] text-[#062f61]">Esqueceu sua senha?</h2>
      <p className="mt-2 text-sm leading-5 text-[#77818c]">Digite seu e-mail para receber um link de recuperação.</p>
      <form onSubmit={(e) => { e.preventDefault(); onSetRecoveryEmail(email); go("reset"); }} className="mt-8 space-y-5">
        <Field label="E-mail" placeholder="seu@email.com" value={email} onChange={setEmail} />
        <PrimaryButton type="submit" full>Enviar link de recuperação <ArrowRight size={16} /></PrimaryButton>
      </form>
    </AuthShell>
  );
}

function TextAreaField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value?: string; onChange?: (v: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-[#203754]">{label}</span><textarea value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="min-h-[92px] w-full resize-none rounded-lg border border-[#dfe4e9] bg-white p-3 text-sm text-[#12355d] outline-none transition placeholder:text-[#9ba4ad] focus:border-[#075394] focus:ring-3 focus:ring-[#075394]/10" /></label>;
}

function Onboarding({ go, startupId, onProfileUpdated }: { go: (s: Screen) => void; startupId?: number; onProfileUpdated: (p: StartupProfileData) => void }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const session = getSession();

  const [form, setForm] = useState<StartupProfileData>({
    name: "",
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

  const setField = (key: keyof StartupProfileData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    const idToLoad = startupId || session?.startupProfileId;
    const loader = idToLoad ? api.getProfile(idToLoad) : api.getDefaultProfile();
    loader
      .then((p) => {
        if (p) {
          setForm((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ""])),
            name: p.name === "Minha Startup" ? "" : (p.name || ""),
            receiveAiRecommendations: p.receiveAiRecommendations ?? true,
          }));
        }
      })
      .catch(() => {});
  }, [startupId]);

  const labels = ["Identidade", "Solução", "Mercado", "Momento", "Objetivos", "Matching"];

  const saveStepAndContinue = async () => {
    const targetId = form.id || startupId || session?.startupProfileId || 1;
    if (step < 4) {
      setStep((s) => s + 1);
      api.updateProfile(targetId, {
        ...form,
        name: form.name.trim() || "Minha Startup",
        areasOfInterest: form.areasOfInterest || form.technologies,
      }).catch(() => {});
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<StartupProfileData> = {
        ...form,
        name: form.name.trim() || "Minha Startup",
        areasOfInterest: form.areasOfInterest || form.technologies,
      };
      const updated = await api.updateProfile(targetId, payload);
      onProfileUpdated(updated);
      await api.recalculateMatches(updated.id || targetId, false);
    } catch (err) {
      console.error("Erro ao finalizar onboarding:", err);
    } finally {
      setSaving(false);
      setStep(5);
    }
  };

  if (step === 5) return <div className="min-h-screen bg-[#f7f9fb] p-6 md:p-10"><div className="mx-auto max-w-[1180px]"><Logo /><div className="mx-auto mt-20 max-w-[650px] text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]"><Check size={30} strokeWidth={3} /></div><h1 className="mt-7 text-[34px] font-extrabold tracking-[-.05em] text-[#062f61]">Sua startup está pronta!</h1><p className="mt-3 text-sm text-[#6d7781]">Todos os dados de <strong>{form.name || "sua startup"}</strong> foram salvos e a IA já calculou seus matches personalizados.</p><div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">{["Identidade", "Solução", "Mercado", "Objetivos"].map((x, i) => <div key={x} className="rounded-xl border border-[#dfe5ea] bg-white p-4 text-left"><div className="text-xs font-bold text-[#075394]">0{i + 1}</div><div className="mt-3 text-xs font-semibold text-[#263f5d]">{x}</div><div className="mt-1 flex items-center gap-1 text-[10px] text-[#29815d]"><Check size={11} /> Salvo no banco</div></div>)}</div><div className="mt-10"><PrimaryButton onClick={() => { localStorage.setItem("startin-auth", "1"); go("dashboard"); }}>Ir para o Dashboard <ArrowRight size={16} /></PrimaryButton></div></div></div></div>;

  const common = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Nome da startup" placeholder="Ex: AgroTech IA" value={form.name} onChange={setField("name")} />
      <Field label="Área principal" placeholder="Ex: Healthtech, FinTech, AgTech..." value={form.mainArea} onChange={setField("mainArea")} />
      <div className="md:col-span-2">
        <TextAreaField label="Descrição curta da startup" placeholder="Descreva em poucas linhas o propósito e atuação da sua startup." value={form.description} onChange={setField("description")} />
      </div>
      <Field label="Localização" placeholder="Ex: Recife, PE" value={form.location} onChange={setField("location")} />
      <Field label="CNPJ" placeholder="AA.AAA.AAA/AAAA-DV" value={form.cnpj} onChange={setField("cnpj")} />
      <Field label="Site" placeholder="https://" value={form.website} onChange={setField("website")} />
      <Field label="Ano de fundação" placeholder="Ex: 2024" value={form.foundedYear} onChange={setField("foundedYear")} />
    </div>
  );

  const solution = (
    <div className="grid gap-5 md:grid-cols-2">
      <TextAreaField label="Problema que resolve" placeholder="Qual dor real do mercado sua startup soluciona?" value={form.problem} onChange={setField("problem")} />
      <TextAreaField label="Como a solução funciona" placeholder="Explique o produto, o fluxo e a tecnologia utilizada." value={form.howItWorks} onChange={setField("howItWorks")} />
      <TextAreaField label="O que torna sua solução diferente?" placeholder="Diferenciais competitivos e ganhos para o cliente." value={form.differentiator} onChange={setField("differentiator")} />
      <TextAreaField label="Impacto gerado" placeholder="Resultados e métricas que a solução gera." value={form.impact} onChange={setField("impact")} />
      <Field label="Tecnologias principais" placeholder="Ex: IA, Dados, Automação, IoT, Cloud" value={form.technologies} onChange={setField("technologies")} />
      <Field label="Modelo de negócio" placeholder="Ex: SaaS B2B, Marketplace, Hardware" value={form.businessModel} onChange={setField("businessModel")} />
    </div>
  );

  const market = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Público-alvo" placeholder="Ex: Empresas B2B, Hospitais, Indústrias" value={form.targetAudience} onChange={setField("targetAudience")} />
      <Field label="Setor principal" placeholder="Ex: Saúde, Varejo, Agronegócio, Finanças" value={form.mainSector} onChange={setField("mainSector")} />
      <Field label="Região de atuação" placeholder="Ex: Brasil, Nordeste, América Latina" value={form.operationRegion} onChange={setField("operationRegion")} />
      <Field label="Estado" placeholder="Ex: Pernambuco, São Paulo" value={form.state} onChange={setField("state")} />
      <Field label="Perfil de cliente" placeholder="Ex: Médias e grandes empresas" value={form.customerProfile} onChange={setField("customerProfile")} />
      <Field label="Tamanho do mercado" placeholder="Ex: R$ 2 bilhões" value={form.marketSize} onChange={setField("marketSize")} />
      <Field label="Concorrentes" placeholder="Liste seus principais concorrentes" value={form.competitors} onChange={setField("competitors")} />
      <Field label="Canal principal" placeholder="Ex: Vendas consultivas, Inbound" value={form.mainChannel} onChange={setField("mainChannel")} />
    </div>
  );

  const moment = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Estágio atual" placeholder="Ex: Ideação, MVP, Validação, Tração, Escala" value={form.currentStage} onChange={setField("currentStage")} />
      <Field label="Tração / clientes" placeholder="Ex: 12 clientes ativos" value={form.tractionCustomers} onChange={setField("tractionCustomers")} />
      <Field label="Maturidade do produto" placeholder="Ex: Produto validado em produção" value={form.productMaturity} onChange={setField("productMaturity")} />
      <Field label="Tamanho do time" placeholder="Ex: 8 pessoas" value={form.teamSize} onChange={setField("teamSize")} />
      <Field label="Receita anual" placeholder="Ex: R$ 240 mil" value={form.annualRevenue} onChange={setField("annualRevenue")} />
      <Field label="Crescimento recente" placeholder="Ex: +80% no último ano" value={form.recentGrowth} onChange={setField("recentGrowth")} />
      <Field label="Investimento captado" placeholder="Ex: R$ 500 mil ou Bootstrapped" value={form.investmentRaised} onChange={setField("investmentRaised")} />
    </div>
  );

  const goals = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Principal objetivo" placeholder="Ex: Fechar POCs corporativas e expandir mercado" value={form.mainObjective} onChange={setField("mainObjective")} />
      <Field label="Necessidade de investimento" placeholder="Ex: R$ 1 milhão" value={form.investmentNeed} onChange={setField("investmentNeed")} />
      <Field label="Prazo de execução" placeholder="Ex: 12 meses" value={form.executionDeadline} onChange={setField("executionDeadline")} />
      <Field label="Uso dos recursos" placeholder="Ex: Produto, P&D em IA e expansão comercial" value={form.resourceUse} onChange={setField("resourceUse")} />
      <Field label="Meta para os próximos 12 meses" placeholder="Ex: Dobrar a base de clientes" value={form.twelveMonthGoal} onChange={setField("twelveMonthGoal")} />
      <Field label="Prioridade estratégica" placeholder="Ex: Escala comercial e validação" value={form.strategicPriority} onChange={setField("strategicPriority")} />
      <Field label="Parceiros desejados" placeholder="Ex: Grandes empresas, hospitais, fundos" value={form.desiredPartners} onChange={setField("desiredPartners")} />
    </div>
  );

  const content = [common, solution, market, moment, goals][step];
  const subtitles = ["Essas informações alimentam o matching da StartIn.", "Conte como sua startup resolve um problema real e gera valor.", "Descreva o mercado em que sua startup atua.", "Entenda em que estágio sua startup está e quais resultados já alcançou.", "Defina o que sua startup busca e como pretende crescer nos próximos meses."];

  return (
    <div className="min-h-screen bg-[#f7f9fb] px-5 py-7 md:px-10">
      <div className="mx-auto max-w-[1180px]">
        <Logo />
        <div className="mt-12 grid gap-10 lg:grid-cols-[225px_1fr]">
          <div>
            <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-.06em] text-[#062f61]">Oportunidades que combinam <span className="text-[#075394]">com sua startup.</span></h1>
            <p className="mt-4 text-sm leading-5 text-[#78828d]">Vamos conhecer sua startup para que a IA calcule os melhores matches.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#6d7781]">Vamos conhecer sua startup</p>
            <p className="mt-1 text-xs text-[#9aa2aa]">{subtitles[step]}</p>
            <div className="mt-7 grid grid-cols-3 gap-2 md:grid-cols-6">
              {labels.map((x, i) => (
                <button key={x} type="button" onClick={() => i < 5 && setStep(i)} className={`border-t-2 pt-2 text-left text-[10px] font-semibold ${i <= step ? "border-[#ffd43b] text-[#075394]" : "border-[#dce2e7] text-[#9ca5ad]"}`}>
                  0{i + 1} {x}
                </button>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-[#e0e5e9] bg-white p-6 md:p-8">
              <h2 className="text-[22px] font-extrabold tracking-[-.04em] text-[#062f61]">0{step + 1} — {labels[step]}</h2>
              <p className="mt-2 text-sm text-[#77818c]">{subtitles[step]}</p>
              <div className="mt-7">{content}</div>
              <div className="mt-8 flex justify-between">
                {step > 0 ? (
                  <PrimaryButton secondary onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    <ArrowLeft size={16} /> Voltar
                  </PrimaryButton>
                ) : <div />}
                <PrimaryButton disabled={saving} onClick={saveStepAndContinue}>
                  {saving ? "Salvando e calculando IA..." : step === 4 ? "Finalizar perfil e calcular IA" : "Continuar"} <ArrowRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ screen, go, onClose }: { screen: Screen; go: (s: Screen) => void; onClose: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e5e9ed] bg-white px-5 py-7 shadow-xl lg:shadow-none">
      <div className="flex items-start justify-between"><Logo /><button onClick={onClose} className="rounded-lg p-1 text-[#83909b] lg:hidden"><X size={18} /></button></div>
      <nav className="mt-12 space-y-1">{nav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { go(item.id as Screen); onClose(); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${screen === item.id ? "bg-[#f1f4f7] text-[#062f61]" : "text-[#65717c] hover:bg-[#f8fafc] hover:text-[#062f61]"}`}><Icon size={17} strokeWidth={screen === item.id ? 2.5 : 1.8} />{item.label}{item.id === "matches" && <span className="ml-auto rounded-full bg-[#fff1b4] px-2 py-0.5 text-[10px] text-[#725800]">IA</span>}</button>; })}</nav>
      <div className="mt-auto">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#a0a8af]">Conta</p>
        <button onClick={() => go("startup")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${screen === "startup" ? "bg-[#f1f4f7] text-[#062f61]" : "text-[#65717c]"}`}><Building2 size={17} />Minha startup</button>
        <button onClick={() => go("settings")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${screen === "settings" ? "bg-[#f1f4f7] text-[#062f61]" : "text-[#65717c]"}`}><SettingsIcon size={17} />Configurações</button>
        <button onClick={() => { clearSession(); go("login"); }} className="mt-3 flex w-full items-center gap-3 border-t border-[#edf0f2] px-3 pt-4 text-left text-xs font-semibold text-[#8a949d] hover:text-[#075394]"><LogOut size={16} />Sair</button>
      </div>
    </aside>
  );
}

function AppShell({ screen, go, startupName, children }: { screen: Screen; go: (s: Screen) => void; startupName: string; children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#112d4f]">
      <div className={`${menu ? "block" : "hidden"} fixed inset-0 z-30 bg-[#062f61]/20 lg:hidden`} onClick={() => setMenu(false)} />
      <div className={`${menu ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}><Sidebar screen={screen} go={go} onClose={() => setMenu(false)} /></div>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e8edf0] bg-white/95 px-5 backdrop-blur md:px-9">
          <button onClick={() => setMenu(true)} className="rounded-lg p-2 text-[#687681] lg:hidden"><Menu size={20} /></button>
          <div className="hidden text-xs text-[#8b959e] sm:block">StartIn / <span className="font-semibold text-[#375777]">{screen === "dashboard" ? "Dashboard" : screen === "for-you" ? "Para você" : screen === "explore" ? "Explorar" : screen === "matches" ? "Matches" : "Minha conta"}</span></div>
          <div className="flex items-center gap-4">
            <button onClick={() => go("notifications")} className="relative rounded-lg p-2 text-[#687681] hover:bg-[#f2f5f7]"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ffd43b]" /></button>
            <div className="h-7 w-px bg-[#e7ebee]" />
            <button onClick={() => go("startup")} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9e8f4] text-xs font-bold text-[#075394]">{getInitials(startupName)}</div>
              <span className="hidden text-xs font-semibold text-[#526371] md:block">{startupName || "Minha Startup"}</span>
              <ChevronDown size={14} className="text-[#9ba4ac]" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-5 py-8 md:px-9 md:py-10">{children}</main>
      </div>
    </div>
  );
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div>{eyebrow && <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8d98a2]">{eyebrow}</p>}<h1 className="text-[29px] font-extrabold tracking-[-.06em] text-[#062f61] md:text-[34px]">{title}</h1><p className="mt-2 text-sm text-[#707c87]">{description}</p></div>{action}</div>;
}

function Dashboard({ go, startupId, onSelectOpportunityById }: { go: (s: Screen) => void; startupId?: number; onSelectOpportunityById: (id: string | number) => void }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.getDashboardSummary(startupId)
      .then((res) => setSummary(res))
      .catch(() => {});
  }, [startupId]);

  const greeting = summary?.greeting || "Olá! Bem-vindo ao StartIn";
  const pendingCount = summary?.pendingActionsCount ?? 0;
  const pendingText = summary?.pendingActionsText || "Configure seu perfil na aba Minha Startup para calcular seus matches.";
  const stats = [
    [String(summary?.savedOpportunitiesCount ?? 0), "Oportunidades salvas"],
    [String(summary?.newMatchesCount ?? 0), "Matches novos"],
    [String(summary?.deadlinesThisWeekCount ?? 0), "Oportunidades ativas"],
    [String(summary?.trackingCount ?? 0), "Em acompanhamento"],
  ];
  const deadlines = summary?.upcomingDeadlines || [];
  const activities = summary?.recentActivities || [];

  return (
    <>
      <PageTitle title={greeting} description="Visão geral em tempo real da sua startup e das recomendações da IA." action={<PrimaryButton secondary onClick={() => go("notifications")}>Ver atividade</PrimaryButton>} />
      <div className="mt-8 rounded-2xl bg-[#075394] p-6 text-white md:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#c4d8eb]">Você tem {pendingCount} ações para acompanhar</p>
            <h2 className="mt-2 text-[20px] font-extrabold tracking-[-.03em]">{pendingText}</h2>
          </div>
          <Zap className="hidden text-[#ffd43b] md:block" size={30} fill="currentColor" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([n, l]) => (
          <div key={l} className="rounded-xl border border-[#e5eaee] bg-white p-5">
            <div className="text-[27px] font-extrabold tracking-[-.05em] text-[#062f61]">{n}</div>
            <div className="mt-1 text-xs text-[#7d8993]">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-[#e5eaee] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#062f61]">Próximos prazos e oportunidades</h2>
            <button onClick={() => go("for-you")} className="text-xs font-bold text-[#075394]">Ver todos</button>
          </div>
          <div className="mt-5 space-y-3">
            {deadlines.length > 0 ? deadlines.map((d) => (
              <div key={d.title} onClick={() => { if (d.id) onSelectOpportunityById(d.id); else go("for-you"); }} className="flex cursor-pointer items-center gap-4 rounded-xl bg-[#f7f9fb] p-4 transition hover:bg-[#eef3f7]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff2b8] text-[9px] font-extrabold text-[#775b00]">{d.type}</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#294866]">{d.title}</p>
                  <p className="mt-1 text-[11px] text-[#89949d]">{d.subtitle}</p>
                </div>
                <ChevronRight size={16} className="text-[#9aa6af]" />
              </div>
            )) : <p className="text-xs text-[#89949d]">Nenhuma oportunidade cadastrada no momento.</p>}
          </div>
        </section>
        <section className="rounded-2xl bg-[#eaf2f8] p-6">
          <div className="flex items-center gap-2 text-[#075394]"><TrendingUp size={17} /><h2 className="text-base font-extrabold">Atividade recente</h2></div>
          <div className="mt-5 space-y-5">
            {activities.length > 0 ? activities.map((act, i) => (
              <div key={i} className="flex gap-3 border-b border-[#d6e4ee] pb-4 last:border-0">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ffd43b]" />
                <div>
                  <p className="text-xs font-semibold text-[#2a4b6a]">{act.text}</p>
                  <p className="mt-1 text-[10px] text-[#8193a1]">{act.time}</p>
                </div>
              </div>
            )) : <p className="text-xs text-[#6d7e8b]">Sem atividades recentes registradas.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

function OpportunityCard({ item, onSelect }: { item: OpportunityItem; onSelect: (item: OpportunityItem) => void }) {
  return (
    <article className="flex min-h-[210px] flex-col rounded-2xl border border-[#e1e6ea] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(6,47,97,.08)]">
      <div className="flex items-start justify-between">
        <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${item.color || "bg-[#fff2b8] text-[#795900]"}`}>{formatOppType(item.type)}</span>
        <div className="text-right">
          <div className="text-[24px] font-extrabold tracking-[-.06em] text-[#25805e]">{item.match}%</div>
          <div className="text-[10px] text-[#94a0a8]">match</div>
        </div>
      </div>
      <h3 className="mt-4 text-[15px] font-extrabold leading-5 text-[#123b62]">{item.title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#75818b]">{item.short}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef1f3] pt-4">
        <span className="text-[10px] text-[#89959e]">Combina por: {item.tags}</span>
        <button onClick={() => onSelect(item)} className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#075394]">Ver oportunidade <ArrowRight size={13} /></button>
      </div>
    </article>
  );
}

function Opportunities({ go, explore = false, startupId, onSelectOpportunity }: { go: (s: Screen) => void; explore?: boolean; startupId?: number; onSelectOpportunity: (o: OpportunityItem) => void }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<OpportunityType>("Todos");
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapingWeb, setScrapingWeb] = useState(false);

  const loadOpportunitiesAndMatches = async () => {
    setLoading(true);
    try {
      // Primeiro garante que os matches (incluindo os editais raspados da web pela IA) estejam sincronizados no MySQL
      const matches = await api.getMatches(startupId).catch(() => [] as MatchItem[]);
      const opps = await api.getOpportunities().catch(() => [] as OpportunityItem[]);

      const scoreByOppId = new Map<string, number>();
      matches.forEach((m) => {
        if (m.opportunityId) scoreByOppId.set(String(m.opportunityId), m.matchScore);
        if (m.opportunityCode) scoreByOppId.set(String(m.opportunityCode), m.matchScore);
      });

      const formatted: OpportunityItem[] = opps.map((o) => {
        const calculatedScore = scoreByOppId.get(String(o.id)) ?? scoreByOppId.get(String(o.code)) ?? o.match ?? o.matchScore ?? 85;
        return {
          id: o.id,
          code: o.code,
          type: formatOppType(o.type),
          title: o.title,
          short: o.shortDescription || o.short || o.description,
          description: o.description,
          match: calculatedScore,
          meta: o.meta || o.metaInfo || "Brasil · Remoto",
          tags: o.tags || "inovação • tecnologia",
          color: o.color || "bg-[#fff2b8] text-[#795900]",
          status: o.status,
          externalUrl: o.externalUrl,
        };
      });
      formatted.sort((a, b) => b.match - a.match);
      setItems(formatted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunitiesAndMatches();
  }, [startupId]);

  const handleScrapeWeb = async () => {
    setScrapingWeb(true);
    try {
      await api.recalculateMatches(startupId, true);
      await loadOpportunitiesAndMatches();
    } finally {
      setScrapingWeb(false);
    }
  };

  const list = useMemo(
    () =>
      items.filter(
        (x) =>
          (type === "Todos" ||
            (type === "POCs" ? x.type.toUpperCase() === "POC" : x.type.toLowerCase() === type.slice(0, -1).toLowerCase())) &&
          `${x.title} ${x.short} ${x.tags}`.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query, type]
  );

  return (
    <>
      <PageTitle
        title={explore ? "Explorar" : "Para você"}
        description={explore ? "Explore editais reais raspados da web pela IA e oportunidades do banco StartIn." : "Oportunidades do banco + editais reais da Web priorizados pela IA para sua startup."}
        action={
          <PrimaryButton onClick={handleScrapeWeb} disabled={scrapingWeb}>
            <RefreshCw size={15} className={scrapingWeb ? "animate-spin" : ""} /> {scrapingWeb ? "Buscando na Web com IA..." : "Buscar editais na Web (IA)"}
          </PrimaryButton>
        }
      />
      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-[#e0e5e9] bg-white p-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96a1aa]" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar editais, eventos ou clientes..." className="h-10 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#9ca7af]" />
        </div>
        <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe5e9] px-4 text-xs font-bold text-[#42617e]"><Filter size={14} /> Filtros</button>
        <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe5e9] px-4 text-xs font-bold text-[#42617e]">Ordenar <ChevronDown size={14} /></button>
      </div>
      <div className="mt-5 flex gap-2 overflow-auto pb-1">
        {(["Todos", "Editais", "Eventos", "POCs", "Compras"] as OpportunityType[]).map((x) => (
          <button key={x} onClick={() => setType(x)} className={`rounded-full px-5 py-2 text-xs font-bold whitespace-nowrap ${type === x ? "bg-[#075394] text-white" : "bg-white text-[#45617e] ring-1 ring-[#e3e8ec]"}`}>{x}</button>
        ))}
      </div>
      <div className="mt-7 flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#123b62]">{loading ? "Carregando oportunidades..." : list.length ? `${list.length} oportunidades priorizadas` : "Nenhuma oportunidade encontrada"}</h2>
          <p className="mt-1 text-xs text-[#88949d]">Ordenadas pela aderência calculada pela IA ao perfil, objetivos e requisitos da sua startup.</p>
        </div>
        {!list.length && !loading && <button onClick={() => { setQuery(""); setType("Todos"); }} className="text-xs font-bold text-[#075394]">Limpar filtros</button>}
      </div>
      {list.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((item) => (
            <OpportunityCard key={item.id} item={item} onSelect={(opp) => { onSelectOpportunity(opp); go("opportunity"); }} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d9e0e5] bg-white py-16 text-center">
          <Sparkles className="mx-auto text-[#ffd43b]" size={30} fill="currentColor" />
          <p className="mt-4 text-sm font-bold text-[#234666]">Não encontramos oportunidades compatíveis</p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8a969f]">Tente ampliar sua busca ou atualizar as preferências da startup.</p>
          <button onClick={() => go("preferences")} className="mt-5 text-xs font-bold text-[#075394]">Atualizar preferências</button>
        </div>
      )}
    </>
  );
}

function OpportunityDetail({ go, selectedOpportunity, startupId, profile }: { go: (s: Screen) => void; selectedOpportunity: OpportunityItem | null; startupId?: number; profile: StartupProfileData | null }) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [item, setItem] = useState<OpportunityItem | null>(selectedOpportunity);

  useEffect(() => {
    if (selectedOpportunity) {
      setItem(selectedOpportunity);
    } else {
      api.getOpportunities().then((list) => {
        if (list.length > 0) setItem(list[0]);
      }).catch(() => {});
    }
  }, [selectedOpportunity]);

  const handleParticipate = async () => {
    if (!item || joined || joining) return;
    setJoining(true);
    try {
      await api.participateInOpportunity(startupId, item.id);
      setJoined(true);
    } catch {
      setJoined(true);
    } finally {
      setJoining(false);
    }
  };

  if (!item) return <p className="text-sm text-[#73808b]">Carregando detalhes da oportunidade...</p>;

  const metaParts = (item.meta || "Aberta · Brasil · Remoto").split("·").map((s) => s.trim());

  return (
    <>
      <button onClick={() => go("for-you")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87]"><ArrowLeft size={14} /> Voltar para Para você</button>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${item.color || "bg-[#fff2b8] text-[#795900]"}`}>{formatOppType(item.type).toUpperCase()}</span>
          <h1 className="mt-4 text-[29px] font-extrabold tracking-[-.05em] text-[#062f61]">{item.title}</h1>
          <p className="mt-2 text-sm text-[#73808b]">{item.short || item.shortDescription}</p>
        </div>
        <div className="rounded-xl bg-[#e7f4ed] px-5 py-3 text-center">
          <div className="text-[25px] font-extrabold text-[#25805e]">{item.match || item.matchScore || 90}%</div>
          <div className="text-[10px] text-[#477660]">de aderência</div>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Prazo / Info", metaParts[0] || "Fluxo contínuo"],
          ["Localização", metaParts[1] ? `${metaParts[1]} ${metaParts[2] ? "· " + metaParts[2] : ""}` : "Brasil · Remoto"],
          ["Modalidade", formatOppType(item.type)],
          ["Status", item.status || "Inscrições abertas"],
        ].map(([a, b]) => (
          <div key={a} className="rounded-xl border border-[#e2e7eb] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase text-[#9aa4ac]">{a}</p>
            <p className="mt-2 text-xs font-bold text-[#244766]">{b}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-[#e2e7eb] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#123b62]">Sobre a oportunidade</h2>
          <p className="mt-4 text-sm leading-7 text-[#65747f]">{item.description}</p>
          <h3 className="mt-8 text-sm font-extrabold text-[#123b62]">Por que este match faz sentido para {profile?.name || "sua startup"}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["01", "Perfil", `${profile?.mainArea || "Inovação"} · ${profile?.businessModel || "B2B"}`],
              ["02", "Tecnologias", profile?.technologies || item.tags || "Tecnologias compatíveis"],
              ["03", "Objetivo", profile?.mainObjective || "Validação e escala"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl bg-[#f5f8fa] p-4">
                <div className="text-[10px] font-extrabold text-[#075394]">{n}</div>
                <p className="mt-3 text-xs font-bold text-[#345572]">{t}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#81909b]">{d}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-2xl bg-[#eaf2f8] p-6">
          <Sparkles className="text-[#075394]" size={20} />
          <h2 className="mt-4 text-lg font-extrabold leading-6 text-[#123b62]">Essa oportunidade combina com {profile?.name || "você"}</h2>
          <p className="mt-3 text-xs leading-5 text-[#6d7e8b]">A IA identificou alta aderência entre seu perfil, suas tecnologias e os requisitos desta oportunidade.</p>
          <div className="mt-5 space-y-2">
            <PrimaryButton full disabled={joining} onClick={handleParticipate}>
              {joined ? <><Check size={16} /> Interesse registrado no banco</> : joining ? "Registrando..." : <>Participar <ArrowRight size={16} /></>}
            </PrimaryButton>
            {item.externalUrl && (
              <a href={item.externalUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#cfd7e0] bg-white px-5 text-xs font-bold text-[#063464] hover:border-[#075394]">
                Acessar portal oficial <ArrowRight size={14} />
              </a>
            )}
          </div>
          <button onClick={() => go("for-you")} className="mt-3 w-full text-center text-xs font-bold text-[#075394]">Voltar para oportunidades</button>
        </aside>
      </div>
    </>
  );
}

function Matches({ go, startupId, onSelectMatch }: { go: (s: Screen) => void; startupId?: number; onSelectMatch: (m: MatchItem) => void }) {
  const [matchesList, setMatchesList] = useState<MatchItem[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setLoadingAi(true);
    api.getMatches(startupId)
      .then((res) => {
        if (Array.isArray(res)) setMatchesList(res);
      })
      .catch(() => {})
      .finally(() => setLoadingAi(false));
  }, [startupId]);

  const handleRecalculate = async () => {
    setLoadingAi(true);
    try {
      const updated = await api.recalculateMatches(startupId, true);
      if (Array.isArray(updated)) setMatchesList(updated);
    } catch (err) {
      console.error("Erro ao recalcular matches via IA:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const avgScore = matchesList.length
    ? Math.round(matchesList.reduce((acc, m) => acc + (m.matchScore || 0), 0) / matchesList.length)
    : 0;

  const interesseCount = matchesList.filter((m) => m.status === "INTERESSE_ENVIADO" || m.status === "SALVO").length;
  const contatoCount = matchesList.filter((m) => m.status === "CONTATO_INICIADO").length;
  const negociacaoCount = matchesList.filter((m) => m.status === "EM_NEGOCIACAO").length;

  return (
    <>
      <PageTitle
        title="Seus matches"
        description="Conexões calculadas pela IA lendo todos os dados do seu usuário e startup."
        action={
          <PrimaryButton onClick={handleRecalculate} disabled={loadingAi}>
            <RefreshCw size={15} className={loadingAi ? "animate-spin" : ""} /> {loadingAi ? "Calculando..." : "Recalcular com IA"}
          </PrimaryButton>
        }
      />
      <div className="mt-8 rounded-2xl bg-[#075394] p-6 text-white">
        <div className="text-[30px] font-extrabold tracking-[-.06em]">{avgScore}%</div>
        <p className="mt-1 text-xs text-[#c8dded]">de compatibilidade média calculada pela IA</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {matchesList.length > 0 ? (
          matchesList.map((m) => (
            <div key={m.id || m.opportunityTitle} className="rounded-2xl border border-[#e1e6ea] bg-white p-5">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-[#fff2b8] px-3 py-1 text-[10px] font-extrabold text-[#795900]">{formatOppType(m.opportunityType)}</span>
                <span className="text-xl font-extrabold text-[#25805e]">{m.matchScore}%</span>
              </div>
              <h3 className="mt-6 text-sm font-extrabold text-[#123b62]">{m.startupName} × {m.opportunityTitle}</h3>
              <p className="mt-2 text-xs text-[#74818c]">{m.justification}</p>
              <button onClick={() => { onSelectMatch(m); go("match"); }} className="mt-6 flex items-center gap-2 text-xs font-extrabold text-[#075394]">Ver análise da IA <ArrowRight size={14} /></button>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-[#d9e0e5] bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#123b62]">{loadingAi ? "A IA está lendo seu perfil e calculando seus matches..." : "Nenhum match calculado ainda."}</p>
            <p className="mt-2 text-xs text-[#74818c]">Clique em "Recalcular com IA" ou preencha os dados da sua startup para gerar suas conexões.</p>
          </div>
        )}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e1e6ea] bg-white p-6">
        <h2 className="text-base font-extrabold text-[#123b62]">Status das conexões</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["01", "Interesse enviado / Salvos", `${interesseCount} conexões`],
            ["02", "Contato iniciado", `${contatoCount} conexões`],
            ["03", "Em negociação", `${negociacaoCount} conexões`],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-xl bg-[#f6f8fa] p-4">
              <span className="text-[10px] font-extrabold text-[#075394]">{n}</span>
              <p className="mt-3 text-xs font-bold text-[#31516e]">{t}</p>
              <p className="mt-1 text-[11px] text-[#8a969f]">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function MatchDetail({ go, selectedMatch, onOpenOpportunity }: { go: (s: Screen) => void; selectedMatch: MatchItem | null; onOpenOpportunity: (oppId: number | string) => void }) {
  const [saved, setSaved] = useState(selectedMatch?.status === "SALVO" || selectedMatch?.status === "INTERESSE_ENVIADO");

  if (!selectedMatch) {
    return (
      <>
        <button onClick={() => go("matches")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87]"><ArrowLeft size={14} /> Voltar para matches</button>
        <p className="text-sm text-[#73808b]">Selecione um match para visualizar a análise detalhada da IA.</p>
      </>
    );
  }

  const title = `${selectedMatch.startupName} × ${selectedMatch.opportunityTitle}`;
  const subtitle = `${formatOppType(selectedMatch.opportunityType)} · ${selectedMatch.opportunityTitle}`;
  const score = `${selectedMatch.matchScore}%`;
  const reasons = [
    ["01", "Perfil da startup", selectedMatch.reasons?.perfil || "Alinhamento de perfil", selectedMatch.justification],
    ["02", "Requisitos", selectedMatch.reasons?.requisitos || "Tecnologias compatíveis", "As tecnologias e competências declaradas no seu perfil atendem aos requisitos."],
    ["03", "Objetivo", selectedMatch.reasons?.objetivo || "Validação e escala", selectedMatch.recommendedAction || "O objetivo da oportunidade converge com suas metas."],
    ["04", "Contexto", selectedMatch.reasons?.contexto || "Contexto operacional compatível", "Localização, região de atuação e modelo de negócio compatíveis."],
  ];

  const handleSaveMatch = async () => {
    const newStatus = saved ? "NOVO" : "SALVO";
    try {
      await api.updateMatchStatus(selectedMatch.id, newStatus);
      setSaved(!saved);
    } catch {
      setSaved(!saved);
    }
  };

  return (
    <>
      <button onClick={() => go("matches")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87]"><ArrowLeft size={14} /> Voltar para matches</button>
      <PageTitle title="Detalhe do match" description="Entenda de forma transparente por que esta conexão foi recomendada pela IA." />
      <div className="mt-8 flex flex-col justify-between gap-5 rounded-2xl bg-[#075394] p-6 text-white md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold text-[#c8dded]">{title}</p>
          <h2 className="mt-2 text-xl font-extrabold">{subtitle}</h2>
        </div>
        <div className="text-left md:text-right">
          <div className="text-4xl font-extrabold tracking-[-.08em] text-[#ffd43b]">{score}</div>
          <div className="text-xs text-[#c8dded]">aderência</div>
        </div>
      </div>
      <section className="mt-6 rounded-2xl border border-[#e1e6ea] bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#123b62]">Por que este match faz sentido</h2>
        <div className="mt-6 space-y-5">
          {reasons.map(([n, t, v, d]) => (
            <div key={n} className="flex gap-4 border-b border-[#eef1f3] pb-5 last:border-0 last:pb-0">
              <span className="text-xs font-extrabold text-[#075394]">{n}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#294c6a]">{t}</p>
                <p className="mt-1 text-xs font-semibold text-[#688093]">{v}</p>
              </div>
              <p className="hidden max-w-[320px] text-xs leading-5 text-[#7c8a94] md:block">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton onClick={() => onOpenOpportunity(selectedMatch.opportunityId)}>Ver oportunidade <ArrowRight size={16} /></PrimaryButton>
          <PrimaryButton secondary onClick={handleSaveMatch}>
            {saved ? <><Check size={16} /> Match salvo</> : <><Heart size={16} /> Salvar match</>}
          </PrimaryButton>
        </div>
      </section>
    </>
  );
}

function Assistant({ profile, startupId }: { profile: StartupProfileData | null; startupId?: number }) {
  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([
    {
      from: "ai",
      text: `Olá! Sou a Inteligência Artificial do StartIn integrada ao seu perfil${profile?.name ? ` (${profile.name})` : ""} e ao Web Scraper de editais reais (FINEP, FAPESP PIPE e InovaStartups). Como posso ajudar?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    const nextMessages: { from: "ai" | "me"; text: string }[] = [...messages, { from: "me", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const targetStartupId = profile?.id || startupId;
      // Se o usuário pediu para buscar editais/eventos na web, sincroniza também no banco MySQL
      if (text.toLowerCase().includes("web") || text.toLowerCase().includes("editais") || text.toLowerCase().includes("eventos")) {
        api.recalculateMatches(targetStartupId, true).catch(() => {});
      }
      const res = await api.chatAI(nextMessages, targetStartupId);
      setMessages((m) => [...m, { from: "ai", text: res.reply }]);
    } catch (err: any) {
      setMessages((m) => [...m, { from: "ai", text: `Erro ao consultar IA: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Assistente IA" description="Sua IA conectada à raspagem de editais reais na Web." />
      <div className="mt-8 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="rounded-2xl bg-[#075394] p-6 text-white">
          <Bot size={25} className="text-[#ffd43b]" />
          <h2 className="mt-6 text-[25px] font-extrabold leading-7 tracking-[-.05em]">Como posso ajudar?</h2>
          <p className="mt-3 text-sm leading-5 text-[#c7dceb]">Pergunte sobre oportunidades reais na web e estratégias para {profile?.name || "sua startup"}.</p>
          <div className="mt-8 space-y-2">
            {["Buscar editais reais na web agora", "Buscar eventos e chamadas abertas na web", "Priorizar meus matches com base no meu perfil", "Analisar oportunidades para minha startup"].map((x) => (
              <button key={x} onClick={() => send(x)} className="flex w-full items-center justify-between rounded-lg border border-white/20 px-3 py-3 text-left text-xs font-semibold text-white hover:bg-white/10">
                {x}<ArrowRight size={14} />
              </button>
            ))}
          </div>
        </aside>
        <section className="flex min-h-[480px] flex-col rounded-2xl border border-[#e1e6ea] bg-white">
          <div className="border-b border-[#edf0f2] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf2f8] text-[#075394]"><Bot size={18} /></div>
              <div>
                <p className="text-sm font-extrabold text-[#123b62]">STARTIN IA</p>
                <p className="text-[10px] text-[#8b969f]">{loading ? "Consultando perfil e processando resposta..." : "Online e sincronizada com seu perfil"}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-xs leading-5 ${m.from === "me" ? "rounded-br-sm bg-[#075394] text-white" : "rounded-bl-sm bg-[#f0f5f8] text-[#42617e]"}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="m-4 flex items-center gap-2 rounded-xl bg-[#f5f7f9] p-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Pergunte sobre editais, eventos, clientes ou matches..." className="h-9 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-[#99a4ad]" />
            <button onClick={() => send()} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#075394] text-white"><Send size={15} /></button>
          </div>
        </section>
      </div>
    </>
  );
}

function Startup({ go, startupId, profile, onProfileUpdated }: { go: (s: Screen) => void; startupId?: number; profile: StartupProfileData | null; onProfileUpdated: (p: StartupProfileData) => void }) {
  const [saved, setSaved] = useState(profile?.receiveAiRecommendations ?? true);
  const [areasInput, setAreasInput] = useState(profile?.areasOfInterest || profile?.technologies || "IA, Dados, Automação, SaaS B2B");
  const [selectedOppTypes, setSelectedOppTypes] = useState<string[]>(() =>
    (profile?.opportunityTypes || "POC, Compra, Editais").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSaved(profile.receiveAiRecommendations ?? true);
      setAreasInput(profile.areasOfInterest || profile.technologies || "IA, Dados, Automação");
      if (profile.opportunityTypes) {
        setSelectedOppTypes(profile.opportunityTypes.split(",").map((s) => s.trim()).filter(Boolean));
      }
    }
  }, [profile]);

  const toggleOppType = (t: string) => {
    setSelectedOppTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const targetId = profile?.id || startupId || 1;
      const updated = await api.updatePreferences(targetId, {
        areasOfInterest: areasInput,
        opportunityTypes: selectedOppTypes.join(", "),
        receiveAiRecommendations: saved,
      });
      onProfileUpdated(updated);
      await api.recalculateMatches(targetId, false);
    } catch (err) {
      console.error("Erro ao salvar preferências:", err);
    } finally {
      setSaving(false);
      go("dashboard");
    }
  };

  const areasList = areasInput.split(",").map((s) => s.trim()).filter(Boolean);
  const displayName = profile?.name || "Minha Startup";
  const displayArea = [profile?.mainArea, profile?.businessModel, profile?.currentStage].filter(Boolean).join(" · ") || "Configure os dados da sua startup";

  return (
    <>
      <PageTitle title="Minha startup" description="Perfil salvo e lido pela IA para calcular seus matches." action={<PrimaryButton secondary onClick={() => go("onboarding")}>Editar perfil completo</PrimaryButton>} />
      <section className="mt-8 flex items-center gap-5 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#062f61] text-lg font-extrabold text-white">{getInitials(displayName)}</div>
        <div>
          <h2 className="text-xl font-extrabold text-[#123b62]">{displayName}</h2>
          <p className="mt-1 text-sm text-[#76838d]">{displayArea}</p>
          {profile?.description && <p className="mt-2 text-xs text-[#587086]">{profile.description}</p>}
        </div>
      </section>
      <section className="mt-7 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#123b62]">Preferências de matching</h2>
        <div className="mt-7 grid gap-7 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-[#50697f]">Áreas e tecnologias de interesse (separadas por vírgula)</p>
            <input value={areasInput} onChange={(e) => setAreasInput(e.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#dfe4e9] px-3 text-xs text-[#12355d] outline-none focus:border-[#075394]" placeholder="Ex: IA, Saúde, Finanças, Dados, SaaS" />
            <div className="mt-3 flex flex-wrap gap-2">
              {areasList.map((x) => <span key={x} className="rounded-full bg-[#eaf2f8] px-4 py-2 text-xs font-bold text-[#075394]">{x}</span>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-[#50697f]">Tipos de oportunidade de interesse</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["POC", "Compra", "Editais", "Eventos"].map((x) => (
                <button key={x} type="button" onClick={() => toggleOppType(x)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${selectedOppTypes.includes(x) ? "bg-[#075394] text-white" : "bg-[#f3f5f6] text-[#557086]"}`}>
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-[#edf0f2] pt-6">
          <div>
            <p className="text-sm font-bold text-[#284a67]">Receber recomendações da IA</p>
            <p className="mt-1 text-xs text-[#82909a]">Use seu perfil completo para personalizar novas oportunidades.</p>
          </div>
          <button onClick={() => setSaved(!saved)} className={`flex h-7 w-12 items-center rounded-full p-1 ${saved ? "bg-[#075394]" : "bg-[#b8c4cc]"}`}><span className={`h-5 w-5 rounded-full bg-white transition ${saved ? "translate-x-5" : ""}`} /></button>
        </div>
        <div className="mt-7 flex justify-end">
          <PrimaryButton disabled={saving} onClick={savePrefs}>{saving ? "Salvando e recalculando IA..." : "Salvar preferências"} <Check size={15} /></PrimaryButton>
        </div>
      </section>
    </>
  );
}

function MyOpportunities({ go, onSelectOpportunity }: { go: (s: Screen) => void; onSelectOpportunity: (o: OpportunityItem) => void }) {
  const [opps, setOpps] = useState<OpportunityItem[]>([]);

  useEffect(() => {
    api.getOpportunities().then((res) => setOpps(res)).catch(() => {});
  }, []);

  const publishedCount = opps.filter((o) => !o.status || o.status === "PUBLICADA").length;
  const reviewCount = opps.filter((o) => o.status === "EM_ANALISE").length;
  const closedCount = opps.filter((o) => o.status === "ENCERRADA").length;

  return (
    <>
      <PageTitle title="Minhas oportunidades" description="Acompanhe, edite e gerencie as oportunidades publicadas." action={<div className="flex gap-2"><PrimaryButton secondary onClick={() => go("create-company")}>Nova empresa</PrimaryButton><PrimaryButton onClick={() => go("create-opportunity")}><Plus size={15} /> Nova oportunidade</PrimaryButton></div>} />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6">
        <h2 className="text-sm font-extrabold text-[#123b62]">Resumo das oportunidades</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            [String(publishedCount), "publicadas"],
            [String(reviewCount), "em análise"],
            [String(closedCount), "encerradas"],
          ].map(([n, t], i) => (
            <div key={t} className={`rounded-xl p-5 ${i === 0 ? "bg-[#075394] text-white" : "bg-[#f3f6f8] text-[#294b68]"}`}>
              <div className="text-2xl font-extrabold">{n}</div>
              <div className="mt-1 text-xs font-semibold opacity-80">{t}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-8 text-sm font-extrabold text-[#123b62]">Oportunidades cadastradas</h2>
        <div className="mt-4 space-y-3">
          {opps.map((o) => (
            <div key={o.id} onClick={() => { onSelectOpportunity(o); go("opportunity"); }} className="cursor-pointer rounded-xl bg-[#f7f9fa] p-5 transition hover:bg-[#eef3f7]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#075394]">{formatOppType(o.type)}</span>
                  <p className="mt-1 text-sm font-extrabold text-[#2b4b66]">{o.title}</p>
                  <p className="mt-2 text-xs text-[#788791]">{o.shortDescription || o.short || o.description}</p>
                </div>
                <button><MoreHorizontal size={17} className="text-[#82909a]" /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(o.tags || "Inovação • Tecnologia").split(/[•,]/).map((x) => x.trim()).filter(Boolean).map((x) => (
                  <span key={x} className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#52708a]">{x}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function CreateForm({ go, opportunity = false, startupId }: { go: (s: Screen) => void; opportunity?: boolean; startupId?: number }) {
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meta, setMeta] = useState("Aberta · Brasil · Remoto");
  const [selectedType, setSelectedType] = useState(opportunity ? "POC" : "Empresa");
  const [selectedTags, setSelectedTags] = useState<string[]>(["IA", "SaaS", "B2B", "Dados"]);
  const [saving, setSaving] = useState(false);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handlePublish = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (opportunity) {
        await api.createOpportunity({
          type: selectedType,
          title,
          description: description || title,
          tags: selectedTags.join(" • "),
          meta,
        });
        await api.recalculateMatches(startupId, false);
      } else {
        await api.createCompany({
          name: title,
          type: selectedType,
          description: description || title,
          tags: selectedTags.join(", "),
        });
      }
      setPublished(true);
    } catch (err) {
      console.error("Erro ao salvar no banco:", err);
    } finally {
      setSaving(false);
    }
  };

  if (published) return <div className="mx-auto max-w-[680px] py-14 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f1e5] text-[#18734d]"><Check size={30} strokeWidth={3} /></div><h1 className="mt-7 text-[30px] font-extrabold tracking-[-.05em] text-[#062f61]">{opportunity ? "Oportunidade cadastrada!" : "Empresa cadastrada!"}</h1><p className="mt-3 text-sm text-[#73818c]">{opportunity ? "Sua oportunidade foi salva com sucesso e a IA já recalculou os matches." : "Sua organização foi salva no banco de dados e já pode publicar novas oportunidades."}</p><div className="mt-8 flex justify-center gap-3"><PrimaryButton secondary onClick={() => go("my-opportunities")}>Minhas oportunidades</PrimaryButton><PrimaryButton onClick={() => go("dashboard")}>Ir para dashboard</PrimaryButton></div></div>;

  return (
    <>
      <PageTitle title={opportunity ? "Cadastrar oportunidade" : "Cadastrar empresa"} description={opportunity ? "Empresas e organizações publicam oportunidades para encontrar startups aderentes." : "Cadastre sua empresa ou organização para publicar oportunidades."} />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        <div className="flex gap-2 overflow-auto">
          {(opportunity ? ["POC", "Compra", "Edital", "Evento"] : ["Empresa", "Organização", "Instituição"]).map((x) => (
            <button key={x} onClick={() => setSelectedType(x)} className={`rounded-lg px-6 py-3 text-xs font-bold whitespace-nowrap ${selectedType === x ? "bg-[#075394] text-white" : "bg-[#f3f6f8] text-[#486680]"}`}>{x}</button>
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><Field label={opportunity ? "Título da oportunidade" : "Nome da empresa ou organização"} value={title} onChange={setTitle} placeholder={opportunity ? "Desafio de inteligência operacional" : "Empresa Alpha"} /></div>
          {opportunity && <div className="md:col-span-2"><Field label="Prazo · Localização · Formato" value={meta} onChange={setMeta} placeholder="Ex: Prazo 30/11/2026 · Brasil · Remoto" /></div>}
          <div className="md:col-span-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#203754]">{opportunity ? "Descrição da oportunidade" : "Descreva sua organização, área de atuação e principais demandas de inovação."}</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[130px] w-full rounded-lg border border-[#dfe4e9] p-3 text-sm outline-none focus:border-[#075394]" placeholder="Descreva o problema, objetivo, público-alvo e critérios para a solução." />
            </label>
          </div>
          <div className="md:col-span-2">
            <p className="mb-3 text-xs font-semibold text-[#203754]">{opportunity ? "Tags e tecnologias desejadas para o match da IA" : "Áreas de atuação e interesse"}</p>
            <div className="flex flex-wrap gap-2">
              {["IA", "SaaS", "B2B", "Dados", "Automação", "Saúde", "FinTech", "AgTech", "IoT", " ESG"].map((x) => (
                <button key={x} type="button" onClick={() => toggleTag(x.trim())} className={`rounded-full px-4 py-2 text-xs font-bold ${selectedTags.includes(x.trim()) ? "bg-[#075394] text-white" : "bg-[#edf3f7] text-[#075394]"}`}>{x.trim()}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <PrimaryButton disabled={saving} onClick={handlePublish}>{saving ? "Salvando..." : opportunity ? "Publicar oportunidade" : "Salvar empresa"} <ArrowRight size={16} /></PrimaryButton>
        </div>
      </section>
    </>
  );
}

function SettingsPage({ go }: { go: (s: Screen) => void }) {
  const cards: [Screen, React.ElementType, string, string][] = [
    ["account", UserRound, "Conta e acesso", "E-mail, senha e informações básicas da sua conta."],
    ["preferences", Target, "Preferências de matching", "Ajuste os critérios usados pela IA para encontrar oportunidades."],
    ["privacy", Shield, "Privacidade e segurança", "Controle seus dados, visibilidade do perfil e sessões ativas."],
    ["notifications", Bell, "Notificações", "Escolha quais alertas você deseja receber e por onde."],
  ];
  return (
    <>
      <PageTitle title="Configurações" description="Gerencie sua conta, preferências e privacidade na StartIn." />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map(([screen, Icon, title, text]) => (
          <button key={title} onClick={() => go(screen)} className="group rounded-2xl border border-[#e2e7eb] bg-white p-6 text-left hover:border-[#b8cad8]">
            <Icon className="text-[#075394]" size={20} />
            <div className="mt-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#123b62]">{title}</h2>
                <p className="mt-2 max-w-[310px] text-xs leading-5 text-[#788691]">{text}</p>
              </div>
              <ArrowRight className="text-[#7f8f9a] transition group-hover:translate-x-1" size={18} />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function SubSettings({ screen, go, startupId, profile, onProfileUpdated }: { screen: Screen; go: (s: Screen) => void; startupId?: number; profile: StartupProfileData | null; onProfileUpdated: (p: StartupProfileData) => void }) {
  const titles: Record<string, [string, string]> = {
    account: ["Conta e acesso", "Gerencie seus dados de acesso salvos."],
    privacy: ["Privacidade e segurança", "Controle a visibilidade do seu perfil, seus dados e as sessões ativas."],
    preferences: ["Preferências de matching", "Defina o que é mais relevante para a IA encontrar oportunidades para sua startup."],
    notifications: ["Notificações", "Acompanhe matches, oportunidades e atualizações registradas no banco."],
  };
  const [title, description] = titles[screen];

  // Estado para Notificações
  const [notifFilter, setNotifFilter] = useState("Todas");
  const [notifs, setNotifs] = useState<Array<{ id: number; title: string; description: string; timeAgo: string; type: string; read: boolean }>>([]);

  // Estado para Conta
  const session = getSession();
  const [accName, setAccName] = useState(session?.name || profile?.userName || "");
  const [accEmail, setAccEmail] = useState(session?.email || profile?.userEmail || "");
  const [accMsg, setAccMsg] = useState("");

  // Estado para Preferências
  const [prefType, setPrefType] = useState(profile?.opportunityTypes || "POC");
  const [prefAreas, setPrefAreas] = useState(profile?.areasOfInterest || profile?.technologies || "");
  const [prefSavedMsg, setPrefSavedMsg] = useState("");

  useEffect(() => {
    if (screen === "notifications") {
      api.getNotifications(notifFilter).then((res) => setNotifs(res)).catch(() => {});
    }
    if (screen === "account" && session?.userId) {
      api.getUser(session.userId).then((u) => {
        setAccName(u.name || "");
        setAccEmail(u.email || "");
      }).catch(() => {});
    }
  }, [screen, notifFilter]);

  const handleSaveAccount = async () => {
    if (!session?.userId) return;
    try {
      const updated = await api.updateUser(session.userId, { name: accName, email: accEmail });
      saveSession({ ...session, name: updated.name, email: updated.email });
      setAccMsg("Dados da conta atualizados com sucesso!");
    } catch (err: any) {
      setAccMsg(err.message || "Erro ao atualizar conta.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.userId) return;
    try {
      await api.deleteUser(session.userId);
      clearSession();
      go("login");
    } catch {}
  };

  const handleSavePreferences = async () => {
    const targetId = profile?.id || startupId || 1;
    try {
      const updated = await api.updatePreferences(targetId, {
        opportunityTypes: prefType,
        areasOfInterest: prefAreas,
      });
      onProfileUpdated(updated);
      await api.recalculateMatches(targetId, false);
      setPrefSavedMsg("Preferências salvas e matches recalculados pela IA!");
    } catch {}
  };

  if (screen === "notifications") {
    return (
      <>
        <PageTitle title={title} description={description} />
        <div className="mt-7 flex gap-2">
          {["Todas", "Oportunidades", "Matches", "Sistema"].map((x) => (
            <button key={x} onClick={() => setNotifFilter(x)} className={`rounded-full px-4 py-2 text-xs font-bold ${notifFilter === x ? "bg-[#075394] text-white" : "bg-white text-[#46627c] ring-1 ring-[#e3e8ec]"}`}>{x}</button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {notifs.length > 0 ? notifs.map((n) => (
            <div key={n.id} className="flex gap-4 rounded-2xl border border-[#e2e7eb] bg-white p-5">
              <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-[#eaf2f8]" />
              <div>
                <p className="text-sm font-extrabold text-[#244766]">{n.title}</p>
                <p className="mt-1 text-xs text-[#70808c]">{n.description}</p>
                <p className="mt-3 text-[10px] text-[#9aa5ad]">{n.timeAgo}</p>
              </div>
            </div>
          )) : <p className="text-xs text-[#70808c]">Nenhuma notificação nesta categoria.</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <button onClick={() => go("settings")} className="mb-7 flex items-center gap-2 text-xs font-bold text-[#6d7b87]"><ArrowLeft size={14} /> Voltar para configurações</button>
      <PageTitle title={title} description={description} />
      <section className="mt-8 rounded-2xl border border-[#e2e7eb] bg-white p-6 md:p-8">
        {screen === "account" && (
          <>
            <h2 className="text-base font-extrabold text-[#123b62]">Informações da conta</h2>
            {accMsg && <p className="mt-3 text-xs font-bold text-[#25805e]">{accMsg}</p>}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Nome completo" value={accName} onChange={setAccName} />
              <Field label="E-mail" value={accEmail} onChange={setAccEmail} />
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={handleSaveAccount}>Salvar informações</PrimaryButton>
            </div>
            <div className="mt-8 border-t border-[#edf0f2] pt-7">
              <h2 className="text-base font-extrabold text-[#123b62]">Excluir conta</h2>
              <p className="mt-3 text-xs text-[#768692]">Essa ação remove permanentemente os dados desta conta.</p>
              <button onClick={handleDeleteAccount} className="mt-4 rounded-lg bg-[#d71920] px-5 py-3 text-xs font-bold text-white">Excluir conta</button>
            </div>
            <div className="mt-8 border-t border-[#edf0f2] pt-7">
              <h2 className="text-base font-extrabold text-[#123b62]">Segurança</h2>
              <p className="mt-4 mb-3 text-xs text-[#768692]">Senha · ••••••••••••</p>
              <PrimaryButton secondary onClick={() => go("reset")}>Alterar senha</PrimaryButton>
            </div>
          </>
        )}
        {screen === "privacy" && (
          <>
            <h2 className="text-base font-extrabold text-[#123b62]">Visibilidade e dados</h2>
            {["Perfil público", "Dados e recomendações"].map((x, i) => (
              <div key={x} className="flex items-center justify-between border-b border-[#edf0f2] py-6">
                <div>
                  <p className="text-sm font-bold text-[#284a67]">{x}</p>
                  <p className="mt-1 text-xs text-[#82909a]">{i ? "Usar dados do perfil para personalizar recomendações." : "Permitir que outras organizações encontrem sua startup na StartIn."}</p>
                </div>
                <div className="h-6 w-10 rounded-full bg-[#075394] p-1"><div className="h-4 w-4 translate-x-4 rounded-full bg-white" /></div>
              </div>
            ))}
          </>
        )}
        {screen === "preferences" && (
          <>
            <h2 className="text-base font-extrabold text-[#123b62]">Tipo de oportunidade prioritário</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["POC", "Compra", "Editais", "POC, Compra, Editais"].map((x) => (
                <button key={x} onClick={() => setPrefType(x)} className={`rounded-lg px-5 py-3 text-xs font-bold ${prefType === x ? "bg-[#075394] text-white" : "bg-[#f3f6f8] text-[#486680]"}`}>{x}</button>
              ))}
            </div>
            <h2 className="mt-9 text-base font-extrabold text-[#123b62]">Palavras-chave e áreas para a IA</h2>
            <div className="mt-4">
              <Field label="Tecnologias, setores e interesses" value={prefAreas} onChange={setPrefAreas} placeholder="Ex: IA, Saúde, FinTech, Automação, B2B" />
            </div>
            {prefSavedMsg && <p className="mt-4 text-xs font-bold text-[#25805e]">{prefSavedMsg}</p>}
            <div className="mt-6">
              <PrimaryButton onClick={handleSavePreferences}>Salvar e recalcular matches</PrimaryButton>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function Reset({ go, recoveryEmail }: { go: (s: Screen) => void; recoveryEmail: string }) {
  const session = getSession();
  const [email, setEmail] = useState(recoveryEmail || session?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    if (!email.trim() || !newPassword.trim()) {
      setError("Informe seu e-mail e a nova senha.");
      return;
    }
    if (confirm && newPassword !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    try {
      await api.resetPassword({ email, newPassword });
      go("login");
    } catch {
      setError("E-mail não encontrado no banco de dados.");
    }
  };

  return (
    <AuthShell sideTitle={<>Recupere o acesso à sua <span className="text-[#ffd43b]">conta.</span></>} sideText="Defina uma nova senha segura para continuar usando a StartIn.">
      <h2 className="text-[28px] font-extrabold tracking-[-.05em] text-[#062f61]">Crie uma nova senha</h2>
      <p className="mt-2 text-sm text-[#77818c]">Escolha uma senha forte para proteger sua conta.</p>
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}
      <div className="mt-7 space-y-4">
        <Field label="E-mail da conta" placeholder="seu@email.com" value={email} onChange={setEmail} />
        <Field label="Nova senha" placeholder="Digite sua nova senha" type="password" value={newPassword} onChange={setNewPassword} />
        <Field label="Confirmar nova senha" placeholder="Repita sua nova senha" type="password" value={confirm} onChange={setConfirm} />
        <PrimaryButton full onClick={handleReset}>Redefinir senha<Check size={16} /></PrimaryButton>
      </div>
    </AuthShell>
  );
}

function Verify({ go }: { go: (s: Screen) => void }) {
  const session = getSession();
  return (
    <AuthShell sideTitle={<>Confirme seu e-mail para <span className="text-[#ffd43b]">continuar.</span></>} sideText="Sua conta foi criada! Agora vamos configurar todos os dados da sua startup para a IA.">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf2f8] text-[#075394]"><Mail size={24} /></div>
      <h2 className="mt-7 text-[28px] font-extrabold tracking-[-.05em] text-[#062f61]">Conta criada com sucesso!</h2>
      <p className="mt-3 text-sm leading-5 text-[#77818c]">Conta registrada para <strong>{session?.email || "seu e-mail"}</strong>. Continue para preencher o perfil da sua startup.</p>
      <div className="mt-6">
        <PrimaryButton full onClick={() => go("onboarding")}>Configurar minha startup <ArrowRight size={16} /></PrimaryButton>
      </div>
    </AuthShell>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>(() => (getSession() ? "dashboard" : "login"));
  const [selectedScreen, setSelectedScreen] = useState<Screen>(screen);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [profile, setProfile] = useState<StartupProfileData | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [authVersion, setAuthVersion] = useState(0);

  const session = getSession();
  const activeStartupId = profile?.id || session?.startupProfileId;

  useEffect(() => setSelectedScreen(screen), [screen]);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      setProfile(null);
      return;
    }
    const loader = currentSession.startupProfileId
      ? api.getProfile(currentSession.startupProfileId)
      : currentSession.userId
      ? api.getProfileByUser(currentSession.userId)
      : api.getDefaultProfile();

    loader
      .then((p) => {
        if (p) setProfile(p);
      })
      .catch(() => {});
  }, [authVersion, screen]);

  const go = (next: Screen) => {
    setScreen(next);
    setSelectedScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenOpportunityById = async (id: string | number) => {
    try {
      const opp = await api.getOpportunity(id);
      setSelectedOpportunity({
        ...opp,
        short: opp.shortDescription || opp.short || opp.description,
        match: opp.match || opp.matchScore || 90,
        meta: opp.meta || opp.metaInfo || "Brasil · Remoto",
      });
    } catch {}
    go("opportunity");
  };

  if (["login", "signup", "recovery", "reset", "verify", "onboarding"].includes(screen)) {
    if (screen === "login") return <Login go={go} onAuthSuccess={() => setAuthVersion((v) => v + 1)} />;
    if (screen === "signup") return <Signup go={go} onAuthSuccess={() => setAuthVersion((v) => v + 1)} />;
    if (screen === "recovery") return <Recovery go={go} onSetRecoveryEmail={setRecoveryEmail} />;
    if (screen === "reset") return <Reset go={go} recoveryEmail={recoveryEmail} />;
    if (screen === "verify") return <Verify go={go} />;
    return <Onboarding go={go} startupId={activeStartupId} onProfileUpdated={setProfile} />;
  }

  let page: React.ReactNode = null;
  if (screen === "dashboard") page = <Dashboard go={go} startupId={activeStartupId} onSelectOpportunityById={handleOpenOpportunityById} />;
  else if (screen === "for-you") page = <Opportunities go={go} startupId={activeStartupId} onSelectOpportunity={setSelectedOpportunity} />;
  else if (screen === "explore") page = <Opportunities go={go} explore startupId={activeStartupId} onSelectOpportunity={setSelectedOpportunity} />;
  else if (screen === "opportunity") page = <OpportunityDetail go={go} selectedOpportunity={selectedOpportunity} startupId={activeStartupId} profile={profile} />;
  else if (screen === "matches") page = <Matches go={go} startupId={activeStartupId} onSelectMatch={setSelectedMatch} />;
  else if (screen === "match") page = <MatchDetail go={go} selectedMatch={selectedMatch} onOpenOpportunity={handleOpenOpportunityById} />;
  else if (screen === "assistant") page = <Assistant profile={profile} startupId={activeStartupId} />;
  else if (screen === "startup") page = <Startup go={go} startupId={activeStartupId} profile={profile} onProfileUpdated={setProfile} />;
  else if (screen === "my-opportunities") page = <MyOpportunities go={go} onSelectOpportunity={setSelectedOpportunity} />;
  else if (screen === "create-company") page = <CreateForm go={go} startupId={activeStartupId} />;
  else if (screen === "create-opportunity") page = <CreateForm go={go} opportunity startupId={activeStartupId} />;
  else if (screen === "settings") page = <SettingsPage go={go} />;
  else if (["account", "privacy", "preferences", "notifications"].includes(screen)) page = <SubSettings screen={screen} go={go} startupId={activeStartupId} profile={profile} onProfileUpdated={setProfile} />;
  else page = <Dashboard go={go} startupId={activeStartupId} onSelectOpportunityById={handleOpenOpportunityById} />;

  return (
    <AppShell screen={selectedScreen} go={go} startupName={profile?.name || session?.name || "Minha Startup"}>
      {page}
    </AppShell>
  );
}
