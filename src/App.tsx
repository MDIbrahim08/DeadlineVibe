import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Timer,
  Zap,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  Pause,
  CheckSquare,
  Sparkles,
  ShieldAlert,
  Volume2,
  VolumeX,
  Home,
  Loader2,
  ListTodo,
  Rocket,
  BarChart3,
  Quote,
  X,
} from "lucide-react";

import { Task, RescuePlan } from "./types";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import InsightsPage from "./pages/InsightsPage";
import HomePage from "./pages/HomePage";
import { AutoPilotModal } from "./components/ui/auto-pilot-modal";

// Auth Guard Component
const RequireAuth = ({ session, children }: { session: any, children: React.ReactNode }) => {
  if (session === undefined) return <div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>; // loading state
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const IGNITION_QUOTES = [
  "The next 5 minutes will determine the next 5 hours. Start now.",
  "You don't have to feel motivated to take action. Action creates motivation.",
  "Stop waiting for the right moment. The moment is right now.",
  "Procrastination is the gap between intention and action. Close it.",
  "Every minute you delay costs you two minutes of panic later.",
  "Your future self is watching. Don't let them down.",
  "The hardest part is starting. Everything after that is momentum.",
  "Clarity comes from engagement, not thought. Begin.",
];

export default function App() {
  const [session, setSession] = useState<any>(undefined); // start undefined to show loading
  const [showWeeklyInsights, setShowWeeklyInsights] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savedRescues, setSavedRescues] = useState<RescuePlan[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(75);
  const [selectedMood, setSelectedMood] = useState<string>("Calm Deep State");
  const [analyzingTaskIds, setAnalyzingTaskIds] = useState<string[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);  // Vibe Ignition Timer
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [activeReminderTask, setActiveReminderTask] = useState<Task | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(300);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [currentIgnitionQuote, setCurrentIgnitionQuote] = useState<string>("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Focus sound
  const [isAmbientSoundOn, setIsAmbientSoundOn] = useState<boolean>(false);
  const whiteNoiseAudioRef = useRef<HTMLAudioElement | null>(null);

  // Ship It state
  const [shipItLoadingId, setShipItLoadingId] = useState<string | null>(null);

  // Auto-Schedule state
  const [isScheduling, setIsScheduling] = useState(false);

  // Auth state listener
  useEffect(() => {
    import("./lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    });
  }, []);

  // Load state from localStorage or Supabase
  useEffect(() => {
    const loadTasks = async () => {
      if (session) {
        // Load from Supabase
        const { supabase } = await import("./lib/supabase");
        const { data, error } = await supabase.from('tasks').select('*').order('deadline', { ascending: true });
        
        if (error) {
          console.error("Error loading tasks from Supabase:", error);
        } else if (data && data.length > 0) {
          setTasks(data as Task[]);
          return;
        }
      }
      
      // Fallback to localStorage if no session or Supabase is empty
      try {
        const storedTasks = localStorage.getItem("deadline_vibe_tasks");
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    };
    
    if (session !== undefined) {
      loadTasks();
    }
  }, [session]);

  const saveTasksToStorage = async (newTasks: Task[]) => {
    // Find newly added task to sync to calendar
    const addedTask = newTasks.length > tasks.length ? newTasks[newTasks.length - 1] : null;
    
    setTasks(newTasks);
    localStorage.setItem("deadline_vibe_tasks", JSON.stringify(newTasks));
    
    if (session) {
      const { supabase } = await import("./lib/supabase");
      const tasksWithUser = newTasks.map(t => ({ ...t, user_id: session.user.id }));
      const { error } = await supabase.from('tasks').upsert(tasksWithUser);
      if (error) console.error("Error saving tasks to Supabase:", error);

      // Google Calendar Sync
      if (addedTask && addedTask.deadline) {
        if (!session.provider_token) {
          console.warn("Missing Google Calendar token. User must re-authenticate.");
          alert("Could not sync to Google Calendar: Your Google connection expired. Please click 'Sync Google Calendar' in the navbar to refresh it!");
        } else {
          try {
            const startTime = new Date(addedTask.deadline).toISOString();
            const endTime = new Date(new Date(addedTask.deadline).getTime() + 60 * 60 * 1000).toISOString();
            
            const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${session.provider_token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                summary: `[DeadlineVibe] ${addedTask.title}`,
                description: addedTask.description,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
                colorId: "11", // Red color for deadlines
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'popup', minutes: 10 },
                    { method: 'popup', minutes: 60 },
                    { method: 'email', minutes: 24 * 60 }
                  ]
                }
              })
            });
            if (!res.ok) {
              const errorText = await res.text();
              console.error("Calendar sync failed:", errorText);
              alert("Failed to sync with Google Calendar. Your session may have expired. Please click 'Sync Google Calendar' again.");
            } else {
              console.log("Task synced to Google Calendar!");
            }
          } catch (calError) {
            console.error("Google Calendar Sync failed:", calError);
          }
        }
      }
    }
  };

  const saveRescuesToStorage = async (newRescues: RescuePlan[]) => {
    setSavedRescues(newRescues);
    localStorage.setItem("deadline_vibe_rescues", JSON.stringify(newRescues));
    
    if (session) {
      const { supabase } = await import("./lib/supabase");
      const rescuesWithUser = newRescues.map(r => ({ ...r, user_id: session.user.id }));
      const { error } = await supabase.from('rescues').upsert(rescuesWithUser);
      if (error) console.error("Error saving rescues to Supabase:", error);
    }
  };

  // Focus sound
  useEffect(() => {
    if (isAmbientSoundOn) {
      if (!whiteNoiseAudioRef.current) {
        const audio = new Audio("https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_114352_949ef9b0-9f5e-4bb0-b7dc-82558f69b829.mp3");
        audio.loop = true;
        whiteNoiseAudioRef.current = audio;
      }
      whiteNoiseAudioRef.current.play().catch(() => {});
    } else {
      whiteNoiseAudioRef.current?.pause();
    }
    return () => { whiteNoiseAudioRef.current?.pause(); };
  }, [isAmbientSoundOn]);

  // Timer countdown
  useEffect(() => {
    if (timerIsRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerIsRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Complete sound notification (visual for now)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [timerIsRunning]);

  // Rotate ignition quote every 90s while timer is running
  useEffect(() => {
    if (!timerIsRunning) return;
    const rotate = () => setCurrentIgnitionQuote(IGNITION_QUOTES[Math.floor(Math.random() * IGNITION_QUOTES.length)]);
    rotate();
    const interval = setInterval(rotate, 90000);
    return () => clearInterval(interval);
  }, [timerIsRunning]);

  const handleStartIgnition = (task: Task) => {
    setActiveTimerTaskId(task.id);
    setTimerSecondsLeft(300);
    setTimerIsRunning(true);
    setExpandedTaskId(task.id);
    setIsAmbientSoundOn(true);
    setCurrentIgnitionQuote(IGNITION_QUOTES[Math.floor(Math.random() * IGNITION_QUOTES.length)]);
  };

  const analyzeTaskWithAI = async (task: Task) => {
    setAnalyzingTaskIds((prev) => [...prev, task.id]);
    try {
      const response = await fetch("/api/gemini/analyze-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          vibeCategory: task.vibeCategory,
        }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      
      const rescuePlan: RescuePlan = { ...data, taskId: task.id };
      const newSaved = [...savedRescues, rescuePlan];
      saveRescuesToStorage(newSaved);
      
      const audio = new Audio("https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_114316_b37abfc4-d035-4673-8eb1-561b3cd9dd8e.mp3");
      audio.play().catch(()=>console.error("Audio block"));

      const updatedTasks = tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              priority: data.priority || "medium",
              funReasoning: data.funReasoning || "Deadline standing by!",
              microAction: data.microAction || "Start with a 5-min outline now.",
              moodColor: data.moodColor || "indigo",
              subtasks: data.subtasks?.map((st: any, i: number) => ({
                id: `${task.id}-sub-${i}`,
                title: st.title,
                completed: false,
                estimatedMinutes: st.estimatedMinutes || 10,
              })) || [],
            }
          : t
      );
      saveTasksToStorage(updatedTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingTaskIds((prev) => prev.filter((id) => id !== task.id));
    }
  };

  // ── One-Click Ship It ──────────────────────────────────────────────────────


  const handleShipIt = async (task: Task) => {
    setShipItLoadingId(task.id);
    try {
      const response = await fetch("/api/gemini/ship-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          subtasks: task.subtasks || [],
        }),
      });
      if (!response.ok) throw new Error("Ship It failed");
      const data = await response.json();
      const updatedTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, shipItPlan: data.shipItPlan, shipItProof: data.shipItProof, shipItMessage: data.shipItMessage } : t
      );
      saveTasksToStorage(updatedTasks);
      setExpandedTaskId(task.id); // auto-expand to show the plan
    } catch (e) {
      console.error(e);
      alert("Failed to generate Ship It plan. Check your API key!");
    } finally {
      setShipItLoadingId(null);
    }
  };

  // ── Auto-Schedule ──────────────────────────────────────────────────────────
  const handleSmartSchedule = async () => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) return;
    setIsScheduling(true);
    try {
      const response = await fetch("/api/gemini/smart-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          currentMood: selectedMood,
          energyLevel
        }),
      });
      if (!response.ok) throw new Error("Scheduling failed");
      const data = await response.json();
      
      const updatedTasks = tasks.map(t => {
        const scheduleData = data.scheduledTasks?.find((st: any) => st.id === t.id);
        if (scheduleData) {
          return { ...t, suggestedTimeBlock: scheduleData.suggestedTimeBlock };
        }
        return t;
      });
      saveTasksToStorage(updatedTasks);
    } catch (e) {
      console.error(e);
      alert("Smart scheduling failed. Check backend.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleTasksAdded = (newTasks: Omit<Task, "id" | "completed">[]) => {
    const tasksToInsert: Task[] = newTasks.map((nt) => ({
      ...nt,
      id: "task-" + Math.random().toString(36).substr(2, 9),
      completed: false,
      priority: "medium",
      funReasoning: "Ignition workflow starting...",
      microAction: "Draft an initial outline in 5 minutes.",
      moodColor: "indigo",
      subtasks: [],
    }));
    const combined = [...tasksToInsert, ...tasks];
    saveTasksToStorage(combined);
    tasksToInsert.forEach((t) => analyzeTaskWithAI(t));
  };

  const handleCompleteTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    );
    saveTasksToStorage(updated);
  };

  const handleToggleSubtaskComplete = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId && t.subtasks
        ? { ...t, subtasks: t.subtasks.map((st) => st.id === subtaskId ? { ...st, completed: !st.completed } : st) }
        : t
    );
    saveTasksToStorage(updated);
  };

  const handleDeleteTask = async (id: string) => {
    saveTasksToStorage(tasks.filter((t) => t.id !== id));
    saveRescuesToStorage(savedRescues.filter((r) => r.taskId !== id));
    if (activeTimerTaskId === id) { setActiveTimerTaskId(null); setTimerIsRunning(false); }
    
    if (session) {
      const { supabase } = await import("./lib/supabase");
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) console.error("Error deleting task in Supabase:", error);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Reset all tasks and rescues to defaults?")) {
      localStorage.removeItem("deadline_vibe_tasks");
      localStorage.removeItem("deadline_vibe_rescues");
      window.location.reload();
    }
  };

  const formatTimerString = () => {
    const mins = Math.floor(timerSecondsLeft / 60);
    const secs = timerSecondsLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerProgress = () => ((300 - timerSecondsLeft) / 300) * 100;

  const handleStopIgnition = () => {
    setActiveTimerTaskId(null);
    setTimerIsRunning(false);
  };

  const handleAutoPilotSnooze = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      const res = await fetch("/api/gemini/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title, description: task.description })
      });
      const data = await res.json();
      if (data.draft) {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, autoPilotDraft: data.draft } : t);
        saveTasksToStorage(updatedTasks);
      }
    } catch(e) { console.error(e); }
    setActiveReminderTask(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        
        <Route element={<RequireAuth session={session}><Layout isAmbientSoundOn={isAmbientSoundOn} setIsAmbientSoundOn={setIsAmbientSoundOn} /></RequireAuth>}>
          <Route path="/" element={<HomePage activeTasksCount={tasks.filter((t: any) => !t.completed).length} userName={session?.user?.user_metadata?.name || 'Viber'} />} />
          <Route path="/chat" element={
            <ChatPage
              tasks={tasks}
              setTasks={setTasks}
              savedRescues={savedRescues}
              setSavedRescues={setSavedRescues}
              saveTasksToLocalStorage={saveTasksToStorage}
              saveRescuesToLocalStorage={saveRescuesToStorage}
            />
          } />

          <Route path="/dashboard" element={
            <DashboardPage
              tasks={tasks}
              setTasks={setTasks}
              savedRescues={savedRescues}
              setSavedRescues={setSavedRescues}
              energyLevel={energyLevel}
              setEnergyLevel={setEnergyLevel}
              selectedMood={selectedMood}
              setSelectedMood={setSelectedMood}
              handleToggleSubtaskComplete={handleToggleSubtaskComplete}
              handleShipIt={handleShipIt}
              shipItLoadingId={shipItLoadingId}
              saveTasksToLocalStorage={saveTasksToStorage}
              saveRescuesToLocalStorage={saveRescuesToStorage}
              handleStartIgnition={handleStartIgnition}
              handleCompleteTask={handleCompleteTask}
              handleDeleteTask={handleDeleteTask}
              userName={session?.user?.user_metadata?.name || 'Viber'}
              onSimulateReminder={(task) => setActiveReminderTask(task)}
            />
          } />
          <Route path="/insights" element={<InsightsPage tasks={tasks} />} />
        </Route>
      </Routes>

      {/* Global Timer Overlay */}
      {activeTimerTaskId && timerIsRunning && (
        <div className="fixed bottom-6 right-6 w-80 glass-panel-heavy rounded-2xl p-5 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)] z-50 animate-fade-in-up">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-rose-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <h3 className="font-bold text-sm tracking-widest uppercase">Vibe Ignition</h3>
            </div>
            <button onClick={handleStopIgnition} className="text-slate-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-4xl font-mono font-bold text-white tracking-tighter my-3">
            {formatTime(timerSecondsLeft)}
          </div>
          <p className="text-xs text-rose-300/80 italic line-clamp-2">"{currentIgnitionQuote}"</p>
        </div>
      )}

      {/* Auto-Pilot Modal */}
      <AutoPilotModal 
        task={activeReminderTask}
        isOpen={!!activeReminderTask}
        onAccept={() => setActiveReminderTask(null)}
        onSnooze={handleAutoPilotSnooze}
        onClose={() => setActiveReminderTask(null)}
      />

    </BrowserRouter>
  );
}
