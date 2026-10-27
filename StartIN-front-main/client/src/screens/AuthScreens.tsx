import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Mail, Rocket } from "@/icons";
import { Field, PrimaryButton } from "@/components/startin/CommonUI";
import { AuthShell } from "@/components/startin/ShellLayout";
import { api, getSession, saveSession } from "@/lib/api";
import type { AccountType, Screen } from "@/types/startin";

export function Login({
  go,
  onAuthSuccess,
}: {
  go: (screen: Screen) => void;
  onAuthSuccess: () => void;
}) {
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
      const accountType: AccountType =
        res.accountType === "COMPANY" ? "COMPANY" : "STARTUP";
      saveSession({
        token: res.token,
        userId: res.userId,
        startupProfileId: res.startupProfileId,
        companyId: res.companyId,
        accountType,
        email: res.email,
        name: res.name,
        cnpj: res.cnpj,
        phone: res.phone,
        avatarUrl: res.avatarUrl,
      });
      localStorage.setItem("startin-auth", "1");
      onAuthSuccess();
      go(accountType === "COMPANY" ? "search-startups" : "dashboard");
    } catch (err: any) {
      setError(err.message || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      sideTitle={
        <>
          Conecte sua startup ou empresa a oportunidades <span className="text-[#FEC908]">certas.</span>
        </>
      }
      sideText="Editais, eventos, POCs e conexões corporativas em um só lugar, personalizados com IA."
    >
      <div>
        <p className="text-sm font-semibold text-gray-500">Bem-vinda à StartIn</p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.05em] text-[#111827]">
          Entre na sua conta
        </h2>
        <p className="mt-2 text-sm text-gray-500">Acesse suas oportunidades personalizadas.</p>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <Field label="E-mail" placeholder="seu@email.com" value={email} onChange={setEmail} />
          <Field
            label="Senha"
            placeholder="********"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <button
            type="button"
            onClick={() => go("recovery")}
            className="-mt-2 text-left text-xs font-semibold text-[#111827] hover:underline"
          >
            Esqueceu sua senha?
          </button>
          <PrimaryButton type="submit" full disabled={loading}>
            Entrar <ArrowRight size={16} />
          </PrimaryButton>
        </form>
        <div className="my-7 flex items-center gap-3 text-[11px] text-[#a0a7ae]">
          <div className="h-px flex-1 bg-[#e2e6eb]" />
          ou
          <div className="h-px flex-1 bg-[#e2e6eb]" />
        </div>
        <PrimaryButton secondary full onClick={() => go("signup")}>
          Crie sua conta
        </PrimaryButton>
      </div>
    </AuthShell>
  );
}

