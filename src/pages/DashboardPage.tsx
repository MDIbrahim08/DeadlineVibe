import React, { useState } from "react";
import MoodStats from "../components/MoodStats";
import { Task } from "../types";
import { Zap } from "lucide-react";
import { ElitePlanCard } from "../components/ui/elite-plan-card";
import { StackedCardsInteraction } from "../components/ui/stacked-cards-interaction";

// Extracted so useState hook is called at the top-level of a component
function SimulateButton({ onSimulateReminder, firstTask }: { onSimulateReminder: any; firstTask: Task }) {
  const [tip, setTip] = useState(false);
  return (
    <div className="relative self-start sm:self-auto">
      <button
        onClick={() => onSimulateReminder && onSimulateReminder(firstTask)}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
      >
        <Zap className="w-3.5 h-3.5" /> Simulate AI Reminder
      </button>
      {tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] w-[230px] px-3 py-2 text-[11px] text-slate-200 bg-slate-800 border border-white/10 rounded-lg shadow-2xl text-center leading-snug pointer-events-none">
          Triggers a demo reminder popup — hit Snooze and the AI instantly drafts your task for you!
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({
  tasks,
  setTasks,
  energyLevel,
  setEnergyLevel,
  selectedMood,
  setSelectedMood,
  handleToggleSubtaskComplete,
  handleShipIt,
  shipItLoadingId,
  handleStartIgnition,
  handleCompleteTask,
  handleDeleteTask,
  userName,
  onSimulateReminder,
}: any) {
  const activeTasks = tasks.filter((t: Task) => !t.completed);
  const completedTasks = tasks.filter((t: Task) => t.completed);

  return (
    <div className="flex flex-col gap-8 relative z-10 w-full animate-fade-in-up max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl text-slate-100">Control Center</h1>
        <p className="text-slate-400 font-sans">Your proactive overview of active obligations and momentum.</p>
      </div>

      {/* Top Stats Row */}
      <div className="w-full">
        <MoodStats
          tasks={tasks}
          energyLevel={energyLevel}
          setEnergyLevel={setEnergyLevel}
          selectedMood={selectedMood}
          setSelectedMood={setSelectedMood}
          onClearHistory={() => {}}
        />
      </div>

      {/* Main Task List */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-serif text-slate-100 flex items-center gap-2">
            Active Deadlines
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-sans">{activeTasks.length}</span>
          </h2>
          {activeTasks.length > 0 && (
            <SimulateButton onSimulateReminder={onSimulateReminder} firstTask={activeTasks[0]} />
          )}
        </div>

        <div className="space-y-4">
          {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 px-4 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-1">You're all clear</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  No active deadlines. Tap a card below to explore a feature.
                </p>
              </div>
              <StackedCardsInteraction
                cards={[
                  {
                    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
                    title: "Chat with AI",
                    description: "Tell the AI your task in plain English. It extracts the deadline and registers the task for you.",
                    href: "/chat",
                  },
                  {
                    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop",
                    title: "Shrink Scope",
                    description: "Running out of time? AI strips your task to the minimum viable deliverable you can still ship.",
                    href: "/dashboard",
                  },
                  {
                    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
                    title: "Emergency Rescue",
                    description: "Already late? Get a professional extension email and a focused sprint plan in seconds.",
                    href: "/rescue",
                  },
                ]}
              />
            </div>
          ) : (
            activeTasks.map((task: Task) => (
              <ElitePlanCard
                key={task.id}
                task={task}
                shipItLoadingId={shipItLoadingId}
                onStartIgnition={handleStartIgnition}
                onShipIt={handleShipIt}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onSimulateReminder={onSimulateReminder}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
