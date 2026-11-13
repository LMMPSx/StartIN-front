import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Check,
  Compass,
  Handshake,
  Pencil,
  Plus,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "@/icons";
import { Field, PageTitle, PrimaryButton } from "@/components/startin/CommonUI";
import { ProMemberBadge } from "@/components/startin/PlanComponents";
import {
  api,
  type AdminOpportunityRecord,
  type AdminOverviewData,
  type AdminProcessRecord,
  type AdminUserRecord,
} from "@/lib/api";
import type { Screen } from "@/types/startin";

type AdminTab = "OVERVIEW" | "USERS" | "OPPORTUNITIES" | "PROCESSES";

export function AdminScreen({ go }: { go: (s: Screen) => void }) {
  const [tab, setTab] = useState<AdminTab>("OVERVIEW");
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [opportunities, setOpportunities] = useState<AdminOpportunityRecord[]>([]);
  const [processes, setProcesses] = useState<AdminProcessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Filtros de Usuários
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("TODOS");
  const [userPlanFilter, setUserPlanFilter] = useState("TODOS");
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Filtros de Oportunidades
  const [oppSearch, setOppSearch] = useState("");
  const [oppOriginFilter, setOppOriginFilter] = useState("TODAS");
  const [editingOpp, setEditingOpp] = useState<AdminOpportunityRecord | null>(null);
  const [savingOpp, setSavingOpp] = useState(false);

  // Filtros de Processos
  const [procSearch, setProcSearch] = useState("");
  const [procTypeFilter, setProcTypeFilter] = useState("TODOS");

  const loadAllAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [ov, us, opps, procs] = await Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getAdminUsers().catch(() => []),
        api.getAdminOpportunities().catch(() => []),
        api.getAdminProcesses().catch(() => []),
      ]);
      if (ov) setOverview(ov);
      setUsers(Array.isArray(us) ? us : []);
      setOpportunities(Array.isArray(opps) ? opps : []);
      setProcesses(Array.isArray(procs) ? procs : []);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados administrativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const showTempNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  // =========================================================================
  // AÇÕES DE USUÁRIOS
  // =========================================================================
  const handleQuickTogglePlan = async (u: AdminUserRecord) => {
    const nextPlan = u.plan === "PRO" ? "FREE" : "PRO";
    try {
      await api.updateAdminUser(u.id, { plan: nextPlan });
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, plan: nextPlan } : item))
      );
      showTempNotice(`Plano de ${u.entityName || u.name} alterado para ${nextPlan}.`);
      api.getAdminOverview().then(setOverview).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Falha ao alterar plano do usuário.");
    }
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    setError("");
    try {
      await api.updateAdminUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        cnpj: editingUser.cnpj,
        phone: editingUser.phone,
        accountType: editingUser.accountType,
        plan: editingUser.plan,
        startupStage: editingUser.startupStage || undefined,
      });
      setEditingUser(null);
      showTempNotice("Usuário atualizado com sucesso pelo Administrador!");
      await loadAllAdminData();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar alterações do usuário.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (u: AdminUserRecord) => {
    if (!window.confirm(`Deseja realmente excluir o usuário "${u.entityName || u.name}" (${u.email}) e todos os seus registros?`)) {
      return;
    }
    try {
      await api.deleteAdminUser(u.id);
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      showTempNotice(`Usuário "${u.entityName || u.name}" excluído com sucesso.`);
      await loadAllAdminData();
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir usuário.");
    }
  };

  // =========================================================================
  // AÇÕES DE OPORTUNIDADES
  // =========================================================================
  const handleQuickToggleOppBoost = async (opp: AdminOpportunityRecord) => {
    const nextPro = !opp.proMember;
    try {
      await api.updateAdminOpportunity(opp.id, { proMember: nextPro });
      setOpportunities((prev) =>
        prev.map((item) => (item.id === opp.id ? { ...item, proMember: nextPro } : item))
      );
      showTempNotice(
        `Oportunidade "${opp.title}" ${nextPro ? "impulsionada com selo Pro Member" : "removida do impulsionamento Pro"}.`
      );
    } catch (err: any) {
      setError(err?.message || "Falha ao alterar impulsionamento da oportunidade.");
    }
  };

  const handleSaveEditedOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    setSavingOpp(true);
    setError("");
    try {
      await api.updateAdminOpportunity(editingOpp.id, {
        title: editingOpp.title,
        type: editingOpp.type,
        status: editingOpp.status,
        description: editingOpp.description,
        tags: editingOpp.tags,
        meta: editingOpp.meta,
        proMember: editingOpp.proMember,
        targetCategory: editingOpp.targetCategory,
      });
      setEditingOpp(null);
      showTempNotice("Oportunidade atualizada com sucesso pelo Administrador!");
      await loadAllAdminData();
    } catch (err: any) {
      setError(err?.message || "Falha ao atualizar oportunidade.");
    } finally {
      setSavingOpp(false);
    }
  };

  const handleDeleteOpportunity = async (opp: AdminOpportunityRecord) => {
    if (!window.confirm(`Deseja realmente excluir a oportunidade "${opp.title}"?`)) {
      return;
    }
    try {
      await api.deleteAdminOpportunity(opp.id);
      setOpportunities((prev) => prev.filter((item) => item.id !== opp.id));
      showTempNotice(`Oportunidade "${opp.title}" excluída com sucesso.`);
      await loadAllAdminData();
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir oportunidade.");
    }
  };

  // =========================================================================
  // AÇÕES DE PROCESSOS / CONEXÕES / MATCHES
  // =========================================================================
  const handleDeleteProcess = async (proc: AdminProcessRecord) => {
    if (!window.confirm(`Deseja excluir este processo (${proc.sourceName} -> ${proc.targetName})?`)) {
      return;
    }
    try {
      await api.deleteAdminProcess(proc.processType, proc.id);
      setProcesses((prev) =>
        prev.filter((item) => !(item.processType === proc.processType && item.id === proc.id))
      );
      showTempNotice("Processo/conexão removido pelo Administrador.");
      await loadAllAdminData();
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir processo.");
    }
  };

  // =========================================================================
  // LISTAS FILTRADAS
  // =========================================================================
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== "TODOS" && u.accountType !== userRoleFilter) return false;
      if (userPlanFilter !== "TODOS" && u.plan !== userPlanFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const hay = `${u.name || ""} ${u.entityName || ""} ${u.email || ""} ${u.cnpj || ""} ${
          u.entityDetails || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, userRoleFilter, userPlanFilter, userSearch]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      if (oppOriginFilter === "EMPRESAS" && !o.companyId && o.type !== "POC" && o.type !== "PRIMEIRA_COMPRA" && o.type !== "COMPRA") {
        return false;
      }
      if (oppOriginFilter === "STARTUPS" && !o.startupId && o.type !== "SERVICO") {
        return false;
      }
      if (oppOriginFilter === "EDITAIS_EVENTOS" && o.type !== "EDITAL" && o.type !== "EVENTO") {
        return false;
      }
      if (oppSearch.trim()) {
        const q = oppSearch.toLowerCase();
        const hay = `${o.title || ""} ${o.type || ""} ${o.companyName || ""} ${o.startupName || ""} ${
          o.description || ""
        } ${o.tags || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [opportunities, oppOriginFilter, oppSearch]);

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      if (procTypeFilter !== "TODOS" && p.processType !== procTypeFilter) return false;
      if (procSearch.trim()) {
        const q = procSearch.toLowerCase();
        const hay = `${p.sourceName || ""} ${p.targetName || ""} ${p.status || ""} ${
          p.message || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [processes, procTypeFilter, procSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageTitle
          eyebrow="Controle Geral & Moderação do Sistema · Acesso Total (admin)"
          title="Painel Administrativo StartIn"
          description="Gerencie todos os usuários (Startups, Empresas e Prestadores), altere planos (Free/Pro), modere oportunidades lançadas e controle conexões e processos da plataforma."
        />
        <PrimaryButton secondary onClick={loadAllAdminData}>
          Sincronizar dados
        </PrimaryButton>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-900">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-extrabold text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Abas de Navegação do Admin */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e0e6eb] bg-white p-2">
        {[
          { id: "OVERVIEW", label: "Visão Geral", icon: Shield },
          { id: "USERS", label: `Usuários (${users.length})`, icon: Users },
          { id: "OPPORTUNITIES", label: `Oportunidades (${opportunities.length})`, icon: Compass },
          { id: "PROCESSES", label: `Processos & Conexões (${processes.length})`, icon: Handshake },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as AdminTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                active
                  ? "bg-[#111827] text-[#FEC908] shadow-xs"
                  : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#111827]"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          ABA 1: VISÃO GERAL DO SISTEMA
      ===================================================================== */}
      {tab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
              onClick={() => setTab("USERS")}
              className="cursor-pointer rounded-2xl border border-[#e2e7eb] bg-white p-5 transition hover:border-[#111827]"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#64748b]">
                <span>Total de Usuários</span>
                <Users size={17} className="text-[#111827]" />
              </div>
              <div className="mt-3 text-3xl font-black text-[#111827]">
                {overview?.usersCount ?? users.length}
              </div>
              <p className="mt-1 text-[11px] text-[#64748b]">
                {overview?.proUsersCount ?? users.filter((u) => u.plan === "PRO").length} Pro ·{" "}
                {overview?.freeUsersCount ?? users.filter((u) => u.plan !== "PRO").length} Free
              </p>
            </div>

            <div
              onClick={() => {
                setUserRoleFilter("STARTUP");
                setTab("USERS");
              }}
              className="cursor-pointer rounded-2xl border border-[#e2e7eb] bg-white p-5 transition hover:border-[#111827]"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#64748b]">
                <span>Startups Cadastradas</span>
                <Rocket size={17} className="text-[#b45309]" />
              </div>
              <div className="mt-3 text-3xl font-black text-[#111827]">
                {overview?.startupsCount ?? users.filter((u) => u.accountType === "STARTUP").length}
              </div>
              <p className="mt-1 text-[11px] text-[#64748b]">Validação e Tração</p>
            </div>

            <div
              onClick={() => {
                setUserRoleFilter("COMPANY");
                setTab("USERS");
              }}
              className="cursor-pointer rounded-2xl border border-[#e2e7eb] bg-white p-5 transition hover:border-[#111827]"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#64748b]">
                <span>Empresas & Prestadores</span>
                <Building2 size={17} className="text-[#15803d]" />
              </div>
              <div className="mt-3 text-3xl font-black text-[#111827]">
                {(overview?.companiesCount ?? 0) + (overview?.providersCount ?? 0) ||
                  users.filter((u) => u.accountType === "COMPANY" || u.accountType === "PROVIDER").length}
              </div>
              <p className="mt-1 text-[11px] text-[#64748b]">
                {overview?.companiesCount ?? 0} Empresas · {overview?.providersCount ?? 0} Prestadores
              </p>
            </div>

            <div
              onClick={() => setTab("OPPORTUNITIES")}
              className="cursor-pointer rounded-2xl border border-[#e2e7eb] bg-white p-5 transition hover:border-[#111827]"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#64748b]">
                <span>Oportunidades & Processos</span>
                <Compass size={17} className="text-[#0284c7]" />
              </div>
              <div className="mt-3 text-3xl font-black text-[#111827]">
                {overview?.opportunitiesCount ?? opportunities.length}
              </div>
              <p className="mt-1 text-[11px] text-[#64748b]">
                {overview?.companyOpportunitiesCount ?? 0} de Empresas ·{" "}
                {overview?.startupOpportunitiesCount ?? 0} de Startups
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resumo Rápido de Usuários Recentes */}
            <div className="rounded-2xl border border-[#e2e7eb] bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#111827]">
                  Controle Rápido de Usuários & Assinaturas
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("USERS")}
                  className="text-xs font-extrabold text-[#111827] hover:underline"
                >
                  Gerenciar todos
                </button>
              </div>
              <div className="mt-4 space-y-2.5">
                {users.slice(0, 6).map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#edf1f4] bg-[#f8fafc] p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#111827] truncate">
                          {u.entityName || u.name}
                        </span>
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[9.5px] font-black text-[#111827]">
                          {u.accountType}
                        </span>
                        {u.plan === "PRO" ? (
                          <ProMemberBadge compact />
                        ) : (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9.5px] font-bold text-gray-600">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748b] truncate">
                        {u.email} {u.entityDetails ? `· ${u.entityDetails}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickTogglePlan(u)}
                        className="rounded-lg border border-[#d6dfe6] bg-white px-2.5 py-1 text-[10.5px] font-bold text-[#111827] hover:bg-gray-100"
                      >
                        Mudar p/ {u.plan === "PRO" ? "FREE" : "PRO"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="rounded-lg bg-[#111827] px-2.5 py-1 text-[10.5px] font-bold text-[#FEC908]"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Rápido de Oportunidades (Empresas e Startups) */}
            <div className="rounded-2xl border border-[#e2e7eb] bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#111827]">
                  Controle Rápido de Oportunidades (Empresas & Startups)
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("OPPORTUNITIES")}
                  className="text-xs font-extrabold text-[#111827] hover:underline"
                >
                  Gerenciar todas
                </button>
              </div>
              <div className="mt-4 space-y-2.5">
                {opportunities.slice(0, 6).map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#edf1f4] bg-[#f8fafc] p-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#111827] px-1.5 py-0.5 text-[9.5px] font-black text-[#FEC908]">
                          {o.type}
                        </span>
                        {o.proMember && <ProMemberBadge compact />}
                        <span className="font-extrabold text-[#111827] truncate">{o.title}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#64748b] truncate">
                        Origem: {o.companyName || o.startupName || "Plataforma / RAG"} · Status:{" "}
                        {o.status || "Publicada"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingOpp(o)}
                        className="rounded-lg bg-[#111827] px-2.5 py-1 text-[10.5px] font-bold text-[#FEC908]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOpportunity(o)}
                        className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[10.5px] font-bold text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 2: GERENCIAR TODOS OS USUÁRIOS (STARTUPS, EMPRESAS, PRESTADORES)
      ===================================================================== */}
      {tab === "USERS" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e0e6eb] bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuário por nome, startup, empresa, e-mail ou CNPJ..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none focus:border-[#111827]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#111827]"
              >
                <option value="TODOS">Todos os Perfis</option>
                <option value="STARTUP">Startups</option>
                <option value="COMPANY">Empresas</option>
                <option value="PROVIDER">Prestadores</option>
                <option value="ADMIN">Administradores</option>
              </select>
              <select
                value={userPlanFilter}
                onChange={(e) => setUserPlanFilter(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#111827]"
              >
                <option value="TODOS">Todos os Planos</option>
                <option value="PRO">Plano Pro (R$ 30)</option>
                <option value="FREE">Plano Free</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
                Carregando todos os usuários do sistema...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
                Nenhum usuário encontrado para o filtro selecionado.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e7eb] bg-white p-5 shadow-2xs md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#111827] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#FEC908]">
                        {u.accountType}
                      </span>
                      {u.plan === "PRO" ? (
                        <ProMemberBadge compact />
                      ) : (
                        <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-[10px] font-extrabold text-gray-600">
                          PLANO FREE
                        </span>
                      )}
                      {u.startupStage && (
                        <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                          Estágio: {u.startupStage}
                        </span>
                      )}
                      <h3 className="text-sm font-black text-[#111827]">
                        {u.entityName || u.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#475569]">
                      Responsável: <strong>{u.name}</strong> · E-mail: <strong>{u.email}</strong>
                      {u.cnpj ? ` · CNPJ: ${u.cnpj}` : ""}
                      {u.phone ? ` · Tel: ${u.phone}` : ""}
                    </p>
                    {u.entityDetails && (
                      <p className="text-[11px] text-[#64748b]">Detalhes: {u.entityDetails}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickTogglePlan(u)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                        u.plan === "PRO"
                          ? "border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                          : "bg-[#FEC908] text-[#111827] hover:bg-[#e5b507]"
                      }`}
                    >
                      {u.plan === "PRO" ? "Mudar para Free" : "Ativar Plano Pro"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...u })}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
                    >
                      <Pencil size={13} /> Alterar
                    </button>
                    {u.email !== "admin" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 3: GERENCIAR TODAS AS OPORTUNIDADES (EMPRESAS & STARTUPS)
      ===================================================================== */}
      {tab === "OPPORTUNITIES" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e0e6eb] bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
                placeholder="Buscar oportunidade por título, empresa, startup, tipo ou requisito..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none focus:border-[#111827]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "TODAS", label: "Todas" },
                { id: "EMPRESAS", label: "De Empresas (POC/Compra)" },
                { id: "STARTUPS", label: "De Startups (Serviços)" },
                { id: "EDITAIS_EVENTOS", label: "Editais & Eventos (RAG)" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOppOriginFilter(f.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                    oppOriginFilter === f.id
                      ? "bg-[#111827] text-[#FEC908]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
                Carregando oportunidades...
              </div>
            ) : filteredOpps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
                Nenhuma oportunidade encontrada para o filtro selecionado.
              </div>
            ) : (
              filteredOpps.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e7eb] bg-white p-5 shadow-2xs md:flex-row md:items-center"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#111827] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#FEC908]">
                        {o.type}
                      </span>
                      {o.proMember && <ProMemberBadge compact />}
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {o.status || "Publicada"}
                      </span>
                      <span className="text-xs font-bold text-[#64748b]">
                        Lançada por:{" "}
                        <strong className="text-[#111827]">
                          {o.companyName || o.startupName || "RAG / Sistema"}
                        </strong>
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-[#111827]">{o.title}</h3>
                    <p className="text-xs text-[#475569] line-clamp-2">{o.description}</p>
                    {o.tags && (
                      <p className="text-[11px] text-[#64748b]">
                        <strong>Tags / Requisitos:</strong> {o.tags}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickToggleOppBoost(o)}
                      className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                        o.proMember
                          ? "border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                          : "bg-[#FEC908] text-[#111827] hover:bg-[#e5b507]"
                      }`}
                    >
                      {o.proMember ? "Remover Selo Pro" : "Impulsionar (Pro Member)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOpp({ ...o })}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-extrabold text-[#FEC908] transition hover:bg-black"
                    >
                      <Pencil size={13} /> Alterar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOpportunity(o)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 4: GERENCIAR PROCESSOS, CONEXÕES & MATCHES
      ===================================================================== */}
      {tab === "PROCESSES" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e0e6eb] bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={procSearch}
                onChange={(e) => setProcSearch(e.target.value)}
                placeholder="Buscar processo por startup, prestador, oportunidade ou status..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none focus:border-[#111827]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "TODOS", label: "Todos os Processos" },
                { id: "CONNECTION", label: "Conexões Startup <-> Prestador" },
                { id: "MATCH", label: "Matches Startup <-> Oportunidade" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setProcTypeFilter(f.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                    procTypeFilter === f.id
                      ? "bg-[#111827] text-[#FEC908]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
                Carregando processos e conexões...
              </div>
            ) : filteredProcesses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
                Nenhum processo encontrado para o filtro selecionado.
              </div>
            ) : (
              filteredProcesses.map((p) => (
                <div
                  key={`${p.processType}-${p.id}`}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e7eb] bg-white p-5 shadow-2xs md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#111827] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#FEC908]">
                        {p.processType === "CONNECTION" ? "CONEXÃO DE SERVIÇO" : "MATCH / INTERESSE"}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800">
                        Status: {p.status}
                      </span>
                      {p.matchScore != null && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                          {p.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-[#111827]">
                      {p.sourceName} <span className="text-gray-400 font-normal">-&gt;</span> {p.targetName}
                    </h3>
                    {p.message && (
                      <p className="text-xs text-[#475569] line-clamp-2">{p.message}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteProcess(p)}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 md:self-auto"
                  >
                    <Trash2 size={13} /> Excluir Processo
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DE EDIÇÃO COMPLETA DE USUÁRIO PELO ADMIN
      ===================================================================== */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setEditingUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Moderação de Conta · ID #{editingUser.id}
                </span>
                <h3 className="mt-1 text-xl font-black text-[#111827]">
                  Editar Usuário: {editingUser.entityName || editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="mt-5 space-y-4">
              <Field
                label="Nome / Razão Social"
                value={editingUser.name || ""}
                onChange={(v) => setEditingUser({ ...editingUser, name: v })}
              />
              <Field
                label="E-mail de Login"
                value={editingUser.email || ""}
                onChange={(v) => setEditingUser({ ...editingUser, email: v })}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="CNPJ"
                  value={editingUser.cnpj || ""}
                  onChange={(v) => setEditingUser({ ...editingUser, cnpj: v })}
                />
                <Field
                  label="Telefone"
                  value={editingUser.phone || ""}
                  onChange={(v) => setEditingUser({ ...editingUser, phone: v })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#111827]">
                    Tipo de Perfil
                  </label>
                  <select
                    value={editingUser.accountType}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, accountType: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#111827]"
                  >
                    <option value="STARTUP">STARTUP</option>
                    <option value="COMPANY">COMPANY (Empresa)</option>
                    <option value="PROVIDER">PROVIDER (Prestador)</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#111827]">
                    Plano de Assinatura
                  </label>
                  <select
                    value={editingUser.plan || "FREE"}
                    onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#111827]"
                  >
                    <option value="FREE">FREE (Gratuito)</option>
                    <option value="PRO">PRO (R$ 30/mês)</option>
                  </select>
                </div>
              </div>

              {editingUser.accountType === "STARTUP" && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#111827]">
                    Estágio da Startup
                  </label>
                  <select
                    value={editingUser.startupStage || "Validação"}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, startupStage: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#111827]"
                  >
                    <option value="Validação">Validação</option>
                    <option value="Tração">Tração</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <PrimaryButton type="submit" disabled={savingUser}>
                  {savingUser ? "Salvando..." : "Salvar Alterações"} <Check size={15} />
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DE EDIÇÃO COMPLETA DE OPORTUNIDADE PELO ADMIN
      ===================================================================== */}
      {editingOpp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setEditingOpp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Moderação de Oportunidade · ID #{editingOpp.id}
                </span>
                <h3 className="mt-1 text-xl font-black text-[#111827]">
                  Editar Oportunidade
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOpp(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedOpp} className="mt-5 space-y-4">
              <Field
                label="Título da Oportunidade"
                value={editingOpp.title || ""}
                onChange={(v) => setEditingOpp({ ...editingOpp, title: v })}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#111827]">
                    Modalidade / Tipo
                  </label>
                  <select
                    value={editingOpp.type || "POC"}
                    onChange={(e) => setEditingOpp({ ...editingOpp, type: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#111827]"
                  >
                    <option value="POC">POC (Empresa)</option>
                    <option value="PRIMEIRA_COMPRA">PRIMEIRA_COMPRA (Empresa)</option>
                    <option value="COMPRA">COMPRA (Empresa)</option>
                    <option value="SERVICO">SERVICO (Startup Tração)</option>
                    <option value="EDITAL">EDITAL</option>
                    <option value="EVENTO">EVENTO</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#111827]">
                    Status
                  </label>
                  <select
                    value={editingOpp.status || "Publicada"}
                    onChange={(e) => setEditingOpp({ ...editingOpp, status: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#111827]"
                  >
                    <option value="Publicada">Publicada</option>
                    <option value="EM_ANALISE">Em análise</option>
                    <option value="ENCERRADA">Encerrada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#111827]">
                  Descrição / Escopo
                </label>
                <textarea
                  rows={4}
                  value={editingOpp.description || ""}
                  onChange={(e) => setEditingOpp({ ...editingOpp, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs outline-none focus:border-[#111827]"
                />
              </div>

              <Field
                label="Tags / Requisitos Técnicos"
                value={editingOpp.tags || ""}
                onChange={(v) => setEditingOpp({ ...editingOpp, tags: v })}
              />

              <Field
                label="Prazo / Localização / Meta"
                value={editingOpp.meta || ""}
                onChange={(v) => setEditingOpp({ ...editingOpp, meta: v })}
              />

              <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-bold text-[#111827] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingOpp.proMember)}
                  onChange={(e) =>
                    setEditingOpp({ ...editingOpp, proMember: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#111827]"
                />
                <span>Impulsionar oportunidade na frente com selo Pro Member</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingOpp(null)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <PrimaryButton type="submit" disabled={savingOpp}>
                  {savingOpp ? "Salvando..." : "Salvar Oportunidade"} <Check size={15} />
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