export function Signup({
  go,
  onAuthSuccess,
}: {
  go: (screen: Screen) => void;
  onAuthSuccess: () => void;
}) {
  const [accountType, setAccountType] = useState<AccountType>("STARTUP");
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password.trim()) {
      setError("Informe seu e-mail e crie uma senha.");
      return;
    }
    if (form.confirm && form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.signup({
        ...form,
        accountType,
        name:
          form.name.trim() ||
          (accountType === "COMPANY" ? "Nova Empresa" : "Nova Startup"),
      });
      const resolvedType: AccountType =
        res.accountType === "COMPANY" ? "COMPANY" : accountType;
      saveSession({
        token: res.token,
        userId: res.userId,
        startupProfileId: res.startupProfileId,
        companyId: res.companyId,
        accountType: resolvedType,
        email: res.email,
        name: res.name || form.name,
        cnpj: res.cnpj || form.cnpj,
        phone: res.phone || form.phone,
        avatarUrl: res.avatarUrl,
      });
      onAuthSuccess();
      go("verify");
    } catch (err: any) {
      setError(err.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      sideTitle={
        <>
          Crie sua conta e comece a encontrar{" "}
          <span className="text-[#FEC908]">
            {accountType === "COMPANY" ? "startups ideais." : "oportunidades."}
          </span>
        </>
      }
      sideText={
        accountType === "COMPANY"
          ? "Cadastre sua empresa para lançar desafios de POC, Compra ou POC + Compra e encontrar startups aderentes com IA."
          : "Cadastre-se para conectar sua startup a editais, eventos, empresas, POCs e clientes personalizados com IA."
      }
    >
      <div>
        <button
          onClick={() => go("login")}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black"
        >
          <ArrowLeft size={14} /> Voltar para login
        </button>
        <h2 className="text-[28px] font-extrabold tracking-[-.05em] text-[#111827]">
          Crie sua conta
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Selecione seu perfil abaixo e preencha seus dados para começar.
        </p>

        {/* Seletor de Fluxo na 1ª Etapa do Cadastro: Startup vs Empresa */}
        <div className="mt-5">
          <span className="mb-2 block text-xs font-bold text-[#111827]">
            Qual é o seu perfil na StartIn?
          </span>
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-1.5">
            <button
              type="button"
              onClick={() => setAccountType("STARTUP")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-extrabold transition ${
                accountType === "STARTUP"
                  ? "bg-[#111827] text-[#FEC908] shadow-sm"
                  : "text-gray-600 hover:bg-white/70"
              }`}
            >
              <Rocket size={15} />
              Startup
            </button>
            <button
              type="button"
              onClick={() => setAccountType("COMPANY")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-extrabold transition ${
                accountType === "COMPANY"
                  ? "bg-[#111827] text-[#FEC908] shadow-sm"
                  : "text-gray-600 hover:bg-white/70"
              }`}
            >
              <Building2 size={15} />
              Empresa
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#7a8793]">
            {accountType === "STARTUP"
              ? "Fluxo Startup: acesso a editais, matches, busca de empresas e recomendações da IA."
              : "Fluxo Empresa: lançamento de POCs/Compras e busca de startups com match da IA."}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSignup} className="mt-5 space-y-4">
          <Field
            label={accountType === "COMPANY" ? "Nome da empresa" : "Nome da startup"}
            placeholder={accountType === "COMPANY" ? "Ex: Empresa Alpha S.A." : "Ex: Nexa Health"}
            value={form.name}
            onChange={set("name")}
          />
          <Field
            label="CNPJ"
            placeholder="AA.AAA.AAA/AAAA-DV"
            value={form.cnpj}
            onChange={set("cnpj")}
          />
          <Field
            label="Telefone / Celular"
            placeholder="(DD) 99999-9999"
            value={form.phone}
            onChange={set("phone")}
          />
          <Field
            label="E-mail"
            placeholder="seu@email.com"
            value={form.email}
            onChange={set("email")}
          />
          <Field
            label="Senha"
            placeholder="Crie uma senha"
            type="password"
            value={form.password}
            onChange={set("password")}
          />
          <Field
            label="Confirmar senha"
            placeholder="Repita sua senha"
            type="password"
            value={form.confirm}
            onChange={set("confirm")}
          />
          <p className="text-[11px] leading-4 text-[#88929d]">
            Ao criar sua conta, você concorda com os{" "}
            <span className="font-semibold text-[#111827]">Termos de Uso</span> e a{" "}
            <span className="font-semibold text-[#111827]">Política de Privacidade</span>.
          </p>
          <PrimaryButton type="submit" full disabled={loading}>
            Criar conta como {accountType === "COMPANY" ? "Empresa" : "Startup"}{" "}
            <ArrowRight size={16} />
          </PrimaryButton>
        </form>
        <p className="mt-6 text-center text-xs text-[#79848f]">
          Já possui uma conta?{" "}
          <button onClick={() => go("login")} className="font-bold text-[#111827] hover:underline">
            Entrar
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

export function Recovery({
  go,
  onSetRecoveryEmail,
}: {
  go: (screen: Screen) => void;
  onSetRecoveryEmail: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  return (
    <AuthShell
      sideTitle={
        <>
          Não se preocupe, vamos ajudar <span className="text-[#ffd43b]">você.</span>
        </>
      }
      sideText="Informe o e-mail cadastrado e enviaremos as instruções para redefinir sua senha."
    >
      <button
        onClick={() => go("login")}
        className="mb-8 flex items-center gap-2 text-xs font-bold text-[#71808e]"
      >
        <ArrowLeft size={14} /> Voltar para login
      </button>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2bf] text-[#755a00]">
        <Mail size={21} />
      </div>
      <h2 className="text-[28px] font-extrabold tracking-[-.05em] text-[#111827]">
        Esqueceu sua senha?
      </h2>
      <p className="mt-2 text-sm leading-5 text-[#77818c]">
        Digite seu e-mail para receber um link de recuperação.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSetRecoveryEmail(email);
          go("reset");
        }}
        className="mt-8 space-y-5"
      >
        <Field label="E-mail" placeholder="seu@email.com" value={email} onChange={setEmail} />
        <PrimaryButton type="submit" full>
          Enviar link de recuperação <ArrowRight size={16} />
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}

export function Reset({
  go,
  recoveryEmail,
}: {
  go: (s: Screen) => void;
  recoveryEmail: string;
}) {
  const session = getSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleReset = async () => {
    const emailToReset = recoveryEmail || session?.email || "admin";
    if (newPassword.trim()) {
      try {
        await api.resetPassword({ email: emailToReset, newPassword });
      } catch {}
    }
    go("login");
  };

  return (
    <AuthShell
      sideTitle={
        <>
          Recupere o acesso à sua <span className="text-[#FEC908]">conta.</span>
        </>
      }
      sideText="Defina uma nova senha segura para continuar usando a StartIn."
    >
      <button
        type="button"
        onClick={() => go("recovery")}
        className="mb-6 flex items-center gap-2 text-xs font-bold text-[#71808e] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> Voltar
      </button>
      <h2 className="text-[28px] font-extrabold tracking-[-.05em] text-[#111827]">
        Crie uma nova senha
      </h2>
      <p className="mt-2 text-sm text-[#77818c]">
        Escolha uma senha forte para proteger sua conta.
      </p>
      <div className="mt-7 space-y-4">
        <Field
          label="Nova senha"
          placeholder="Digite sua nova senha"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <Field
          label="Confirmar nova senha"
          placeholder="Repita sua nova senha"
          type="password"
          value={confirm}
          onChange={setConfirm}
        />
        <p className="text-[11px] text-[#7e8b95]">A senha deve ter pelo menos 8 caracteres.</p>
        <PrimaryButton full onClick={handleReset}>
          Redefinir senha <Check size={16} />
        </PrimaryButton>
      </div>
    </AuthShell>
  );
}

export function Verify({ go }: { go: (s: Screen) => void }) {
  const session = getSession();
  return (
    <AuthShell
      sideTitle={
        <>
          Confirme seu e-mail para <span className="text-[#FEC908]">continuar.</span>
        </>
      }
      sideText="Enviamos um link de confirmação para validar sua conta antes de configurar sua startup."
    >
      <button
        type="button"
        onClick={() => go("signup")}
        className="mb-6 flex items-center gap-2 text-xs font-bold text-[#71808e] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> Voltar para cadastro
      </button>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-[#111827]">
        <Mail size={24} />
      </div>
      <h2 className="mt-7 text-[28px] font-extrabold tracking-[-.05em] text-[#111827]">
        Verifique seu e-mail
      </h2>
      <p className="mt-3 text-sm leading-5 text-[#77818c]">
        Enviamos uma mensagem para <strong>{session?.email || "seu@email.com"}</strong>.
      </p>
      <div className="mt-6">
        <PrimaryButton full onClick={() => go("onboarding")}>
          Abrir e-mail <ArrowRight size={16} />
        </PrimaryButton>
      </div>
      <button className="mt-5 w-full text-center text-xs font-bold text-[#111827] hover:underline">
        Não recebeu? Reenviar e-mail
      </button>
    </AuthShell>
  );
}
