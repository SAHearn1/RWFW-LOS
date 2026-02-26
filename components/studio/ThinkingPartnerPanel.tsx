"use client";

import { useState } from "react";
import { Brain, X, Send } from "lucide-react";

type Props = {
  missionTitle?: string;
  artifactDraft?: string;
};

type Message = {
  role: "user" | "agent";
  text: string;
};

export default function ThinkingPartnerPanel({ missionTitle, artifactDraft }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const prompt = input.trim();
    if (!prompt) return;

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          agentRole: "thinking-partner",
          agentContext: {
            userInput: prompt,
            projectDescription: missionTitle ?? "Unknown mission",
            ...(artifactDraft ? { artifact: artifactDraft.slice(0, 500) } : {}),
          },
        }),
      });

      const data = (await res.json()) as { result?: string; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to get a response.");
        setLoading(false);
        return;
      }

      setMessages((prev) => [...prev, { role: "agent", text: data.result ?? "" }]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-l border-slate-200">
      {/* Collapsed trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1.5 px-3 py-4 hover:bg-slate-50 transition-colors w-full"
          title="Open Thinking Partner"
        >
          <Brain className="h-5 w-5 text-rootwork-teal" />
          <span className="text-[10px] font-semibold text-slate-400 rotate-90 mt-1">Partner</span>
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="flex h-full flex-col w-64">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-rootwork-teal" />
              <span className="text-xs font-semibold text-slate-700">Thinking Partner</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0" style={{ maxHeight: "320px" }}>
            {messages.length === 0 && (
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask a question about your mission or artifact. Your thinking partner asks before answering.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={[
                  "rounded-lg px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-rootwork-teal/10 text-slate-700 ml-4"
                    : "bg-slate-100 text-slate-700 mr-4",
                ].join(" ")}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-400 mr-4 animate-pulse">
                Thinking…
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 px-3 py-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask your thinking partner…"
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-rootwork-teal focus:outline-none focus:ring-1 focus:ring-rootwork-teal/30"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="rounded-lg bg-rootwork-teal px-2.5 py-1.5 text-white disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
