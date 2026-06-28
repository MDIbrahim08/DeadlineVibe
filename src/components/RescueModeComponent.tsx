import React, { useState } from "react";
import {
  LifeBuoy, AlertTriangle, Copy, Check, Sparkles, Trash2,
  ShieldAlert, Loader2, Calendar, Scissors, Mail, Zap, ChevronRight
} from "lucide-react";
import { Task, RescuePlan } from "../types";

interface RescueModeComponentProps {
  tasks: Task[];
  onRescueSaved: (plan: RescuePlan) => void;
  savedRescues: RescuePlan[];
  onDeleteRescue: (taskId: string) => void;
}

type RescueTab = "tactical" | "email" | "calendar" | "scope";

const TAB_CONFIG: { key: RescueTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "tactical", label: "Sprint Plan", icon: <Zap className="w-3 h-3" />, color: "amber" },
  { key: "email", label: "Email Drafts", icon: <Mail className="w-3 h-3" />, color: "indigo" },
  { key: "calendar", label: "Calendar", icon: <Calendar className="w-3 h-3" />, color: "emerald" },
  { key: "scope", label: "Scope Cut", icon: <Scissors className="w-3 h-3" />, color: "rose" },
];

export default function RescueModeComponent({
  tasks,
  onRescueSaved,
  savedRescues,
  onDeleteRescue,
}: RescueModeComponentProps) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [isRescuing, setIsRescuing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RescueTab>("tactical");

  const eligibleTasks = tasks.filter((t) => !t.completed);

  const handleTriggerRescue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !obstacle.trim()) return;

    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return;

    setIsRescuing(true);
    try {
      const response = await fetch("/api/gemini/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          reason: obstacle,
          deadline: task.deadline,
        }),
      });

      if (!response.ok) throw new Error("Rescue beacon lost");
      const data = await response.json();

      const newPlan: RescuePlan = {
        taskId: task.id,
        taskTitle: task.title,
        emergencyPlan: data.emergencyPlan || ["Quick 20-min sprint immediately.", "Focus on core deliverable.", "Polish tomorrow."],
        communicationDrafts: data.communicationDrafts || [],
        calendarBlock: data.calendarBlock || "Block the next 2 hours immediately as 'Deep Sprint' — decline all meetings.",
        scopeReduction: data.scopeReduction || "Cut all non-essential features. Ship the core loop only.",
        rescheduleVibe: data.rescheduleVibe || "Cancel anything that can wait 24 hours.",
      };

      onRescueSaved(newPlan);
      setActivePlanId(task.id);
      setActiveTab("tactical");
      setSelectedTaskId("");
      setObstacle("");
    } catch (err: any) {
      console.error(err);
      alert("Failed to reach emergency rescue signal. Try once more!");
    } finally {
      setIsRescuing(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderTabContent = (wp: RescuePlan, tab: RescueTab) => {
    switch (tab) {
      case "tactical":
        return (
          <div className="space-y-3">
            <ol className="space-y-2 list-none">
              {wp.emergencyPlan.map((step, i) => (
                <li key={i} className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/25 text-[11px] text-red-300 leading-relaxed">
              <span className="font-bold block mb-1 flex items-center gap-1">🗑️ Sacrifice Ritual:</span>
              {wp.rescheduleVibe}
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-3">
            {wp.communicationDrafts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No email drafts generated.</p>
            ) : (
              wp.communicationDrafts.map((draft, idx) => {
                const copyId = `${wp.taskId}-draft-${idx}`;
                const toneColors: Record<string, string> = {
                  "Professional Email": "text-indigo-400",
                  "Strategic & Honest": "text-amber-400",
                  "High-Pressure Pivot": "text-rose-400",
                };
                return (
                  <div key={idx} className="bg-slate-900/80 border border-white/8 rounded-xl p-3.5 relative text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold font-mono text-[9px] uppercase tracking-wider ${toneColors[draft.tone] || "text-slate-400"}`}>
                        {draft.tone}
                      </span>
                      <button
                        onClick={() => handleCopyText(`Subject: ${draft.subject}\n\n${draft.body}`, copyId)}
                        className="flex items-center gap-1 text-[9px] bg-slate-950 py-1 px-2 rounded-md border border-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedIndex === copyId ? (
                          <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                        ) : (
                          <><Copy className="w-3 h-3" /><span>Copy</span></>
                        )}
                      </button>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-100 mb-1.5">Subj: {draft.subject}</div>
                    <pre className="text-[10px] font-sans text-slate-400 whitespace-pre-wrap bg-slate-950/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                      {draft.body}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        );

      case "calendar":
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Suggested Block</span>
              </div>
              <p className="leading-relaxed">{wp.calendarBlock}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-400">
              <span className="block font-mono text-[9px] text-slate-500 uppercase mb-1.5">Quick Calendar Links</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Google Calendar", url: `https://calendar.google.com/calendar/r/eventedit?text=Deep+Sprint:+${encodeURIComponent(wp.taskTitle)}&details=Emergency+focus+block&dur=120` },
                  { label: "Outlook Web", url: `https://outlook.live.com/calendar/0/deeplink/compose?subject=Deep+Sprint:+${encodeURIComponent(wp.taskTitle)}&body=Emergency+focus+block` },
                ].map(({ label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );

      case "scope":
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs leading-relaxed">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-rose-400" />
                <span className="font-mono text-rose-400 text-[10px] uppercase tracking-wider font-bold">Scope Reduction Plan</span>
              </div>
              <p className="text-slate-200 leading-relaxed">{wp.scopeReduction}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-400 italic">
              💡 Remember: A 60% complete submission that ships beats a 100% perfect plan that doesn't.
            </div>
            <button
              onClick={() => handleCopyText(wp.scopeReduction, `${wp.taskId}-scope`)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-mono"
            >
              {copiedIndex === `${wp.taskId}-scope` ? (
                <><Check className="w-3 h-3" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy Scope Plan</>
              )}
            </button>
          </div>
        );
    }
  };

  return (
    <div id="rescue" className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-amber-400" style={{ animation: "spin 12s linear infinite" }} />
          <h2 className="font-serif text-xl font-semibold tracking-wide text-slate-100">
            Emergency Rescue Envoy
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/12 border border-amber-500/25 text-amber-400 font-mono text-[9px] uppercase tracking-wider">
          Multi-Front Rescue
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-5 leading-relaxed relative z-10">
        Stuck? Get <strong className="text-slate-200">parallel rescue</strong> across 4 fronts simultaneously — sprint tactics, email drafts, calendar blocks, and scope cuts.
      </p>

      {eligibleTasks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-950/40 border border-white/5 text-center flex flex-col items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-slate-600" />
          <span className="text-xs text-slate-500 font-mono">No active tasks to rescue. Add some tasks first!</span>
        </div>
      ) : (
        <form onSubmit={handleTriggerRescue} className="flex flex-col gap-3.5 text-xs mb-6 relative z-10">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 font-medium text-[11px] font-mono uppercase tracking-wider">Select Task at Risk</label>
            <select
              required
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="bg-slate-950/70 border border-white/8 p-3 rounded-xl focus:border-amber-400/30 focus:outline-none text-slate-200 text-sm transition-colors"
            >
              <option value="">— Choose endangered task —</option>
              {eligibleTasks.map((t) => {
                const parsedDate = new Date(t.deadline);
                const dateText = isNaN(parsedDate.getTime()) ? "No deadline" : parsedDate.toLocaleDateString();
                return (
                  <option key={t.id} value={t.id}>
                    {t.title} · Due {dateText}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 font-medium text-[11px] font-mono uppercase tracking-wider">What's Blocking You?</label>
            <input
              type="text"
              required
              value={obstacle}
              onChange={(e) => setObstacle(e.target.value)}
              placeholder="e.g. can't focus, ran out of time, unclear requirements, tech blockers..."
              className="bg-slate-950/70 border border-white/8 p-3 rounded-xl focus:border-amber-400/30 focus:outline-none text-slate-200 text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isRescuing || !selectedTaskId || !obstacle.trim()}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-xs"
          >
            {isRescuing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating 4-Front Rescue Plan...</span>
              </>
            ) : (
              <>
                <LifeBuoy className="w-4 h-4" />
                <span>Launch Parallel Rescue Protocol</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Saved Rescue Plans with Tabs */}
      {savedRescues.length > 0 && (
        <div className="space-y-5 relative z-10">
          <h3 className="text-slate-200 font-serif text-base font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Active Rescue Operations
          </h3>

          {savedRescues.map((wp) => (
            <div key={wp.taskId} className="bg-slate-950/60 rounded-2xl border border-amber-500/18 overflow-hidden">
              {/* Plan Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <h4 className="text-amber-400 font-semibold text-sm font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  RE: {wp.taskTitle}
                </h4>
                <button
                  onClick={() => onDeleteRescue(wp.taskId)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  title="Clear rescue plan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5 px-2">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActivePlanId(wp.taskId); setActiveTab(tab.key); }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-all ${
                      activePlanId === wp.taskId && activeTab === tab.key
                        ? `border-amber-400 text-amber-300`
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {renderTabContent(wp, activePlanId === wp.taskId ? activeTab : "tactical")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
