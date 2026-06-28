import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Minus, Trophy, Target, Calendar,
  Sparkles, Loader2, RefreshCw, BarChart3, CheckCircle2, AlertCircle, ArrowRight, Zap
} from "lucide-react";
import { Task, WeeklyInsight } from "../types";
import { ActivityChartCard } from "./ui/activity-chart-card";

interface WeeklyInsightsProps {
  tasks: Task[];
  onClose: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "Every deadline you hit is a vote for the person you're becoming.",
  "Momentum is the compound interest of productivity.",
  "The best time to start was yesterday. The second best time is right now.",
  "Discipline is choosing between what you want now and what you want most.",
  "Done is better than perfect, but done right beats both.",
];

export default function WeeklyInsights({ tasks, onClose }: WeeklyInsightsProps) {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/gemini/weekly-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });

      let patterns: string[] = [];
      try {
        const patternRes = await fetch("/api/gemini/pattern-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedTasks: tasks.filter(t => t.completed) }),
        });
        if (patternRes.ok) {
          const pData = await patternRes.json();
          patterns = pData.patterns || [];
        }
      } catch(e) {}

      if (!response.ok) throw new Error("Failed to load insights");
      const data = await response.json();
      setInsight({ ...data, patterns });
    } catch (err) {
      console.error(err);
      // Fallback computed data
      const completed = tasks.filter(t => t.completed);
      const overdue = tasks.filter(t => !t.completed && new Date(t.deadline).getTime() < Date.now());
      const categoryMap: Record<string, number> = {};
      completed.forEach(t => { categoryMap[t.vibeCategory] = (categoryMap[t.vibeCategory] || 0) + 1; });
      const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

      setInsight({
        completedCount: completed.length,
        overdueCount: overdue.length,
        topCategory,
        avgCompletionHours: 0,
        momentum: "stable",
        aiNarrative: `You've completed ${completed.length} tasks with ${overdue.length} overdue. Keep pushing!`,
        winHighlight: completed.length > 0 ? `Completed "${completed[completed.length - 1]?.title}"` : "No completions yet — time to start!",
        nextWeekFocus: "Prioritize your highest urgency tasks first thing each morning.",
        patterns: ["You tend to build momentum mid-week.", "Focus on quick wins when energy is low."]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueList = tasks.filter(t => !t.completed && new Date(t.deadline).getTime() < Date.now());
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const categoryStats: Record<string, { total: number; done: number }> = {};
  tasks.forEach(t => {
    if (!categoryStats[t.vibeCategory]) categoryStats[t.vibeCategory] = { total: 0, done: 0 };
    categoryStats[t.vibeCategory].total++;
    if (t.completed) categoryStats[t.vibeCategory].done++;
  });

  const getMomentumIcon = (momentum: string) => {
    if (momentum === "accelerating") return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (momentum === "declining") return <TrendingDown className="w-5 h-5 text-rose-400" />;
    return <Minus className="w-5 h-5 text-amber-400" />;
  };

  const getMomentumColor = (momentum: string) => {
    if (momentum === "accelerating") return "text-emerald-400";
    if (momentum === "declining") return "text-rose-400";
    return "text-amber-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl animate-fade-rise">
        <div className="glass-panel-heavy rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="relative p-8 pb-6 border-b border-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Weekly Intelligence Report</span>
                </div>
                <h2 className="font-serif text-3xl font-bold text-white mb-1">
                  Your Vibe Summary
                </h2>
                <p className="text-slate-400 text-sm font-light">
                  AI-powered insights on your deadline management performance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchInsights}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
                  title="Refresh insights"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:border-rose-500/30 transition-all text-sm font-mono"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 italic text-slate-300 text-sm relative">
              <Sparkles className="w-3 h-3 text-amber-400 absolute top-3 right-3" />
              "{quote}"
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-white/5">
            {[
              {
                label: "Completed",
                value: completedTasks.length,
                icon: <CheckCircle2 className="w-4 h-4" />,
                color: "text-green-500",
                bg: "bg-green-500/10 border-green-500/20",
              },
              {
                label: "Active",
                value: pendingTasks.length,
                icon: <Target className="w-4 h-4" />,
                color: "text-yellow-400",
                bg: "bg-yellow-400/10 border-yellow-400/20",
              },
              {
                label: "Overdue",
                value: overdueList.length,
                icon: <AlertCircle className="w-4 h-4" />,
                color: "text-red-500",
                bg: "bg-red-500/10 border-red-500/20",
              },
              {
                label: "Completion %",
                value: `${completionRate}%`,
                icon: <TrendingUp className="w-4 h-4" />,
                color: "text-blue-500",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`p-4 rounded-2xl border ${stat.bg} flex flex-col gap-2 animate-fade-rise`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`flex items-center gap-1.5 ${stat.color} text-[10px] font-mono uppercase tracking-wider`}>
                  {stat.icon}
                  {stat.label}
                </div>
                <div className={`text-2xl md:text-3xl font-serif font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Activity Chart Section */}
          <div className="p-6 border-b border-white/5">
             <div className="w-full">
                <ActivityChartCard
                  title="Weekly Productivity"
                  totalValue={`${completedTasks.length} Tasks`}
                  data={(() => {
                    // Compute real data for the last 7 days
                    const days = ["S", "M", "T", "W", "T", "F", "S"];
                    const today = new Date().getDay();
                    const chartData = [];
                    
                    // Create an array for the last 7 days ending today
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      d.setHours(0, 0, 0, 0);
                      
                      const dayName = days[d.getDay()];
                      const nextDay = new Date(d);
                      nextDay.setDate(nextDay.getDate() + 1);
                      
                      // Count tasks completed on this specific day
                      const value = completedTasks.filter(t => {
                        if (!t.completedAt) return false;
                        const compDate = new Date(t.completedAt).getTime();
                        return compDate >= d.getTime() && compDate < nextDay.getTime();
                      }).length;
                      
                      chartData.push({ day: dayName, value });
                    }
                    
                    // If no tasks were completed at all this week, show a tiny blip for visual aesthetics
                    if (chartData.every(d => d.value === 0)) {
                       return chartData.map(d => ({ ...d, value: 0.1 }));
                    }
                    return chartData;
                  })()}
                />
             </div>
          </div>

          {/* AI Narrative + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            
            {/* Left: AI Report */}
            <div className="space-y-6">
              <h3 className="text-xl font-serif text-slate-100 flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Executive Summary
              </h3>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 glass-panel rounded-3xl border border-white/5">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-sm font-mono text-slate-400 tracking-wider">Gemini is analyzing your week...</span>
                </div>
              ) : insight ? (
                <div className="space-y-4">
                  {/* Momentum */}
                  <div className="relative overflow-hidden p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/5 group hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        {getMomentumIcon(insight.momentum)}
                        <span className={`text-sm font-bold tracking-wide uppercase ${getMomentumColor(insight.momentum)}`}>
                          {insight.momentum} Momentum
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-sans">{insight.aiNarrative}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Win Highlight */}
                    <div className="relative overflow-hidden p-5 rounded-3xl bg-emerald-950/20 backdrop-blur-xl border border-emerald-500/10 group hover:border-emerald-500/20 transition-colors">
                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mb-8 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Win of the Week</span>
                        </div>
                        <p className="text-xs text-emerald-100/70 leading-relaxed">{insight.winHighlight}</p>
                      </div>
                    </div>

                    {/* Next Week Focus */}
                    <div className="relative overflow-hidden p-5 rounded-3xl bg-indigo-950/20 backdrop-blur-xl border border-indigo-500/10 group hover:border-indigo-500/20 transition-colors">
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2.5">
                          <ArrowRight className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Next 7 Days</span>
                        </div>
                        <p className="text-xs text-indigo-100/70 leading-relaxed">{insight.nextWeekFocus}</p>
                      </div>
                    </div>

                    {/* Pattern Insights */}
                    {insight.patterns && insight.patterns.length > 0 && (
                      <div className="relative overflow-hidden p-5 rounded-3xl bg-fuchsia-950/20 backdrop-blur-xl border border-fuchsia-500/10 group hover:border-fuchsia-500/20 transition-colors sm:col-span-2">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-fuchsia-500/20 transition-all duration-700"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-fuchsia-400" />
                            <span className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-wider">Behavioral Patterns</span>
                          </div>
                          <ul className="list-disc pl-4 space-y-2">
                            {insight.patterns.map((p: any, i: number) => (
                              <li key={i} className="text-sm text-fuchsia-100/80 leading-relaxed">
                                {typeof p === 'string' ? p : (
                                  <div>
                                    <span className="font-semibold text-fuchsia-300 block">{p.pattern}</span>
                                    <span className="text-xs text-fuchsia-100/60 block mt-0.5">{p.description}</span>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Category Breakdown */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> Vibe Category Breakdown
              </h3>
              {Object.entries(categoryStats).length === 0 ? (
                <div className="text-xs text-slate-500 font-mono text-center py-8">No tasks added yet</div>
              ) : (
                Object.entries(categoryStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([cat, stat], i) => {
                    const pct = stat.total > 0 ? (stat.done / stat.total) * 100 : 0;
                    const barColor =
                      pct >= 80 ? "bg-emerald-500" :
                      pct >= 50 ? "bg-amber-500" :
                      "bg-rose-500";
                    return (
                      <div
                        key={cat}
                        className="p-3 rounded-xl bg-slate-950/40 border border-white/5 animate-fade-rise"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2 text-xs">
                          <span className="text-slate-300 font-medium">{cat}</span>
                          <span className="font-mono text-slate-400">
                            {stat.done}/{stat.total}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">{Math.round(pct)}% completion rate</div>
                      </div>
                    );
                  })
              )}

              {/* Completion Ring */}
              {tasks.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center gap-4 mt-2">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke={completionRate >= 70 ? "#10b981" : completionRate >= 40 ? "#f59e0b" : "#f43f5e"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${176 * completionRate / 100} 176`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white font-mono">{completionRate}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Overall Rate</span>
                    <p className="text-xs text-slate-200 mt-0.5">
                      {completionRate >= 70 ? "Crushing it this week! 🔥" :
                       completionRate >= 40 ? "Steady progress. Keep pushing!" :
                       "Time to shift gears and accelerate."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-[10px] text-slate-600 font-mono">
              Built with Google AI Studio & Gemini for Vibe2Ship Hackathon 2026 · Weekly insights powered by Gemini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
