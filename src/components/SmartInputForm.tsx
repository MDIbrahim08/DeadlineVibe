import React, { useState } from "react";
import { Sparkles, Mic, Loader2, Plus, Calendar, Flame } from "lucide-react";
import { Task } from "../types";
import { AIInputWithLoading } from "./ui/ai-input-with-loading";

interface SmartInputFormProps {
  onTasksAdded: (newTasks: Omit<Task, "id" | "completed">[]) => void;
  currentMood: string;
}

export default function SmartInputForm({ onTasksAdded, currentMood }: SmartInputFormProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "brain">("brain");
  const [isParsing, setIsParsing] = useState(false);
  const [brainDump, setBrainDump] = useState("");
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);

  // Manual task state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [vibeCategory, setVibeCategory] = useState<Task["vibeCategory"]>("Deep Work");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedDeadline = deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    onTasksAdded([{
      title,
      description,
      deadline: formattedDeadline,
      vibeCategory,
    }]);

    // Reset standard form
    setTitle("");
    setDescription("");
    setDeadline("");
    setVibeCategory("Deep Work");
  };

  // Pure JS date parser â€” ZERO AI involvement. Prevents all hallucinations.
  const parseDeadlineFromText = (text: string): string => {
    const now = new Date();
    const lower = text.toLowerCase();

    // Build the base date (which day)
    let baseDate = new Date(now);
    if (lower.includes("tomorrow")) {
      baseDate.setDate(now.getDate() + 1);
    } else if (lower.match(/\bnext week\b/)) {
      baseDate.setDate(now.getDate() + 7);
    }
    // "today" or no date modifier â†’ stay on today

    // Extract time (e.g. "6:30 pm", "6pm", "18:30", "9am")
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || "0");
      const meridiem = timeMatch[3];
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
      baseDate.setHours(hours, minutes, 0, 0);
    } else {
      // No time found, default to 11:59 PM
      baseDate.setHours(23, 59, 0, 0);
    }

    return baseDate.toISOString();
  };

  const handleBrainDumpSubmit = async (value: string) => {
    if (!value.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/gemini/parse-smart-input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brainDump: value,
          referenceTime: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Parser failed");
      }
      const data = await res.json();
      
      if (data.tasks && data.tasks.length > 0) {
        // OVERRIDE any AI-generated deadline with our reliable JS parser
        const correctedTasks = data.tasks.map((task: any) => ({
          ...task,
          deadline: parseDeadlineFromText(value),
        }));
        onTasksAdded(correctedTasks);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "AI was unable to process your request."}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Simulating Voice Recording Transcription
  const handleSimulateVoice = () => {
    setIsSimulatingVoice(true);
    const phrases = [
      "Submit final prototype specification tomorrow morning at 9am. It is very hard.",
      "Finish accounting slides tonight by 10pm, category is admin hustle.",
      "Check with team at 4pm for the Vibe2Ship hackathon planning, write documentation.",
      "Need to buy milk and text sister for her graduation tonight at 8!"
    ];
    const speech = phrases[Math.floor(Math.random() * phrases.length)];
    
    let currentText = "";
    let index = 0;
    const interval = setInterval(() => {
      if (index < speech.length) {
        currentText += speech[index];
        setBrainDump(currentText);
        index++;
      } else {
        clearInterval(interval);
        setIsSimulatingVoice(false);
      }
    }, 30);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
      
      {/* Decorative Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-400 animate-pulse" />
          <h2 className="font-serif text-xl font-semibold tracking-wide">
            Ignite A Task
          </h2>
        </div>
        <div className="flex gap-2 bg-slate-950/60 p-1 rounded-full border border-white/5">
          <button
            onClick={() => setActiveTab("brain")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === "brain"
                ? "bg-rose-600/20 border border-rose-500/30 text-rose-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Smart Brain-Dump
          </button>
          <button
            onClick={() => setActiveTab("standard")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === "standard"
                ? "bg-rose-600/20 border border-rose-500/30 text-rose-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Structured Input
          </button>
        </div>
      </div>

      {activeTab === "brain" ? (
        <div className="flex flex-col gap-4">
          <AIInputWithLoading 
            value={brainDump}
            onChange={setBrainDump}
            onSubmit={handleBrainDumpSubmit}
            loadingDuration={3000}
            placeholder="Dump your tasks in chaotic sentences. Example: 'Finish the Vibe2Ship deck by noon...'"
            className="!py-0"
          />

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={handleSimulateVoice}
              disabled={isParsing || isSimulatingVoice}
              title="Simulate Voice Transcription with AI"
              className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-1.5 font-mono"
            >
              {isSimulatingVoice ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Simulate Voice</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 font-mono max-w-[250px] text-right">
              Pro-Tip: AI will estimate priority, category, deadline, subtasks, and 5-min ignition acts instantly.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Finish the pitch decks..."
                className="bg-slate-950/70 border border-white/10 p-3 rounded-xl focus:border-rose-400/30 focus:outline-none text-slate-200 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Target Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-slate-950/70 border border-white/10 p-3 rounded-xl focus:border-rose-400/30 focus:outline-none text-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Vibe Category</label>
              <select
                value={vibeCategory}
                onChange={(e) => setVibeCategory(e.target.value as Task["vibeCategory"])}
                className="bg-slate-950/70 border border-white/10 p-3 rounded-xl focus:border-rose-400/30 focus:outline-none text-slate-200 text-sm"
              >
                <option value="Deep Work">ðŸ§  Deep Work</option>
                <option value="Admin Hustle">ðŸ’¼ Admin Hustle</option>
                <option value="Creative Flow">ðŸŽ¨ Creative Flow</option>
                <option value="Quick Win">âš¡ Quick Win</option>
                <option value="Personal">ðŸ¡ Personal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Details / Context</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include key links, requirements, or hurdles"
                className="bg-slate-950/70 border border-white/10 p-3 rounded-xl focus:border-rose-400/30 focus:outline-none text-slate-200 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task & Auto-Analyze</span>
          </button>
        </form>
      )}
    </div>
  );
}
