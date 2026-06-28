import React from "react";
import { Sliders, Activity, Sparkles, TrendingUp, RefreshCw, BarChart2, CheckCircle, Flame, Zap, Target, Moon, AlertTriangle, Coffee } from "lucide-react";
import { Task } from "../types";

interface MoodStatsProps {
  tasks: Task[];
  energyLevel: number;
  setEnergyLevel: (p: number) => void;
  selectedMood: string;
  setSelectedMood: (m: string) => void;
  onClearHistory: () => void;
}

const MOODS = [
  { icon: Zap, label: "Hyperfocus", color: "text-blue-500" },
  { icon: Target, label: "Calm Deep State", color: "text-green-500" },
  { icon: Moon, label: "Snooze/Fatigued", color: "text-yellow-400" },
  { icon: AlertTriangle, label: "Panicking", color: "text-red-500" },
  { icon: Coffee, label: "Food Coma", color: "text-blue-400" }
];

export default function MoodStats({
  tasks,
  energyLevel,
  setEnergyLevel,
  selectedMood,
  setSelectedMood,
  onClearHistory
}: MoodStatsProps) {
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const totalCompleted = completedTasks.length;
  
  // Dynamic Focus score out of 100
  let focusScore = 50;
  if (selectedMood === "Hyperfocus") focusScore += 25;
  if (selectedMood === "Calm Deep State") focusScore += 20;
  if (selectedMood === "Snooze/Fatigued") focusScore -= 20;
  if (selectedMood === "Panicking") focusScore -= 10;
  
  // Adjust with task ratio
  if (tasks.length > 0) {
    const ratio = completedTasks.length / tasks.length;
    focusScore += Math.round(ratio * 30);
  }
  // Clamp
  focusScore = Math.max(10, Math.min(100, focusScore));

  // Compute Streak
  const daysWithCompletions = new Set(
    completedTasks
      .filter(t => t.completedAt)
      .map(t => new Date(t.completedAt!).toDateString())
  );
  const streak = daysWithCompletions.size;
  
  // Compute Completion Rate This Week
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentTasks = tasks.filter(t => new Date(t.deadline).getTime() > oneWeekAgo);
  const recentCompleted = recentTasks.filter(t => t.completed).length;
  const completionRate = recentTasks.length > 0 ? Math.round((recentCompleted / recentTasks.length) * 100) : 0;

  let momentumMsg = "Let's break the inertia!";
  if (completionRate > 80) momentumMsg = "You're absolutely on fire!";
  else if (completionRate > 50) momentumMsg = "Solid momentum. Keep it up!";
  else if (completionRate > 0) momentumMsg = "Building rhythm. Push for the next win.";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      
      {/* Vibe & Energy Selector Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 relative flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <Sliders className="w-4 h-4 text-blue-500" />
            <h3 className="font-serif text-base font-semibold text-slate-200">Daily Vibe Engine</h3>
          </div>

          {/* Emoji Mood selectors */}
          <span className="text-slate-400 uppercase font-mono text-[9px] tracking-wider block mb-2">My State:</span>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setSelectedMood(m.label)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  selectedMood === m.label
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400 scale-105"
                    : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200"
                }`}
                title={m.label}
              >
                <m.icon className={`w-5 h-5 ${selectedMood === m.label ? m.color : 'text-slate-500'}`} />
                <span className="text-[8px] font-mono mt-1 text-center truncate w-full">{m.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Energy level slider */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Energy Charge:</span>
              <span className="text-blue-500 font-bold">{energyLevel}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="text-[10px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 leading-relaxed font-mono">
          <span className="text-blue-500 font-bold">Vibe Report:</span> {
            selectedMood === "Hyperfocus" ? "Unstoppable momentum. Prime for complex algorithmic deep work."
            : selectedMood === "Calm Deep State" ? "Perfect mental clarity. Execute meticulous task refinements."
            : selectedMood === "Snooze/Fatigued" ? "Low physical state. Switch model output trigger to 'Quick Wins'."
            : selectedMood === "Panicking" ? "High cortisol. Use 'Ignition Mode' 5-min intervals immediately."
            : "Post-nutrient lull. Reschedule deep architectural specs."
          }
        </div>
      </div>

      {/* Focus Score & Overall Statistics Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 relative flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2 justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <h3 className="font-serif text-base font-semibold text-slate-200">Focus Scoreboard</h3>
            </div>
            <button
              onClick={onClearHistory}
              title="Reset task cache"
              className="px-2 py-0.5 rounded-md hover:bg-slate-900 border border-white/5 text-[9px] font-mono text-slate-500 hover:text-red-500 cursor-pointer"
            >
              Reset Cache
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Pending</span>
              <div className="text-xl md:text-2xl font-serif text-yellow-400 mt-1">{pendingTasks.length}</div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Completed</span>
              <div className="text-xl md:text-2xl font-serif text-green-500 mt-1">{totalCompleted}</div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 relative overflow-hidden group cursor-default">
              <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-full blur-xl" />
              <span className="text-[10px] font-mono text-slate-500 uppercase">Streak</span>
              <div className="text-xl md:text-2xl font-serif text-blue-400 mt-1 flex justify-center items-center gap-1">
                {streak} <TrendingUp className="w-4 h-4 text-blue-500/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Big circular focus score and message */}
        <div className="flex items-center gap-4 bg-slate-950/30 p-3.5 rounded-2xl border border-white/5">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full border-2 border-blue-500/20 bg-slate-950/80">
            <span className="text-lg font-serif font-bold text-blue-500">{focusScore}%</span>
            <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" style={{ animationDuration: "3s" }}></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Focus Index</span>
              <span className="text-[9px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{completionRate}% done</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-1">
              {momentumMsg}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
