import React, { useState, useRef, useEffect } from "react";
import { Ghost, ShieldAlert, Zap, Plus, FileWarning, User, Bot, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Task, RescuePlan } from "../types";
import RuixenQueryBox from "@/components/ui/ruixen-query-box";
import { supabase } from "../lib/supabase";
import { GlassButton } from "../components/ui/sign-up";

// Pre-warm the browser TTS voices
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

interface ChatPageProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  savedRescues: RescuePlan[];
  setSavedRescues: React.Dispatch<React.SetStateAction<RescuePlan[]>>;
  saveTasksToLocalStorage: (tasks: Task[]) => void;
  saveRescuesToLocalStorage: (rescues: RescuePlan[]) => void;
}

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  isTyping?: boolean;
  extractedTask?: Task;
}

export default function ChatPage({
  tasks,
  setTasks,
  savedRescues,
  setSavedRescues,
  saveTasksToLocalStorage,
  saveRescuesToLocalStorage,
}: ChatPageProps) {
  const defaultInitialMessage: Message = {
    id: "init",
    role: "bot",
    text: "I am your AI Deadline Bodyguard. Type normally for coaching, or use `/dump [text]` to auto-create tasks, and `/rescue [task]` to generate extension emails. How can I protect your time today?",
  };
  const [messages, setMessages] = useState<Message[]>([defaultInitialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChats = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setMessages(data.map(d => ({
          id: d.id,
          role: d.role as "user" | "bot",
          text: d.text
        })));
      }
    };
    fetchChats();
  }, []);

  const saveMessageToDb = async (role: string, text: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    await supabase.from('chat_messages').insert([{ user_id: userData.user.id, role, text }]);
  };

  const handleClearChat = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    await supabase.from('chat_messages').delete().eq('user_id', userData.user.id);
    setMessages([defaultInitialMessage]);
  };

  const addBotMessage = (text: string, isTyping = false) => {
    const id = "msg-" + Date.now();
    setMessages((prev) => [...prev, { id, role: "bot", text, isTyping }]);
    return id;
  };

  const updateBotMessage = (id: string, text: string, extractedTask?: Task) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text, isTyping: false, extractedTask } : msg))
    );
    saveMessageToDb("bot", text);
  };

  // Pure JS date/time parser — ZERO AI involvement. 100% accurate.
  const parseDeadlineFromText = (text: string): string | null => {
    const lower = text.toLowerCase();

    // Build the base date
    let baseDate = new Date();
    if (lower.includes("tomorrow")) {
      baseDate.setDate(baseDate.getDate() + 1);
    } else if (lower.match(/\bnext week\b/)) {
      baseDate.setDate(baseDate.getDate() + 7);
    }
    // "today" or no modifier → stay on today's date

    // Match time patterns like "7:00pm", "7pm", "19:00", "6:30 pm"
    // Use a specific pattern that matches "7:00pm" not partial numbers in words like "100"
    const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || "0");
      const meridiem = timeMatch[3];
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
      baseDate.setHours(hours, minutes, 0, 0);
      return baseDate.toISOString();
    }

    // Try 24-hour format like "18:30"
    const time24Match = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time24Match) {
      baseDate.setHours(parseInt(time24Match[1]), parseInt(time24Match[2]), 0, 0);
      return baseDate.toISOString();
    }

    return null; // No time found — let AI decide
  };

  const handleSend = async (text: string, isAudioInput: boolean = false) => {
    if (!text.trim()) return;

    const userMsgId = "msg-" + Date.now() + "-u";
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);
    saveMessageToDb("user", text);
    setIsLoading(true);

    const botMsgId = addBotMessage("Thinking...", true);

    try {
      if (text.toLowerCase().startsWith("/dump")) {
        const dumpText = text.replace(/^\/dump\s*/i, "");
        if (!dumpText) {
          updateBotMessage(botMsgId, "Please provide the task details after /dump. Example: /dump Add payment gateway by Friday");
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/gemini/parse-smart-input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: dumpText }),
        });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        
        const newTasks = data.tasks.map((nt: any) => ({
          ...nt,
          id: "task-" + Math.random().toString(36).substr(2, 9),
          completed: false,
        }));
        
        saveTasksToLocalStorage([...newTasks, ...tasks]);
        updateBotMessage(botMsgId, `Successfully dumped! I've created ${newTasks.length} task(s) in your Control Center.`);
        
      } else if (text.toLowerCase().startsWith("/rescue")) {
        const rescueSubject = text.replace(/^\/rescue\s*/i, "");
        if (!rescueSubject) {
          updateBotMessage(botMsgId, "What do you need rescuing from? Example: /rescue Website redesign delivery");
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/gemini/rescue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskTitle: rescueSubject, delayReason: "Unforeseen complexities", requestedExtensionDays: 2 }),
        });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        
        const newRescue: RescuePlan = {
          id: "res-" + Math.random().toString(36).substr(2, 9),
          taskId: "standalone",
          emailDraft: data.emailDraft,
          survivalSteps: data.survivalSteps,
          generatedAt: new Date().toISOString(),
        };
        saveRescuesToLocalStorage([newRescue, ...savedRescues]);
        
        updateBotMessage(botMsgId, `Rescue Plan generated for "${rescueSubject}". Check the Control Center for your survival steps and email draft.`);
        
      } else {
        // Normal coaching chat
        const previousContext = messages.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        }));
        previousContext.push({ role: "user", content: text });

        const res = await fetch("/api/gemini/coach-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: previousContext,
            currentTasks: tasks,
          }),
        });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        
        const finalReply = data.reply || data.text || data.response || data.message || data.answer || (typeof data === 'string' ? data : JSON.stringify(data));
        
        let newTask: Task | undefined;
        // Handle Conversational Task Extraction
        if (data.extractedTask) {
          // ALWAYS override AI deadline with JS parser — prevents date hallucinations
          const parsedDeadline = parseDeadlineFromText(text);
          newTask = {
            id: Math.random().toString(36).substr(2, 9),
            title: data.extractedTask.title,
            description: data.extractedTask.description,
            deadline: parsedDeadline || data.extractedTask.deadline,
            vibeCategory: data.extractedTask.vibeCategory || "General",
            priority: "medium",
            completed: false,
            createdAt: new Date().toISOString(),
          };
          saveTasksToLocalStorage([...tasks, newTask]);
        }

        updateBotMessage(botMsgId, finalReply, newTask);

        // Play TTS Audio (Vibe Shift Urgency)
        try {
          // Check if there's a tight deadline for urgency vibe shift
          let urgency = "normal";
          if (data.extractedTask && data.extractedTask.deadline) {
            const hoursLeft = (new Date(data.extractedTask.deadline).getTime() - Date.now()) / 3600000;
            if (hoursLeft < 24) urgency = "high";
            else if (hoursLeft > 120) urgency = "low";
          }

          // Play TTS Audio if requested via voice, or if it's high urgency
          if (isAudioInput || urgency === "high") {
            try {
              const ttsRes = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: finalReply, urgency }),
              });

              if (ttsRes.ok) {
                const audioBlob = await ttsRes.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play().catch(e => console.error("Autoplay blocked:", e));
              } else {
                throw new Error("Cloud TTS API failed");
              }
            } catch (audioErr) {
              console.warn("HuggingFace TTS failed, falling back to free browser TTS:", audioErr);
              // Fallback to 100% FREE lifetime Web Speech API
              const utterance = new SpeechSynthesisUtterance(finalReply);
              
              let voices = window.speechSynthesis.getVoices();
              const femaleVoice = voices.find(v => 
                v.name.toLowerCase().includes("female") || 
                v.name.toLowerCase().includes("zira") || 
                v.name.toLowerCase().includes("samantha") || 
                v.name.toLowerCase().includes("victoria") || 
                v.name.toLowerCase().includes("hazel") ||
                v.name.toLowerCase().includes("susan") ||
                v.name.toLowerCase().includes("catherine") ||
                v.name === "Google US English" 
              );
              
              if (femaleVoice) {
                utterance.voice = femaleVoice;
              } else if (voices.length > 1) {
                utterance.voice = voices[1]; 
              }
              
              if (urgency === "high") utterance.rate = 1.15;
              
              window.speechSynthesis.speak(utterance);
            }
          }
        } catch (err) {
          console.error("Failed to process message:", err);
        }
      }
    } catch (err) {
      console.error(err);
      updateBotMessage(botMsgId, "I lost connection to the mainframe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === "Add deadline") handleSend("I need to add a new deadline for a task. Ask me what it is.");
    if (action === "Write extension email") handleSend("I'm about to miss a deadline and need you to draft a professional extension request email for me.");
    if (action === "Give me a pep talk") handleSend("I'm feeling overwhelmed and need a quick pep talk to get me focused. Motivate me!");
  };

  return (
    <div className="relative flex flex-col flex-1 w-full overflow-hidden">
      <div className="relative z-10 flex flex-col flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 overflow-hidden mt-2">
        <div className="flex flex-col flex-1 max-w-2xl w-full h-full">
          {/* Header Title & Clear Chat */}
          <div className="flex-shrink-0 mb-6 mt-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-blue-950/30 backdrop-blur-md border border-blue-500/10">
              <div className="w-10 h-10 rounded-xl bg-slate-800/50 text-blue-500 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white font-sans">AI Workspace</h2>
                <p className="text-[10px] text-blue-300/80 font-mono tracking-widest uppercase mt-0.5">Unified Bodyguard Protocol</p>
              </div>
            </div>
            
            <GlassButton 
              onClick={handleClearChat}
              size="sm"
              className="!px-4"
              contentClassName="flex items-center gap-2 text-red-500 hover:text-red-400 font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </GlassButton>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide flex flex-col">
            {messages.map((m) => (
              <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                    m.role === 'user' 
                      ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' 
                      : 'bg-slate-800/80 border border-white/10 text-slate-300'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Ghost size={14} />}
                  </div>
                  {/* Bubble */}
                  <div className={`px-5 py-4 rounded-2xl text-[15px] leading-relaxed font-sans ${
                    m.role === 'user' 
                      ? 'bg-blue-500/10 text-blue-50 backdrop-blur-md border border-blue-500/20 rounded-tr-sm shadow-sm' 
                      : 'bg-slate-900/60 text-slate-200 backdrop-blur-md border border-white/5 rounded-tl-sm shadow-sm'
                  }`}>
                    {m.isTyping ? (
                      <span className="flex items-center gap-1.5 opacity-60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : (
                      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-a:text-blue-400">
                        <ReactMarkdown>
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Render Extracted Task if present */}
                    {m.role === 'bot' && !m.isTyping && m.extractedTask && (
                      <div className="mt-4 p-3 rounded-xl bg-black/40 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">Task Registered</span>
                        </div>
                        <h4 className="font-bold text-slate-100 text-base mb-1">{m.extractedTask.title}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-blue-200/80 bg-black/20 px-2 py-1 rounded">
                            Due: {new Date(m.extractedTask.deadline || '').toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'})}
                          </span>
                          <button 
                            onClick={() => window.location.href = '/dashboard'}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1 rounded-full"
                          >
                            Edit Task →
                          </button>
                        </div>
                      </div>
                    )}
                    

                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Quick Actions & Input */}
          <div className="flex-shrink-0 mt-4 pb-2">
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 mb-3 px-2">
              <button
                onClick={() => handleQuickAction("Add deadline")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/50 border border-white/10 text-[11px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add a Deadline
              </button>
              <button
                onClick={() => handleQuickAction("Write extension email")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/50 border border-white/10 text-[11px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shadow-sm"
              >
                <FileWarning className="w-3.5 h-3.5 text-red-500" /> Write Extension Email
              </button>
              <button
                onClick={() => handleQuickAction("Give me a pep talk")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/50 border border-white/10 text-[11px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Give me a Pep Talk
              </button>
            </div>
            
            <RuixenQueryBox onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
