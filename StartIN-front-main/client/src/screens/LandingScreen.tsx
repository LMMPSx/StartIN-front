import React, { useState } from "react";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileText,
  Lightbulb,
  Logo,
  OrbitMark,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "@/icons";
import type { AccountType, Screen } from "@/types/startin";

export function LandingScreen({
  go,
  onSelectRole,
}: {
  go: (s: Screen) => void;
  onSelectRole?: (role: AccountType) => void;
}) {
  const [activeTab, setActiveTab] = useState<"startup" | "company" | "provider">("startup");

  const handleStartSignup = (role: AccountType) => {
    onSelectRole?.(role);
    go("signup");
  };

  return (
    <div className="min-h-screen bg-[#0d121f] text-white selection:bg-[#FEC908] selection:text-[#111827]">
      {/* =====================================================================
          HEADER FIXO / NAVEGAÇÃO SUPERIOR (INVERTIDA / CLARA)
      ===================================================================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 transition hover:opacity-90"
            >
              <Logo />
            </button>

            <nav className="hidden items-center gap-7 text-xs font-bold text-slate-600 md:flex">
              <a href="#historia" className="transition hover:text-[#111827]">
                História & Propósito
              </a>
              <a href="#diferenciais" className="transition hover:text-[#111827]">
                Diferenciais
              </a>
              <a href="#como-funciona" className="transition hover:text-[#111827]">
                Como Funciona
              </a>
              <a href="#vitrine" className="transition hover:text-[#111827]">
                Vitrine de Oportunidades
              </a>
              <a href="#planos" className="transition hover:text-[#111827]">
                Planos & Assinatura
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => go("login")}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Fazer login
            </button>
            <button
              type="button"
              onClick={() => handleStartSignup("STARTUP")}
              className="flex items-center gap-2 rounded-xl bg-[#FEC908] px-4 py-2.5 text-xs font-extrabold text-[#111827] shadow-xs transition hover:bg-[#fed338] hover:shadow-sm"
            >
              Cadastre-se <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION — PRIMEIRA PARTE (INVERTIDA / CLARA, LOGO MAIOR, SEM BOX)
      ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24 bg-gradient-to-b from-white via-slate-50 to-[#ffffff] text-[#111827]">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#FEC908]/25 via-blue-100/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-20 -z-10 h-80 w-80 rounded-full bg-[#FEC908]/15 blur-3xl" />

        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="mx-auto max-w-[880px] text-center">
            {/* LOGO OFICIAL STARTIN CENTRALIZADA E MAIOR */}
            <div className="mx-auto mb-7 flex flex-col items-center justify-center">
              <div className="transition hover:scale-105">
                <img
                  src="/icons/startin-logo-transparent.png"
                  alt="StartIn Marca Oficial"
                  className="h-32 md:h-44 w-auto object-contain drop-shadow-md"
                />
              </div>
              <p className="mt-3 text-xs md:text-sm font-semibold tracking-wide text-slate-500">
                Oportunidades que combinam com sua startup.
              </p>
            </div>

            {/* Slogan Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/80 px-4 py-1.5 text-xs font-semibold text-[#854d0e] shadow-xs">
              <Sparkles size={14} className="text-[#d97706]" />
              <span>O ecossistema oficial de inovação aberta, editais e conexões corporativas</span>
            </div>

            <h1 className="mt-6 text-[34px] font-black leading-[1.08] tracking-[-.05em] text-[#111827] sm:text-[48px] md:text-[58px]">
              Onde <span className="text-[#b45309]">Startups</span> e <span className="text-[#111827]">Grandes Empresas</span> se conectam com precisão de IA.
            </h1>

            <p className="mx-auto mt-6 max-w-[720px] text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              A <strong className="font-bold text-[#111827]">StartIn</strong> foi criada para erradicar o atrito da inovação. Reunimos editais públicos de fomento, desafios de POC corporativa, programas de aceleração e eventos em uma única vitrine inteligente, com um motor de IA auditado que avalia área, tecnologia e maturidade técnica real.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleStartSignup("STARTUP")}
                className="flex items-center gap-2.5 rounded-xl bg-[#FEC908] px-6 py-3.5 text-sm font-extrabold text-[#111827] shadow-sm transition hover:scale-[1.02] hover:bg-[#fed338] hover:shadow-md"
              >
                <Rocket size={17} /> Cadastrar minha Startup
              </button>
              <button
                type="button"
                onClick={() => handleStartSignup("COMPANY")}
                className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-400"
              >
                <Building2 size={17} /> Sou uma Empresa Contratante
              </button>
              <button
                type="button"
                onClick={() => handleStartSignup("PROVIDER")}
                className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-400"
              >
                <Briefcase size={17} /> Sou um Prestador de Serviços
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          HISTÓRIA E MISSÃO — O PROPÓSITO DA STARTIN (TEMA ORIGINAL / DARK)
      ===================================================================== */}
      <section id="historia" className="border-t border-white/10 bg-[#111827] py-20">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#FEC908]">
                História & Origem
              </span>
              <h2 className="mt-3 text-[30px] font-black leading-tight tracking-[-.04em] text-white md:text-[40px]">
                Nascemos para transformar como a inovação aberta acontece no Brasil.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-6 text-gray-300">
                <p>
                  A história da <strong>StartIn</strong> começou a partir de uma constatação dolorosa vivenciada por fundadores e gestores de inovação: as conexões entre startups e grandes corporações eram lentas, burocráticas e frequentemente frustrantes.
                </p>
                <p>
                  De um lado, <strong>startups com soluções brilhantes</strong> perdiam meses lendo editais de centenas de páginas em PDF sem saber se realmente cumpriam os pré-requisitos, ou tentavam vender para grandes corporações sem a maturidade exigida pelo departamento de compras.
                </p>
                <p>
                  Do outro lado, <strong>grandes empresas e organizadores de editais</strong> recebiam centenas de inscrições genéricas, gastando centenas de horas em triagens manuais que resultavam em POCs canceladas e desperdício de capital.
                </p>
                <p>
                  Decidimos construir a <strong>StartIn</strong>: um ecossistema com inteligência artificial especializada que atua como uma ponte auditável e transparente, calculando a aderência técnica real e guiando cada perfil — da validação inicial à contratação corporativa de grande porte.
                </p>
              </div>

              <div className="mt-8 rounded-xl border border-[#FEC908]/30 bg-[#FEC908]/10 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FEC908]">
                  Nosso Objetivo Principal
                </h4>
                <p className="mt-1.5 text-xs leading-5 text-gray-200">
                  Consolidar o maior hub de inovação aberta e contratação tecnológica do país, conectando mais de <strong>R$ 100 milhões em editais públicos e oportunidades de POC</strong> até 2027 com transparência matemática absoluta.
                </p>
              </div>
            </div>

            {/* Vitrine visual dos pilares da história */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-[#FEC908]/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEC908]/20 text-[#FEC908]">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Conexões Objetivas e Confiáveis</h3>
                    <p className="text-xs text-gray-400">Matchmaking inteligente baseado em dados reais</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-300">
                  Nossa IA analisa compatibilidade técnica real entre startups e grandes empresas com base em dados de mercado, eliminando triagens manuais exaustivas e aproximando quem realmente pode fechar negócio.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-[#FEC908]/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Compass size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Respeito ao Estágio Real</h3>
                    <p className="text-xs text-gray-400">Validação para provas de conceito (POCs) · Tração para escala</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-300">
                  Startups em Validação encontram POCs, Primeira Compra, Editais e Eventos. Startups com Tração atestada pela NASA TRL acessam Compras Corporativas diretas e contratos escaláveis.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-[#FEC908]/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Conexão Bilateral</h3>
                    <p className="text-xs text-gray-400">Ambiente exclusivo para Startups e Empresas</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-300">
                  A empresa publica suas demandas de POC ou Compra e recebe um ranking das startups mais qualificadas. A startup explora oportunidades alinhadas e gera propostas com IA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          VITRINE DE DIFERENCIAIS DA PLATAFORMA (TEMA ORIGINAL / DARK)
      ===================================================================== */}
      <section id="diferenciais" className="py-20 bg-[#0d121f]">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="mx-auto max-w-[700px] text-center">
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#FEC908]">
              Por que a StartIn?
            </span>
            <h2 className="mt-3 text-[32px] font-black leading-tight tracking-[-.04em] text-white md:text-[42px]">
              Diferenciais que colocam sua empresa ou startup à frente
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Cada funcionalidade foi desenhada para eliminar desperdício de tempo e aumentar a taxa de sucesso das conexões de inovação.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-[#FEC908]/50 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEC908]/20 text-[#FEC908]">
                <Zap size={24} />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">Matchmaking Inteligente & Preciso</h3>
              <p className="mt-2.5 text-xs leading-5 text-gray-400">
                Cruzamos dados setoriais, requisitos tecnológicos e o momento operacional de cada negócio para recomendar conexões de alto valor com máxima aderência comercial.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#FEC908]">
                <CheckCircle2 size={13} /> Recomendações assertivas e transparentes
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-[#FEC908]/50 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                <Compass size={24} />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">RAG Diário com Links Diretos</h3>
              <p className="mt-2.5 text-xs leading-5 text-gray-400">
                Raspagem automatizada todos os dias às 08:00 nos portais oficiais da FINEP, FAPESP PIPE, InovaStartups e editais regionais, apontando para o PDF ou chamada aberta específica.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
                <CheckCircle2 size={13} /> Sem redirecionamentos genéricos
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-[#FEC908]/50 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Shield size={24} />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">Tração Validada por PDF e TRL</h3>
              <p className="mt-2.5 text-xs leading-5 text-gray-400">
                A IA analisa o Atestado de Capacidade Técnica em PDF e cruza com a escala TRL 1–9 da NASA para certificar maturidade real, liberando Compras Corporativas diretas.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 size={13} /> Segurança para a empresa compradora
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-[#FEC908]/50 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Bot size={24} />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">Assistente IA Especialista</h3>
              <p className="mt-2.5 text-xs leading-5 text-gray-400">
                Cruza as informações da startup com a oportunidade salva para redigir propostas técnicas de 90 dias, planos de trabalho e pitches em texto plano puro, prontos para envio.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                <CheckCircle2 size={13} /> Texto limpo sem formatações confusas
              </div>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-[#FEC908]/50 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
                <Building2 size={24} />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">Fluxos Dedicados e Isolados</h3>
              <p className="mt-2.5 text-xs leading-5 text-gray-400">
                Empresas gerenciam POCs, compras e visualizam histórico de matches. Startups gerenciam candidaturas, salvos e editais, garantindo privacidade e foco total.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-purple-400">
                <CheckCircle2 size={13} /> Experiência sob medida por perfil
              </div>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-[#FEC908]/50 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">Eventos & Networking Local</h3>
              <p className="mt-2.5 text-xs leading-5 text-gray-400">
                Matchmaking geográfico e setorial com eventos do ecossistema (como o Startup Connect Recife), aproximando fundadores e executivos presencialmente.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                <CheckCircle2 size={13} /> Pontuação por cidade e polo regional
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          COMO FUNCIONA — JORNADA PASSO A PASSO (TEMA ORIGINAL / DARK)
      ===================================================================== */}
      <section id="como-funciona" className="border-t border-white/10 bg-[#111827] py-20">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="mx-auto max-w-[700px] text-center">
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#FEC908]">
              Passo a Passo
            </span>
            <h2 className="mt-3 text-[32px] font-black leading-tight tracking-[-.04em] text-white md:text-[42px]">
              Como funciona a StartIn
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Escolha seu perfil abaixo e entenda a jornada de matching inteligente.
            </p>

            {/* Toggle Startup / Empresa / Prestador */}
            <div className="mt-8 inline-flex flex-wrap justify-center rounded-xl border border-white/15 bg-white/5 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("startup")}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-extrabold transition ${
                  activeTab === "startup"
                    ? "bg-[#FEC908] text-[#111827] shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Rocket size={14} /> Para Startups
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("company")}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-extrabold transition ${
                  activeTab === "company"
                    ? "bg-[#FEC908] text-[#111827] shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Building2 size={14} /> Para Empresas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("provider")}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-extrabold transition ${
                  activeTab === "provider"
                    ? "bg-[#FEC908] text-[#111827] shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Briefcase size={14} /> Para Prestadores
              </button>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {activeTab === "startup" ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 01</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Identidade & Solução Estruturada</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Preencha o setor, localização e descreva o problema resolvido. A IA do StartIn estrutura seu texto e gera os tópicos técnicos do seu negócio automaticamente.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 02</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Maturidade & Escala TRL da NASA</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    A escala TRL (1 a 9) da NASA define o estágio da startup: Validação (níveis 1 a 6) para POCs e editais, ou Tração (níveis 7 a 9) com comprovação técnica de Atestado de Capacidade para compras corporativas diretas.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 03</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Recomendações & Propostas</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Acesse sua Home, veja as oportunidades ranqueadas pela IA com justificativa em 4 pilares e use o Assistente IA para redigir propostas prontas para submissão.
                  </p>
                </div>
              </>
            ) : activeTab === "company" ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 01</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Perfil Corporativo & Setor</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Cadastre os dados da sua empresa, setor de atuação, localização e tipo de organização em um fluxo estruturado e moderno.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 02</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Demandas & Desafios com IA</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Descreva seus gargalos operacionais e use a IA para organizar as demandas técnicas, gerando as tags e tópicos que as startups precisam atender.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 03</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Lançamento de POCs e Matchmaking</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Defina modalidades (POC, Primeira Compra ou Compra), visualize o ranking de startups aderentes com a balança auditada e inicie contato direto.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 01</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Perfil, Especialidade & Portfólio com IA</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Cadastre sua categoria de atuação (Design, Desenvolvimento, Marketing, Jurídico ou Financeiro), estruture sua bio em 1ª pessoa com IA e destaque suas ferramentas e cases.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 02</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Matchmaking com Startups em Tração</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Nossa IA cruza suas competências com startups validadas no estágio de Tração e suas demandas técnicas de trabalho abertas na plataforma.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black text-[#FEC908]">ETAPA 03</div>
                  <h3 className="mt-3 text-lg font-bold text-white">Conexão Direta, Propostas & Contratos</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    Salve oportunidades de demandas, use o Assistente IA para elaborar propostas técnicas sob medida e envie solicitações de parceria diretamente às startups.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          VITRINE DE OPORTUNIDADES E EVENTOS REAIS (TEMA ORIGINAL / DARK)
      ===================================================================== */}
      <section id="vitrine" className="py-20 bg-[#0d121f]">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="mx-auto max-w-[700px] text-center">
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#FEC908]">
              Vitrine em Tempo Real
            </span>
            <h2 className="mt-3 text-[32px] font-black leading-tight tracking-[-.04em] text-white md:text-[42px]">
              Oportunidades ativas na StartIn
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Exemplos reais de editais públicos, desafios corporativos e eventos monitorados pela nossa IA.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Oportunidade 1: Edital */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#FEC908]/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#fff2b8] px-2.5 py-1 text-[10px] font-extrabold text-[#795900]">
                    EDITAL PÚBLICO
                  </span>
                  <span className="text-xs font-extrabold text-[#29815d]">FINEP</span>
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-white">
                  Chamada Pública FINEP EFPC Inovação Aberta
                </h3>
                <p className="mt-2 text-xs text-gray-400 line-clamp-3">
                  Subvenção econômica não reembolsável para conexão entre entidades fechadas de previdência e startups com soluções de IA, dados e segurança.
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-gray-400">
                Inscrições abertas · Brasil · Remoto
              </div>
            </div>

            {/* Oportunidade 2: POC */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#FEC908]/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#d9f1e5] px-2.5 py-1 text-[10px] font-extrabold text-[#16734d]">
                    POC CORPORATIVA
                  </span>
                  <span className="text-xs font-extrabold text-gray-300">Empresa Alpha</span>
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-white">
                  POC — Inteligência Operacional & Automação
                </h3>
                <p className="mt-2 text-xs text-gray-400 line-clamp-3">
                  Grande organização busca startup para automatizar processos internos e testar modelos de IA com possibilidade de contratação contínua.
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-gray-400">
                Prazo até sexta · Brasil · Híbrido
              </div>
            </div>

            {/* Oportunidade 3: Primeira Compra */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#FEC908]/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-1 text-[10px] font-extrabold text-[#92400e]">
                    PRIMEIRA COMPRA
                  </span>
                  <span className="text-xs font-extrabold text-gray-300">Inovação Corporativa</span>
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-white">
                  Primeira Compra — Automação & Dados B2B
                </h3>
                <p className="mt-2 text-xs text-gray-400 line-clamp-3">
                  Contratação pioneira de lote inicial para startups em estágio de Validação com produto tecnológico testado.
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-gray-400">
                Inscrições abertas · Brasil · Remoto
              </div>
            </div>

            {/* Oportunidade 4: Evento */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#FEC908]/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#dff1f5] px-2.5 py-1 text-[10px] font-extrabold text-[#1e7080]">
                    EVENTO
                  </span>
                  <span className="text-xs font-extrabold text-gray-300">Ecossistema</span>
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-white">
                  Startup Connect Recife 2026
                </h3>
                <p className="mt-2 text-xs text-gray-400 line-clamp-3">
                  Rodadas de negócios, pitches para investidores e conexão direta entre corporações e startups de tecnologia no Porto Digital.
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-gray-400">
                Recife, PE · Presencial · Porto Digital
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          PLANOS E ASSINATURAS — FREE vs PRO (DOIS BLOCOS LADO A LADO COM V e X)
      ===================================================================== */}
      <section id="planos" className="border-t border-white/10 bg-[#111827] py-20">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="mx-auto max-w-[760px] text-center">
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#FEC908]">
              Planos & Assinaturas
            </span>
            <h2 className="mt-3 text-[32px] font-black leading-tight tracking-[-.04em] text-white md:text-[42px]">
              Compare o Plano Free e o Plano Pro
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              Uma assinatura única e transparente de <strong className="text-[#FEC908]">R$ 30,00 por mês</strong>, válida para todos os perfis da plataforma (Startups em Validação, Startups em Tração, Empresas Contratantes e Prestadores de Serviços).
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {/* BLOCO 1: PLANO FREE */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.04] p-7 md:p-9">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-300">
                      Nível Inicial
                    </span>
                    <h3 className="mt-3 text-2xl font-black text-white">Plano Free (Freemium)</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">R$ 0</div>
                    <div className="text-[11px] font-semibold text-gray-400">por mês · Todos os perfis</div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-gray-400">
                  Ideal para conhecer a plataforma, cadastrar seu perfil e visualizar uma amostra inicial de conexões e oportunidades.
                </p>

                <div className="mt-7 space-y-3.5 border-t border-white/10 pt-6 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-200">
                      <strong>Cadastro completo do perfil</strong> com ajuda da IA do StartIn.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-200">
                      <strong>Até 5 oportunidades lançadas por mês</strong> para Empresas e Startups em Tração.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-200">
                      <strong>Limite de conexões e oportunidades</strong> de editais, POCs e primeira compra visíveis.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-200">
                      <strong>Atualização semanal</strong> (apenas uma vez por semana às 08:00 da manhã).
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                      <X size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-400">
                      <strong>Sem acesso ao Chat da StartIn.</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                      <X size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-400">
                      <strong>Sem opção de melhorar texto com IA</strong> ao lançar oportunidades para prestadores ou startups.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                      <X size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-400">
                      <strong>Menor visibilidade nas oportunidades lançadas.</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartSignup("STARTUP")}
                className="mt-8 w-full rounded-xl border border-white/20 bg-white/10 py-3.5 text-xs font-extrabold text-white transition hover:bg-white/20"
              >
                Começar no Plano Free
              </button>
            </div>

            {/* BLOCO 2: PLANO PRO (R$ 30/MÊS) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#FEC908] bg-gradient-to-b from-[#1a2438] to-[#0f172a] p-7 md:p-9 shadow-2xl">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEC908] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#111827]">
                      <Sparkles size={11} /> Mais Vantajoso · Todos os Perfis
                    </span>
                    <h3 className="mt-3 text-2xl font-black text-white">Plano Pro (Premium)</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#FEC908]">R$ 30</div>
                    <div className="text-[11px] font-semibold text-gray-300">por mês · Válido p/ todos os perfis</div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-gray-300">
                  Desbloqueie o poder total da IA, receba 100% das oportunidades mais assertivas, impulsione suas demandas com o selo Pro Member e exporte propostas em PDF e DOCX.
                </p>

                <div className="mt-7 space-y-3.5 border-t border-white/15 pt-6 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Tudo do Plano Free incluso</strong> + acesso ilimitado às ferramentas de inteligência artificial da plataforma.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>100% dos melhores matches e oportunidades assertivas.</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Acesso completo ao Chat da StartIn.</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Criação de templates e materiais profissionais</strong> com apenas um clique pelo Chat da StartIn.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Atualização diária às 08:00 da manhã.</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Opção &ldquo;Melhorar com a IA&rdquo; liberada</strong> ao lançar oportunidades tanto para Empresas quanto para Startups em Tração.
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Impulsionamento prioritário de oportunidades e Selo &ldquo;Pro Member&rdquo;</strong> (válido somente para perfis de lançamento de oportunidade).
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEC908] text-[#111827]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-white">
                      <strong>Até 15 oportunidades impulsionadas por mês</strong> com destaque visual na vitrine para atrair os melhores parceiros.
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartSignup("STARTUP")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEC908] py-3.5 text-xs font-black text-[#111827] shadow-lg transition hover:bg-[#fed338]"
              >
                Assinar Plano Pro por R$ 30/mês <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CTA FINAL ANTES DO CADASTRO (TEMA ORIGINAL / DARK)
      ===================================================================== */}
      <section className="border-t border-white/10 bg-gradient-to-b from-[#111827] to-[#0d121f] py-20 text-center">
        <div className="mx-auto max-w-[800px] px-5">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEC908] text-[#111827]">
            <Rocket size={28} />
          </div>
          <h2 className="text-[34px] font-black leading-tight tracking-[-.04em] text-white md:text-[46px]">
            Pronto para dar o próximo grande começo?
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-300 md:text-base">
            Cadastre-se gratuitamente em menos de 3 minutos e descubra agora quais editais, empresas e oportunidades têm match imediato com seu negócio.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleStartSignup("STARTUP")}
              className="flex items-center gap-2 rounded-xl bg-[#FEC908] px-7 py-3.5 text-sm font-extrabold text-[#111827] shadow-lg transition hover:scale-[1.02] hover:bg-[#fed338]"
            >
              Começar como Startup <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleStartSignup("COMPANY")}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Começar como Empresa <Building2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleStartSignup("PROVIDER")}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Começar como Prestador <Briefcase size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER INSTITUCIONAL (TEMA ORIGINAL / DARK)
      ===================================================================== */}
      <footer className="border-t border-white/10 bg-[#090d16] py-10 text-xs text-gray-400">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-6 px-5 sm:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <Logo inverted />
            <span className="text-[11px] text-gray-500">
              © 2026 StartIn. Todos os direitos reservados.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button onClick={() => go("login")} className="hover:text-white">
              Entrar
            </button>
            <button onClick={() => handleStartSignup("STARTUP")} className="hover:text-white">
              Cadastro Startup
            </button>
            <button onClick={() => handleStartSignup("COMPANY")} className="hover:text-white">
              Cadastro Empresa
            </button>
            <button onClick={() => handleStartSignup("PROVIDER")} className="hover:text-white">
              Cadastro Prestador
            </button>
            <span className="text-gray-500">Recife · Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
