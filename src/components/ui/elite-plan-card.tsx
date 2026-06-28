import * as React from "react";
import { motion } from "framer-motion";
import {
  Clock, ShieldAlert, Zap, CheckCircle2, Trash2,
  Copy, Check, BrainCircuit, Timer, CalendarPlus
} from "lucide-react";
import { Task } from "../../types";

// ─── Inline Tooltip ──────────────────────────────────────────────
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-[200px] px-3 py-1.5 text-[11px] text-slate-200 bg-slate-800 border border-white/10 rounded-lg shadow-xl text-center leading-snug pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

interface ElitePlanCardProps {
  task: Task;
  shipItLoadingId: string | null;
  onStartIgnition: (task: Task) => void;
  onShipIt: (task: Task) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSimulateReminder?: (task: Task) => void;
}

export function ElitePlanCard({
  task,
  shipItLoadingId,
  onStartIgnition,
  onShipIt,
  onComplete,
  onDelete,
  onSimulateReminder,
}: ElitePlanCardProps) {
  const [copiedDraft, setCopiedDraft] = React.useState(false);
  const [copiedProof, setCopiedProof] = React.useState(false);

  const deadline = new Date(task.deadline);
  const isOverdue = deadline.getTime() < Date.now();
  const isLoading = shipItLoadingId === task.id;

  const handleCopy = async (text: string, type: "draft" | "proof") => {
    await navigator.clipboard.writeText(text);
    if (type === "draft") {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    } else {
      setCopiedProof(true);
      setTimeout(() => setCopiedProof(false), 2000);
    }
  };

  const handleAddToCalendar = () => {
    const start = deadline;
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    // Google Calendar
    const gcUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(task.title)}` +
      `&details=${encodeURIComponent(task.description || "")}` +
      `&dates=${fmt(start)}/${fmt(end)}`;
    window.open(gcUrl, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative overflow-hidden rounded-2xl bg-[#0c1222] border border-white/[0.06] shadow-xl hover:border-white/10 transition-all duration-300 group"
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${isOverdue ? "bg-gradient-to-r from-rose-500 to-red-400" : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-[15px] text-white leading-snug">{task.title}</h3>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-full">
                  <ShieldAlert className="w-2.5 h-2.5" /> Overdue
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[13px] line-clamp-2 leading-relaxed">{task.description}</p>
          </div>

          {/* Deadline badge */}
          <div className={`shrink-0 flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border ${isOverdue ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-slate-800/60 border-white/5 text-slate-400"}`}>
            <Clock className="w-3 h-3" />
            {deadline.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </div>
        </div>

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 custom-scrollbar">
            {task.subtasks.map((st) => (
              <div key={st.id} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-white/5 text-[11px] text-slate-400">
                {st.completed
                  ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  : <div className="w-3 h-3 rounded-full border border-slate-600" />
                }
                {st.title}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 5-Min Timer */}
          <Tooltip text="Start a 5-minute focused sprint timer. Great for breaking inertia!">
            <button
              onClick={() => onStartIgnition(task)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-white/[0.06] hover:border-white/10 rounded-lg transition-all"
            >
              <Timer className="w-3.5 h-3.5" /> 5-Min Focus
            </button>
          </Tooltip>

          {/* Shrink Scope — polished */}
          <Tooltip text="AI reads your task and cuts it down to the smallest thing you can actually ship by the deadline.">
            <button
              onClick={() => onShipIt(task)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-indigo-500/30 transition-all shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:shadow-[0_0_18px_rgba(99,102,241,0.4)]"
            >
              {isLoading ? (
                <><BrainCircuit className="w-3.5 h-3.5 animate-pulse" /> Analyzing…</>
              ) : (
                <><Zap className="w-3.5 h-3.5" /> Shrink Scope</>
              )}
            </button>
          </Tooltip>

          {/* Finish */}
          <Tooltip text="Mark this task as done and move it to your completed list.">
            <button
              onClick={() => onComplete(task.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Finish
            </button>
          </Tooltip>

          {/* Add to Calendar */}
          <Tooltip text="Add this deadline to Google Calendar instantly.">
            <button
              onClick={handleAddToCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-white/[0.06] hover:border-white/10 rounded-lg transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-blue-400" /> Add to Calendar
            </button>
          </Tooltip>

          {/* Delete */}
          <Tooltip text="Permanently delete this task.">
            <button
              onClick={() => onDelete(task.id)}
              className="ml-auto p-1.5 text-slate-500 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 border border-white/[0.04] hover:border-rose-500/20 rounded-lg transition-all"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* AI Scope Reduction */}
      {task.shipItPlan && (
        <div className="mx-5 mb-5 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/15">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-indigo-400 font-semibold text-[12px] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Scope Reduction Plan
            </h4>
            <Tooltip text="Copy the full plan and proof-of-work text to your clipboard.">
              <button
                onClick={() => handleCopy(`${task.shipItPlan}\n\n${task.shipItProof}`, "proof")}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-all"
              >
                {copiedProof ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy All</>}
              </button>
            </Tooltip>
          </div>
          {task.shipItMessage && (
            <p className="text-slate-400 text-[13px] italic mb-3">{task.shipItMessage}</p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-white/[0.04]">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Minimal Deliverable</p>
              <p className="text-slate-300 text-[13px] whitespace-pre-wrap leading-relaxed">{task.shipItPlan}</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-white/[0.04]">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Proof of Work</p>
              <p className="text-slate-300 text-[13px] font-mono whitespace-pre-wrap leading-relaxed">{task.shipItProof}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Auto-Pilot Draft */}
      {task.autoPilotDraft && (
        <div className="mx-5 mb-5 p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h4 className="text-blue-400 font-semibold text-[12px] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> AI Auto-Pilot Draft
            </h4>
            <Tooltip text="Copy the AI-written draft to your clipboard. Paste it, tune it, and submit!">
              <button
                onClick={() => handleCopy(task.autoPilotDraft!, "draft")}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 transition-all"
              >
                {copiedDraft ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Draft</>}
              </button>
            </Tooltip>
          </div>
          <p className="text-slate-400 text-[13px] mb-3 relative z-10">
            You snoozed this, so your AI drafted it. Tune it and turn it in!
          </p>
          <div className="bg-slate-900/60 p-4 rounded-lg border border-blue-500/15 relative z-10">
            <pre className="text-slate-200 text-[13px] font-sans whitespace-pre-wrap leading-relaxed">{task.autoPilotDraft}</pre>
          </div>
        </div>
      )}
    </motion.div>
  );
}
