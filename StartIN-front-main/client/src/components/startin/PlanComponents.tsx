import React, { useState } from "react";
import { Check, X, Sparkles, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { api, getSession, saveSession, isProUser } from "@/lib/api";

/**
 * Selo de Verificado no estilo do Instagram (azul com check branco) exibido nos perfis assinantes do Plano Pro.
 */
export function VerifiedProBadge({
  size = 18,
  className = "",
  title = "Perfil Verificado · Assinante Plano Pro",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center align-middle select-none ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          fill="#0095F6"
        />
        <path
          d="M9.4 12.35L11.15 14.1L15.1 9.65"
          stroke="#FFFFFF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Selo oficial de impulsionamento "pro member" para oportunidades lançadas por
 * assinantes do Plano Pro (Empresas e Startups em Tração).
 */
export function ProMemberBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-[#f5c800] bg-[#fff9db] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#795900] shadow-xs ${className}`}
      title="Oportunidade impulsionada — Membro assinante do Plano Pro"
    >
      <ShieldCheck size={11} className="text-[#c79800]" />
      pro member
    </span>
  );
}

/**
 * Banner / Botão "Ver mais" exibido nas listas do Plano Free (Oportunidades, Empresas, Startups, Prestadores)
 * que abre a propaganda do Plano Pro ao ser clicado.
 */
export function VerMaisProBanner({
  hiddenCount = 0,
  contextLabel = "oportunidades e conexões assertivas",
  profileType = "STARTUP",
  isTraction = false,
  onUpgraded,
}: {
  hiddenCount?: number;
  contextLabel?: string;
  profileType?: "STARTUP" | "COMPANY" | "PROVIDER" | string;
  isTraction?: boolean;
  onUpgraded?: () => void;
}) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <div className="mt-6 rounded-2xl border-2 border-dashed border-[#f5c800] bg-gradient-to-r from-[#fffef5] via-[#fffdf0] to-[#f9fafb] p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#111827] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f5c800]">
                Plano Free Ativo
              </span>
              <span className="text-xs font-bold text-[#795900]">
                Exibindo 1 match de alta aderência (&gt;=90%) e resultados limitados (&lt;=70%)
              </span>
            </div>
            <h4 className="mt-2 font-['Poppins'] text-base font-bold text-gray-900">
              Quer desbloquear 100% dos melhores matches e {contextLabel}?
            </h4>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600">
              {profileType === "COMPANY"
                ? "Assine o Plano Pro por R$ 30,00/mês para visualizar todas as startups com maior compatibilidade, impulsionar suas oportunidades com o selo pro member, melhorar demandas com IA e liberar o Assistente IA."
                : profileType === "PROVIDER"
                  ? "Assine o Plano Pro por R$ 30,00/mês para acessar todas as oportunidades de startups em Tração com os maiores matches, RAG diário às 08h e acesso completo ao Assistente IA."
                  : isTraction
                    ? "Assine o Plano Pro por R$ 30,00/mês para desbloquear todos os prestadores de serviço e empresas com maior match, impulsionar suas oportunidades com o selo pro member, melhorar textos com IA e usar o Assistente IA."
                    : "Assine o Plano Pro por R$ 30,00/mês para ver mais empresas e oportunidades de POC, Primeira Compra, Editais e Eventos com os melhores matches para sua startup, além de RAG diário às 08h e Assistente IA."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3 text-xs font-bold text-[#f5c800] shadow-sm transition hover:bg-black"
          >
            Ver mais {hiddenCount > 0 ? `(+${hiddenCount} ocultos)` : ""}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {openModal && (
        <ProUpgradeModal
          onClose={() => setOpenModal(false)}
          profileType={profileType}
          isTraction={isTraction}
          onUpgraded={() => {
            setOpenModal(false);
            if (onUpgraded) onUpgraded();
          }}
        />
      )}
    </>
  );
}

/**
 * Modal de propaganda e assinatura do Plano Pro (R$ 30,00/mês — válido para todos os perfis).
 */
export function ProUpgradeModal({
  onClose,
  profileType = "STARTUP",
  isTraction = false,
  onUpgraded,
}: {
  onClose: () => void;
  profileType?: "STARTUP" | "COMPANY" | "PROVIDER" | string;
  isTraction?: boolean;
  onUpgraded?: () => void;
}) {
  const session = getSession();
  const [loading, setLoading] = useState(false);
  const currentlyPro = isProUser(session);

  const handleSelectPlan = async (targetPlan: "FREE" | "PRO") => {
    if (!session?.userId) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      const updated = await api.updateUser(session.userId, { plan: targetPlan });
      saveSession({
        ...session,
        plan: updated.plan || targetPlan,
      });
      if (onUpgraded) {
        onUpgraded();
      } else {
        window.location.reload();
      }
    } catch {
      saveSession({
        ...session,
        plan: targetPlan,
      });
      if (onUpgraded) {
        onUpgraded();
      } else {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="inline-block rounded-full bg-[#fff2b8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#795900]">
              Assinatura StartIn · Válida para Todos os Perfis
            </span>
            <h2 className="mt-2 font-['Poppins'] text-2xl font-bold text-gray-900">
              Evolua para o Plano Pro e destrave 100% do ecossistema
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Compare os recursos do Plano Free e do Plano Pro (R$ 30,00/mês) para{" "}
              {profileType === "COMPANY"
                ? "Empresas Parceiras"
                : profileType === "PROVIDER"
                  ? "Prestadores de Serviço"
                  : isTraction
                    ? "Startups em Tração"
                    : "Startups em Validação"}
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Bloco Plano Free */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-[#f9fafb] p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-gray-200 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-700">
                  Plano Freemium
                </span>
                <span className="font-['Poppins'] text-xl font-bold text-gray-900">
                  R$ 0<span className="text-xs font-normal text-gray-500">/mês</span>
                </span>
              </div>
              <h3 className="mt-3 font-['Poppins'] text-lg font-bold text-gray-900">Nível Free</h3>
              <p className="mt-1 text-xs text-gray-500">
                Acesso básico com visibilidade reduzida e atualização semanal.
              </p>

              <ul className="mt-5 space-y-3 text-xs text-gray-700">
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Cadastro completo do perfil</strong> com ajuda da IA do StartIn
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>Até 10 oportunidades lançadas por mês para Empresas e Startups em Tração</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Limite de conexões e oportunidades</strong> de editais, POCs e primeira compra visíveis
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Atualização via RAG semanal</strong> (apenas uma vez por semana às 08:00 da manhã)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="text-gray-500">
                    <strong>Sem acesso ao Chat da StartIn</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="text-gray-500">
                    <strong>Sem opção de melhorar texto com IA</strong> ao lançar oportunidades para prestadores ou startups
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="text-gray-500">
                    <strong>Menor visibilidade nas oportunidades lançadas</strong>
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              {currentlyPro ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectPlan("FREE")}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Alternar para Plano Free
                </button>
              ) : (
                <div className="w-full rounded-xl bg-gray-200 py-2.5 text-center text-xs font-bold text-gray-600">
                  Seu Plano Atual
                </div>
              )}
            </div>
          </div>

          {/* Bloco Plano Pro */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-[#f5c800] bg-[#111827] p-6 text-white shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[#f5c800] px-2.5 py-1 text-[10px] font-extrabold uppercase text-black">
                  Recomendado · Todos os Perfis
                </span>
                <span className="font-['Poppins'] text-2xl font-bold text-[#f5c800]">
                  R$ 30<span className="text-xs font-normal text-gray-300">/mês</span>
                </span>
              </div>
              <h3 className="mt-3 font-['Poppins'] text-lg font-bold text-white">Nível Pro</h3>
              <p className="mt-1 text-xs text-gray-300">
                Máxima assertividade, atualização diária às 08h, Chat da StartIn e impulsionamento prioritário.
              </p>

              <ul className="mt-5 space-y-3 text-xs text-gray-200">
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>Tudo do Plano Free incluso</strong> + acesso ilimitado às ferramentas de IA da plataforma
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>100% dos melhores matches e oportunidades assertivas</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>Acesso completo ao Chat da StartIn</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>Criação de templates e materiais profissionais</strong> com apenas um clique pelo Chat da StartIn
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>Atualização diária às 08:00 da manhã</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>Opção &ldquo;Melhorar com a IA&rdquo; liberada</strong> ao lançar oportunidades para Empresas e Startups em Tração
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>
                    <strong>Impulsionamento prioritário de oportunidades e Selo &ldquo;Pro Member&rdquo;</strong> (válido somente para perfis de lançamento de oportunidade)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#f5c800]" />
                  <span>Até 10 oportunidades impulsionadas por mês com destaque visual na vitrine</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectPlan("PRO")}
                className="w-full rounded-xl bg-[#f5c800] py-3 text-xs font-extrabold text-black shadow-md transition hover:bg-[#eab308] disabled:opacity-50"
              >
                {loading
                  ? "Ativando Plano Pro..."
                  : currentlyPro
                    ? "Plano Pro Ativo"
                    : "Assinar Plano Pro — R$ 30,00/mês"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTAÇÃO DE TEMPLATES DO CHATBOT EM PDF E DOCX (GERADORES BINÁRIOS REAIS)
// ============================================================================

function toWin1252Bytes(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0xff) {
      bytes.push(code);
    } else if (code === 0x2013 || code === 0x2014) {
      bytes.push(0x2d); // '-'
    } else if (code === 0x2018 || code === 0x2019) {
      bytes.push(0x27); // "'"
    } else if (code === 0x201c || code === 0x201d) {
      bytes.push(0x22); // '"'
    } else if (code === 0x2022) {
      bytes.push(0xb7); // bullet
    } else {
      bytes.push(0x3f);
    }
  }
  return new Uint8Array(bytes);
}

function escapePdfString(line: string): string {
  let out = "";
  const bytes = toWin1252Bytes(line);
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x28 || b === 0x29 || b === 0x5c) {
      out += "\\" + String.fromCharCode(b);
    } else if (b >= 32 && b <= 126) {
      out += String.fromCharCode(b);
    } else {
      out += "\\" + b.toString(8).padStart(3, "0");
    }
  }
  return out;
}

function wrapTextLines(text: string, maxChars = 84): string[] {
  const rawParagraphs = (text || "").replace(/\r\n/g, "\n").split("\n");
  const wrapped: string[] = [];
  for (const para of rawParagraphs) {
    const trimmed = para.trimEnd();
    if (!trimmed) {
      wrapped.push("");
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = "";
    for (const w of words) {
      if (!current) {
        current = w;
      } else if ((current + " " + w).length <= maxChars) {
        current += " " + w;
      } else {
        wrapped.push(current);
        current = w;
      }
    }
    if (current) wrapped.push(current);
  }
  return wrapped;
}

/**
 * Gera e baixa um arquivo .PDF binário real (padrão PDF 1.4 multipágina) com o template gerado pela IA.
 */
export function exportTemplateAsPdf(
  content: string,
  title = "Template StartIn IA",
  templateStyle = "padrão"
): void {
  const headerLines = [
    "STARTIN — DOCUMENTO / TEMPLATE GERADO PELA IA",
    `Titulo: ${title}`,
    `Estilo de Template: ${templateStyle || "padrao"}`,
    `Data de Exportacao: ${new Date().toLocaleDateString("pt-BR")}`,
    "------------------------------------------------------------------------------------",
    "",
  ];
  const bodyLines = wrapTextLines(content, 82);
  const allLines = [...headerLines, ...bodyLines];

  const linesPerPage = 46;
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pages.push(allLines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(["Template StartIn"]);

  const objects: string[] = [];
  // Obj 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  // Obj 2: Pages placeholder (will fill kids)
  const pageObjNums: number[] = [];
  const fontObjNum = 3;

  let nextObjNum = 4;
  const pageAndContentObjs: string[] = [];

  for (let p = 0; p < pages.length; p++) {
    const pLines = pages[p];
    const pageObj = nextObjNum++;
    const contentObj = nextObjNum++;
    pageObjNums.push(pageObj);

    let stream = "BT\n/F1 10 Tf\n15 TL\n50 780 Td\n";
    for (let idx = 0; idx < pLines.length; idx++) {
      const escaped = escapePdfString(pLines[idx]);
      if (idx === 0) {
        stream += `(${escaped}) Tj\n`;
      } else {
        stream += `T* (${escaped}) Tj\n`;
      }
    }
    stream += "ET\n";

    pageAndContentObjs.push(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`
    );
    pageAndContentObjs.push(
      `${contentObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`
    );
  }

  const kidsRef = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${pageObjNums.length} >>\nendobj\n`);
  objects.push(
    `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
  );
  objects.push(...pageAndContentObjs);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = (title || "template-startin")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  a.href = url;
  a.download = `${slug || "template-startin"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Gerador CRC32 + ZIP OpenXML para criar arquivo .DOCX real (compatível com Microsoft Word, Google Docs e LibreOffice)
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZipStore(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // Store (0 = uncompressed)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory file header signature
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  let centralSize = 0;
  for (const cp of centralParts) centralSize += cp.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + eocd.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const lp of localParts) {
    result.set(lp, pos);
    pos += lp.length;
  }
  for (const cp of centralParts) {
    result.set(cp, pos);
    pos += cp.length;
  }
  result.set(eocd, pos);
  return result;
}

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Gera e baixa um arquivo .DOCX oficial (Office Open XML ZIP container) com o template gerado pela IA.
 */
export function exportTemplateAsDocx(
  content: string,
  title = "Template StartIn IA",
  templateStyle = "padrão"
): void {
  const encoder = new TextEncoder();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const lines = (content || "").replace(/\r\n/g, "\n").split("\n");
  const headerParagraphs = [
    `<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml("STARTIN — TEMPLATE / DOCUMENTO GERADO PELA IA")}</w:t></w:r></w:p>`,
    `<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(`Título: ${title} | Estilo: ${templateStyle || "padrão"}`)}</w:t></w:r></w:p>`,
    `<w:p><w:r><w:t></w:t></w:r></w:p>`,
  ];

  const bodyParagraphs = lines.map((line) => {
    const trimmed = line.trim();
    const isHeading =
      trimmed.length > 0 &&
      trimmed.length < 90 &&
      (/^\d+\./.test(trimmed) || trimmed === trimmed.toUpperCase());
    if (isHeading) {
      return `<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
    }
    return `<w:p><w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${headerParagraphs.join("\n    ")}
    ${bodyParagraphs.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zipBytes = buildZipStore([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypesXml) },
    { name: "_rels/.rels", data: encoder.encode(relsXml) },
    { name: "word/document.xml", data: encoder.encode(documentXml) },
  ]);

  const blob = new Blob([zipBytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = (title || "template-startin")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  a.href = url;
  a.download = `${slug || "template-startin"}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
