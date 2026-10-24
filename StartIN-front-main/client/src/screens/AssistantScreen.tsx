import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Send } from "@/icons";
import { BackButton, PageTitle } from "@/components/startin/CommonUI";
import { api, type StartupProfileData } from "@/lib/api";
import type { Screen } from "@/types/startin";

export function Assistant({
  go,
  profile,
  startupId,
}: {
  go: (s: Screen) => void;
  profile: StartupProfileData | null;
  startupId?: number;
}) {
  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([
    {
      from: "ai",
      text: "Busquei na web e encontrei oportunidades relevantes para o seu perfil. A IA analisou editais, eventos e oportunidades de clientes e priorizou os resultados pelo nível de aderência.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    const nextMessages: { from: "ai" | "me"; text: string }[] = [...messages, { from: "me", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const targetStartupId = profile?.id || startupId;
      const res = await api.chatAI(nextMessages, targetStartupId);
      setMessages((m) => [...m, { from: "ai", text: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Não foi possível consultar o servidor de IA no momento. Verifique se o backend e o serviço de IA estão ativos.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackButton label="Voltar para Dashboard" onClick={() => go("dashboard")} />
      <PageTitle
        title="Assistente IA"
        description="Sua IA para buscar oportunidades na web, analisar dados e apoiar decisões."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="flex flex-col justify-between rounded-2xl bg-[#075394] p-6 text-white lg:h-[480px]">
          <div>
            <Bot size={25} className="text-[#ffd43b]" />
            <h2 className="mt-6 text-[25px] font-extrabold leading-7 tracking-[-.05em]">
              Como posso ajudar?
            </h2>
            <p className="mt-3 text-sm leading-5 text-[#c7dceb]">
              Posso ajudar você a encontrar oportunidades mais relevantes para o perfil da sua startup.
            </p>
          </div>
          <div className="mt-6 space-y-2">
            {[
              "Buscar editais na web",
              "Buscar eventos na web",
              "Priorizar meus matches",
              "Analisar oportunidade",
            ].map((x) => (
              <button
                key={x}
                onClick={() => send(x)}
                className="flex w-full items-center justify-between rounded-lg border border-white/20 px-3 py-3 text-left text-xs font-semibold text-white transition hover:bg-white/10"
              >
                {x}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </aside>
        <section className="flex h-[480px] max-h-[480px] flex-col overflow-hidden rounded-2xl border border-[#e1e6ea] bg-white">
          <div className="shrink-0 border-b border-[#edf0f2] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf2f8] text-[#075394]">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#123b62]">STARTIN IA</p>
                <p className="text-[10px] text-[#8b969f]">Online agora · Escopo exclusivo StartIn</p>
              </div>
            </div>
          </div>
          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-4 overflow-y-auto p-5 scroll-smooth"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] break-words rounded-2xl px-4 py-3 text-xs leading-5 ${
                    m.from === "me"
                      ? "rounded-br-sm bg-[#075394] text-white"
                      : "rounded-bl-sm bg-[#f0f5f8] text-[#42617e]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#f0f5f8] px-4 py-3 text-xs text-[#698299]">
                  Analisando dados do projeto StartIn...
                </div>
              </div>
            )}
          </div>
          <div className="m-4 shrink-0 flex items-center gap-2 rounded-xl bg-[#f5f7f9] p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Pergunte sobre editais, eventos, clientes ou matches..."
              className="h-9 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-[#99a4ad]"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#075394] text-white disabled:opacity-60"
            >
              <Send size={15} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
