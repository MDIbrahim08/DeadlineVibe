import React from "react";
import { Task } from "../types";
import { Zap, Timer, BrainCircuit } from "lucide-react";

export default function TasksPage({
  tasks,
  handleToggleSubtaskComplete,
  handleShipIt,
  handleStartIgnition,
  shipItLoadingId,
}: any) {
  return (
    <div className="animate-fade-in-up w-full max-w-5xl mx-auto py-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="font-serif text-4xl text-slate-100">Prioritized Deadlines</h1>
        <p className="text-slate-400 text-sm">Tasks sorted by urgency. Attack the most critical ones first.</p>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="p-10 text-center border border-dashed border-white/5 rounded-2xl">
            <p className="text-slate-500 italic text-sm">No active deadlines. Enjoy the calm.</p>
          </div>
        )}
        {tasks.map((task: Task, idx: number) => {
          const deadline = new Date(task.deadline);
          const hoursLeft = (deadline.getTime() - Date.now()) / 3600000;
          const isOverdue = hoursLeft < 0;
          const isUrgent = hoursLeft >= 0 && hoursLeft < 24;
          const isLoading = shipItLoadingId === task.id;

          return (
            <div
              key={task.id}
              className="relative overflow-hidden rounded-2xl bg-[#0c1222] border border-white/[0.06] hover:border-white/10 transition-all duration-200"
            >
              {/* Priority rank accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : '#6366f1' }} />

              <div className="pl-5 pr-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Rank badge */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                  isOverdue ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                  isUrgent  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}>
                  {idx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[15px] text-white">{task.title}</h3>
                    {isOverdue && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
                        Overdue
                      </span>
                    )}
                    {isUrgent && !isOverdue && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        Due Soon
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[13px] mt-0.5 line-clamp-1">{task.description}</p>
                  <p className={`text-[11px] font-mono mt-1 ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                    {isOverdue
                      ? `Overdue by ${Math.abs(Math.round(hoursLeft))}h`
                      : `${Math.round(hoursLeft)}h remaining — ${deadline.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                    }
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartIgnition(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-white/[0.06] hover:border-white/10 rounded-lg transition-all"
                  >
                    <Timer className="w-3.5 h-3.5" /> Focus
                  </button>
                  <button
                    onClick={() => handleShipIt(task)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 rounded-lg border border-indigo-500/30 transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                  >
                    {isLoading
                      ? <><BrainCircuit className="w-3.5 h-3.5 animate-pulse" /> Analyzing…</>
                      : <><Zap className="w-3.5 h-3.5" /> Shrink Scope</>
                    }
                  </button>
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="pl-5 pr-5 pb-4 border-t border-white/[0.04] pt-3">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Milestones</p>
                  <div className="flex flex-wrap gap-2">
                    {task.subtasks.map((st: any) => (
                      <label key={st.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtaskComplete(task.id, st.id)}
                          className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-900 w-3 h-3"
                        />
                        <span className={`text-[12px] ${st.completed ? "line-through text-slate-600" : "text-slate-400"}`}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
