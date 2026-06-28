import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Check, BrainCircuit, X } from 'lucide-react';
import { Task } from '../../types';

interface AutoPilotModalProps {
  task: Task | null;
  isOpen: boolean;
  onAccept: () => void;
  onSnooze: (taskId: string) => Promise<void>;
  onClose: () => void;
}

export function AutoPilotModal({ task, isOpen, onAccept, onSnooze, onClose }: AutoPilotModalProps) {
  const [isSnoozing, setIsSnoozing] = useState(false);

  if (!task) return null;

  const handleSnooze = async () => {
    setIsSnoozing(true);
    await onSnooze(task.id);
    setIsSnoozing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: 'linear-gradient(145deg, #0f1a2e 0%, #0a0f1e 100%)' }}
          >
            {/* ── Hero image / gradient banner ── */}
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-indigo-600/30 to-purple-700/20" />
              {/* Animated orbs */}
              <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
              <div className="absolute -bottom-4 -right-4 w-28 h-28 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
              {/* Clock icon center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                  <Clock className="w-7 h-7 text-blue-300" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-mono text-blue-300/70 uppercase tracking-[0.2em]">Deadline Approaching</p>
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={isSnoozing}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Card body ── */}
            <div className="p-6 -mt-1">
              {/* Top accent line */}
              <div className="w-12 h-[2px] bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mb-4" />

              {/* Task info */}
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1">Task Reminder</p>
              <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-slate-400 text-[13px] leading-relaxed line-clamp-2">{task.description}</p>
              )}

              <div className="mt-6 space-y-3">
                {isSnoozing ? (
                  /* ── Loading state ── */
                  <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin" />
                      <div className="absolute inset-0 rounded-full border-r-2 border-indigo-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-blue-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">AI Auto-Pilot Active</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">Drafting your task right now…</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Accept */}
                    <button
                      onClick={onAccept}
                      className="w-full flex items-center justify-center gap-2 py-[11px] px-5 rounded-xl font-medium text-[13px] text-white/90 bg-white/[0.07] hover:bg-white/[0.11] border border-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      I'll handle it myself
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/[0.05]" />
                      <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                    </div>

                    {/* Snooze & Auto-Pilot */}
                    <button
                      onClick={handleSnooze}
                      className="w-full flex items-center justify-center gap-2 py-[11px] px-5 rounded-xl font-medium text-[13px] text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-white/[0.08] hover:border-white/[0.14] transition-all duration-200"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      Snooze — AI will draft it for me
                    </button>
                    <p className="text-center text-[11px] text-slate-600 leading-relaxed">
                      AI drafts this task while you relax. Review &amp; submit when ready.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ── Bottom pill tag ── */}
            <div className="px-6 pb-5">
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">DeadlineVibe Auto-Pilot</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
