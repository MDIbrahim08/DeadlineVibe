import React, { useState, useRef, useEffect } from "react";
import { Ghost, Send, Loader2, Sparkles, Clock, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import { Message, Task } from "../types";

interface AccountabilityGhostProps {
  currentTasks: Task[];
}

const SUGGESTION_CHIPS = [
  { emoji: "ðŸ˜«", text: "High procrastination panic", msg: "I'm seriously procrastinating hard right now. Help me break out of this loop!" },
  { emoji: "ðŸš€", text: "Quick motivation hit", msg: "Give me a cheeky motivational quote to kick me into gear right now." },
  { emoji: "ðŸ“Š", text: "Review my priorities", msg: "Can you summarize what I should focus on RIGHT NOW based on my active deadlines?" },
  { emoji: "ðŸ˜°", text: "Overdue task anxiety", msg: "I have tasks that are already overdue and I'm anxious. What should I do first?" },
];

function getContextualOpener(tasks: Task[]): string {
  const active = tasks.filter(t => !t.completed);
  const overdue = active.filter(t => new Date(t.deadline).getTime() < Date.now());
  const critical = active.filter(t => {
    const hoursLeft = (new Date(t.deadline).getTime() - Date.now()) / 3600000;
    return hoursLeft > 0 && hoursLeft < 6;
  });
  const recentlyDone = tasks.filter(t => t.completed).slice(-1)[0];

  if (overdue.length > 0) {
    return `Booo! ðŸ‘» I'm detecting ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""} â€” including "${overdue[0].title}". That's a haunting I can't ignore! Let's tackle this NOW. What's the blocker?`;
  }
  if (critical.length > 0) {
    const hoursLeft = Math.round((new Date(critical[0].deadline).getTime() - Date.now()) / 3600000);
    return `Booo! ðŸ‘» CRITICAL ALERT: "${critical[0].title}" has only ${hoursLeft}h left! I'm your Accountability Ghost and I refuse to let this slip. Start your Vibe Ignition timer immediately!`;
  }
  if (recentlyDone) {
    return `Booo! ðŸ‘» I'm your Accountability Ghost â€” and I see you just crushed "${recentlyDone.title}"! ðŸ”¥ That's what I'm here for. ${active.length > 0 ? `You still have ${active.length} tasks left â€” keep the momentum alive!` : "Clear board! But the grind never stops. Ready for what's next?"}`;
  }
  return `Booo! ðŸ‘» I'm the Accountability Ghost, haunting your procrastination since day one. I'm watching ${active.length} active task${active.length !== 1 ? "s" : ""} right now. Don't make me rattle my chains â€” tell me what you need!`;
}

export default function AccountabilityGhost({ currentTasks }: AccountabilityGhostProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "init",
      role: "assistant",
      content: getContextualOpener(currentTasks),
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Proactive contextual nudge when overdue tasks appear
  const activeTasks = currentTasks.filter(t => !t.completed);
  const overdueTasks = activeTasks.filter(t => new Date(t.deadline).getTime() < Date.now());
  const criticalTasks = activeTasks.filter(t => {
    const h = (new Date(t.deadline).getTime() - Date.now()) / 3600000;
    return h > 0 && h < 3;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/gemini/coach-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
          currentTasks,
        }),
      });

      if (!response.ok) throw new Error("Ghost disconnected");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: data.reply || "The static is heavy. But whatever you do â€” don't stop now!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: "Sorry, the spectral connection dropped. But don't let that break your focus streak!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (msg: string) => {
    setInputMessage(msg);
  };

  return (
    <div id="ghost" className="glass-panel p-5 rounded-3xl border border-white/5 shadow-2xl relative flex flex-col h-[520px] overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3.5 mb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/12 border border-indigo-400/25 flex items-center justify-center relative shadow-[0_0_15px_rgba(99,102,241,0.18)]">
            <Ghost className="w-4.5 h-4.5 text-indigo-400" style={{ animation: "bounce 2s ease-in-out infinite" }} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-100">Accountability Ghost</h2>
            <p className="text-[9px] font-mono text-slate-500">Contextual Â· Task-Aware Â· Always Watching</p>
          </div>
        </div>

        {/* Live Status Badges */}
        <div className="flex flex-col items-end gap-1">
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-[9px] font-mono text-red-400">
              <AlertTriangle className="w-2.5 h-2.5" />
              {overdueTasks.length} overdue
            </div>
          )}
          {criticalTasks.length > 0 && overdueTasks.length === 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/12 border border-rose-500/20 text-[9px] font-mono text-rose-400 animate-pulse">
              <Clock className="w-2.5 h-2.5" />
              {criticalTasks.length} critical (&lt;3h)
            </div>
          )}
          {overdueTasks.length === 0 && criticalTasks.length === 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400">
              <CheckCircle2 className="w-2.5 h-2.5" />
              on track
            </div>
          )}
        </div>
      </div>

      {/* Task Awareness Strip */}
      {activeTasks.length > 0 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin shrink-0">
          {activeTasks.slice(0, 3).map(t => {
            const hoursLeft = (new Date(t.deadline).getTime() - Date.now()) / 3600000;
            const isOD = hoursLeft < 0;
            const isCrit = hoursLeft >= 0 && hoursLeft < 6;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono shrink-0 ${
                  isOD ? "bg-red-950/40 border-red-500/25 text-red-400" :
                  isCrit ? "bg-rose-950/30 border-rose-500/20 text-rose-400" :
                  "bg-slate-950/50 border-white/5 text-slate-500"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOD ? "bg-red-400 animate-pulse" : isCrit ? "bg-rose-400 animate-pulse" : "bg-slate-600"}`} />
                <span className="max-w-[90px] truncate">{t.title}</span>
                <span>{isOD ? "OD" : `${Math.abs(Math.round(hoursLeft))}h`}</span>
              </div>
            );
          })}
          {activeTasks.length > 3 && (
            <div className="flex items-center px-2 py-1 rounded-full border border-white/5 text-[9px] font-mono text-slate-500 shrink-0">
              +{activeTasks.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 text-xs min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[88%] animate-fade-rise ${
              m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 mb-0.5 px-1">
              <span>{m.role === "user" ? "You" : "ðŸ‘» Ghost"}</span>
              <span>Â·</span>
              <span>{m.timestamp}</span>
            </div>
            <div
              className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-rose-600/28 border border-rose-500/25 text-rose-50 rounded-tr-none px-4"
                  : "bg-slate-950/75 border border-indigo-500/12 text-slate-300 rounded-tl-none font-sans"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[88%]">
            <div className="flex items-center gap-1 text-[9px] font-mono text-indigo-400 mb-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Ghost is conjuring a response...</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-indigo-500/12 rounded-tl-none text-slate-500 flex gap-1.5">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>â—</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>â—</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>â—</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5 mb-2.5 shrink-0">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.text}
            onClick={() => handleSuggestionClick(chip.msg)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/20 rounded-full transition-all"
          >
            <span>{chip.emoji}</span>
            <span>{chip.text}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 relative z-10">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Whisper into the void..."
          disabled={isLoading}
          className="flex-1 bg-slate-950/85 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl border border-white/8 focus:border-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/15 text-xs transition-all"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.22)]"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
