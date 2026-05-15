import React, { useRef, useState, useEffect } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Send, Play } from "lucide-react";

const ROLES = ["Software Engineer", "Data Scientist", "ML Engineer", "Frontend Engineer", "Backend Engineer"];
const TYPES = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "mixed", label: "Mixed" },
];

export default function Interview() {
  const [role, setRole] = useState(ROLES[0]);
  const [type, setType] = useState("technical");
  const [session, setSession] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.messages?.length]);

  const start = async () => {
    setStarting(true);
    try {
      const { data } = await api.post("/interview/start", { role, interview_type: type });
      setSession(data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not start interview");
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !session) return;
    setLoading(true);
    const msg = input;
    setInput("");
    try {
      const { data } = await api.post("/interview/message", { session_id: session.id, message: msg });
      setSession(data);
    } catch (err) {
      toast.error("Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="interview-page">
      <header>
        <div className="label-eyebrow">/ Interview Coach</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">AI Interview simulator</h1>
        <p className="text-sm text-[#A1A1AA] mt-2">Adaptive mock interviews with STAR-format scoring.</p>
      </header>

      {!session && (
        <div className="pi-card p-6 max-w-xl">
          <div>
            <label className="label-eyebrow block mb-2">Target role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="interview-role-select">
              {ROLES.map((r) => <option key={r} value={r} style={{ background: "#0A0A0A" }}>{r}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <label className="label-eyebrow block mb-2">Interview type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id} onClick={() => setType(t.id)}
                  className={`text-sm px-3 py-2 border rounded-md transition ${type === t.id ? "border-white/40 bg-white/[0.04]" : "border-white/10 hover:border-white/20"}`}
                  data-testid={`interview-type-${t.id}`}
                >{t.label}</button>
              ))}
            </div>
          </div>
          <button onClick={start} disabled={starting} className="btn-primary mt-6 inline-flex items-center gap-2" data-testid="start-interview-button">
            <Play size={14} strokeWidth={1.5} />
            {starting ? "Preparing…" : "Start interview"}
          </button>
        </div>
      )}

      {session && (
        <div className="pi-card p-0 overflow-hidden flex flex-col h-[70vh]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm text-white">{session.role} · <span className="text-[#A1A1AA] capitalize">{session.interview_type}</span></div>
            <button onClick={() => setSession(null)} className="text-xs text-[#A1A1AA] hover:text-white" data-testid="end-interview-button">End session</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" data-testid="interview-messages">
            {session.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${m.role === "assistant" ? "bg-white/[0.04] border border-white/10 text-[#EDEDED]" : "bg-white text-[#050505]"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-[#52525B]">AI is thinking…</div>}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type your answer…"
              className="pi-input flex-1 px-3 py-2.5 text-sm" data-testid="interview-input"
            />
            <button onClick={send} disabled={loading || !input.trim()} className="btn-primary inline-flex items-center gap-2" data-testid="interview-send-button">
              <Send size={14} strokeWidth={1.5} />
              Send
            </button>
          </div>
          {session.score != null && (
            <div className="p-4 border-t border-white/10 bg-[#0A0A0A]">
              <div className="label-eyebrow">Final score</div>
              <div className="font-display text-3xl mt-1">{session.score}/100</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
