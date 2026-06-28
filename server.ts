import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Model — using latest Gemini 2.5 Flash (faster, smarter, fresh quota)
const MODEL_NAME = "gemini-2.5-flash";

// ─── Unified LLM Service ────────────────────────────────────────────────────────

type UseCase = 'standard' | 'heavy_reasoning' | 'fast_chat';

interface GenerateConfig {
  systemInstruction: string;
  responseSchema?: any;
  temperature?: number;
}

/**
 * OpenRouter direct API fallback
 */
async function callOpenRouter(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string | any[],
  requiresJson: boolean
): Promise<any> {
  const messages = [];

  if (systemPrompt) {
    let finalSystemPrompt = systemPrompt;
    if (requiresJson) {
      finalSystemPrompt += "\n\nIMPORTANT: You must return ONLY valid JSON. Do not wrap it in markdown backticks like ```json.";
    }
    messages.push({ role: "system", content: finalSystemPrompt });
  }

  // Format Gemini contents array into OpenAI messages array
  if (typeof userMessage === 'string') {
    messages.push({ role: "user", content: userMessage });
  } else if (Array.isArray(userMessage)) {
    for (const msg of userMessage) {
      messages.push({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.parts[0].text,
      });
    }
  }

  const requestBody: any = {
    model: model,
    messages: messages,
  };

  if (requiresJson) {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "DeadlineVibe"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter Error (${model}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  if (requiresJson) {
    // Strip markdown formatting if the model ignored instructions
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("[LLM Service] Failed to parse JSON from fallback response:", content);
      throw new Error("Invalid JSON returned from fallback model.");
    }
  }

  return { text: content };
}

/**
 * Groq direct API fallback
 */
async function callGroq(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string | any[],
  requiresJson: boolean
): Promise<any> {
  const messages = [];

  if (systemPrompt) {
    let finalSystemPrompt = systemPrompt;
    if (requiresJson) {
      finalSystemPrompt += "\n\nIMPORTANT: You must return ONLY valid JSON. Do not wrap it in markdown backticks like ```json.";
    }
    messages.push({ role: "system", content: finalSystemPrompt });
  }

  // Format Gemini contents array into OpenAI messages array
  if (typeof userMessage === 'string') {
    messages.push({ role: "user", content: userMessage });
  } else if (Array.isArray(userMessage)) {
    for (const msg of userMessage) {
      messages.push({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.parts[0].text,
      });
    }
  }

  const requestBody: any = {
    model: model,
    messages: messages,
  };

  if (requiresJson) {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Error (${model}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  if (requiresJson) {
    // Strip markdown formatting if the model ignored instructions
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("[LLM Service] Failed to parse JSON from fallback response:", content);
      throw new Error("Invalid JSON returned from fallback model.");
    }
  }

  return { text: content };
}
/**
 * Primary routing function — PURE AI, SMART ROUTING, NO HARDCODING
 * Distributes load across different models based on the task to avoid rate limits.
 */
async function generateWithFallback(
  promptTextOrContents: string | any[],
  config: GenerateConfig,
  useCase: UseCase
): Promise<any> {
  const requiresJson = !!config.responseSchema;
  const errors: string[] = [];

  // Define our available AI engines
  const engines = {
    gemini: async () => {
      console.log(`[LLM] Trying Gemini (${MODEL_NAME})...`);
      const reqConfig: any = { systemInstruction: config.systemInstruction };
      if (config.temperature !== undefined) reqConfig.temperature = config.temperature;
      if (requiresJson) {
        reqConfig.responseMimeType = "application/json";
        reqConfig.responseSchema = config.responseSchema;
      }
      const response = await ai.models.generateContent({ model: MODEL_NAME, contents: promptTextOrContents, config: reqConfig });
      console.log(`[LLM] ✅ Gemini responded successfully.`);
      return requiresJson ? JSON.parse(response.text || "{}") : { text: response.text };
    },
    geminiStable: async () => {
      console.log(`[LLM] Trying Gemini Stable (gemini-2.0-flash)...`);
      const reqConfig: any = { systemInstruction: config.systemInstruction };
      if (config.temperature !== undefined) reqConfig.temperature = config.temperature;
      if (requiresJson) {
        reqConfig.responseMimeType = "application/json";
        reqConfig.responseSchema = config.responseSchema;
      }
      const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: promptTextOrContents, config: reqConfig });
      console.log(`[LLM] ✅ Gemini Stable responded successfully.`);
      return requiresJson ? JSON.parse(response.text || "{}") : { text: response.text };
    },
    openRouterNvidia: async (model: string) => {
      if (!process.env.OPENROUTER_NVIDIA_API_KEY) throw new Error("No NVIDIA key");
      console.log(`[LLM] Trying OpenRouter (${model}) via NVIDIA key...`);
      const result = await callOpenRouter(model, process.env.OPENROUTER_NVIDIA_API_KEY, config.systemInstruction, promptTextOrContents, requiresJson);
      console.log(`[LLM] ✅ OpenRouter (${model}) responded successfully.`);
      return result;
    },
    openRouterQwen: async (model: string) => {
      if (!process.env.OPENROUTER_QWEN_API_KEY) throw new Error("No QWEN key");
      console.log(`[LLM] Trying OpenRouter (${model}) via QWEN key...`);
      const result = await callOpenRouter(model, process.env.OPENROUTER_QWEN_API_KEY, config.systemInstruction, promptTextOrContents, requiresJson);
      console.log(`[LLM] ✅ OpenRouter (${model}) responded successfully.`);
      return result;
    },
    openRouterGemma: async (model: string) => {
      if (!process.env.OPENROUTER_GEMMA_API_KEY) throw new Error("No GEMMA key");
      console.log(`[LLM] Trying OpenRouter (${model}) via GEMMA key...`);
      const result = await callOpenRouter(model, process.env.OPENROUTER_GEMMA_API_KEY, config.systemInstruction, promptTextOrContents, requiresJson);
      console.log(`[LLM] ✅ OpenRouter (${model}) responded successfully.`);
      return result;
    },
    groq: async (model: string) => {
      if (!process.env.GROQ_API_KEY) throw new Error("No GROQ key");
      console.log(`[LLM] Trying Groq (${model}) via GROQ key...`);
      const result = await callGroq(model, process.env.GROQ_API_KEY, config.systemInstruction, promptTextOrContents, requiresJson);
      console.log(`[LLM] ✅ Groq (${model}) responded successfully.`);
      return result;
    }
  };

  // Define the routing strategy (which engine to try first based on task)
  let strategy: (() => Promise<any>)[];

  if (useCase === 'fast_chat') {
    // Chat: Try Groq -> Gemma -> Llama -> Qwen -> Gemini
    strategy = [
      () => engines.groq("llama-3.3-70b-versatile"),
      () => engines.openRouterGemma("google/gemma-4-31b-it:free"),
      () => engines.openRouterNvidia("meta-llama/llama-3.3-70b-instruct:free"),
      () => engines.openRouterQwen("qwen/qwen-2.5-72b-instruct:free"),
      engines.gemini,
      engines.geminiStable
    ];
  } else if (useCase === 'heavy_reasoning') {
    // Rescue Mode: Try Groq -> Gemma -> Llama -> Gemini
    strategy = [
      () => engines.groq("llama-3.3-70b-versatile"),
      () => engines.openRouterGemma("google/gemma-4-31b-it:free"),
      () => engines.openRouterNvidia("meta-llama/llama-3.3-70b-instruct:free"),
      engines.gemini,
      engines.geminiStable
    ];
  } else {
    // Standard: Try Groq -> Gemini -> Gemma -> Llama -> Qwen
    strategy = [
      () => engines.groq("llama-3.3-70b-versatile"),
      engines.gemini,
      () => engines.openRouterGemma("google/gemma-4-31b-it:free"),
      () => engines.openRouterNvidia("meta-llama/llama-3.3-70b-instruct:free"),
      () => engines.openRouterQwen("qwen/qwen3-coder:free"),
      engines.geminiStable
    ];
  }

  // Execute the strategy instantly, no delays
  for (const attempt of strategy) {
    try {
      return await attempt();
    } catch (err: any) {
      console.warn(`[LLM] ❌ Attempt failed. Next...`);
      errors.push(err.message?.substring(0, 50));
    }
  }

  // ── Step 3: All failed — clean error for frontend ──
  console.error(`[LLM] ❌ ALL models failed for use-case: ${useCase}. Errors: ${errors.join(', ')}`);
  throw new Error("All AI models are currently busy. Please try again in a moment.");
}

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", unified_service: true, timestamp: new Date() });
});

// ─── 1. Smart Input Parser ─────────────────────────────────────────────────────
app.post("/api/gemini/parse-smart-input", async (req, res) => {
  try {
    const { brainDump, referenceTime } = req.body;
    if (!brainDump) return res.status(400).json({ error: "Brain dump text is required" });

    const systemPrompt = `You are a smart deadline manager. Parse the user's natural language brain dump or transcript into a structured array of tasks.
Instead of outputting absolute dates, you must output relative offsets:
1. "deadlineOffsetDays": 0 for today, 1 for tomorrow, 7 for next week, etc.
2. "deadlineTimeStr": The time formatted as 24-hour "HH:MM" (e.g. "18:30" for 6:30pm).
Return clean fields.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              deadlineOffsetDays: { type: Type.INTEGER },
              deadlineTimeStr: { type: Type.STRING },
              vibeCategory: { type: Type.STRING },
            },
            required: ["title", "description", "deadlineOffsetDays", "deadlineTimeStr", "vibeCategory"],
          },
        },
      },
      required: ["tasks"],
    };

    const result = await generateWithFallback(
      `Brain dump to process:\n"${brainDump}"`, 
      { systemInstruction: systemPrompt, responseSchema: schema }, 
      'standard'
    );
    
    // Construct robust dates in JS to prevent LLM hallucinations
    const refDate = new Date(referenceTime || Date.now());
    if (result.tasks && Array.isArray(result.tasks)) {
      result.tasks = result.tasks.map((task: any) => {
        let deadlineDate = new Date(refDate);
        if (typeof task.deadlineOffsetDays === 'number') {
           deadlineDate.setDate(deadlineDate.getDate() + task.deadlineOffsetDays);
        }
        if (task.deadlineTimeStr && task.deadlineTimeStr.includes(':')) {
           const [hours, minutes] = task.deadlineTimeStr.split(':');
           deadlineDate.setHours(parseInt(hours) || 23, parseInt(minutes) || 59, 0, 0);
        } else {
           deadlineDate.setHours(23, 59, 59, 999);
        }
        
        return {
           title: task.title,
           description: task.description,
           vibeCategory: task.vibeCategory,
           deadline: deadlineDate.toISOString()
        };
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error("Error parsing smart input:", err);
    res.status(500).json({ error: err.message || "Failed to parse brain-dump" });
  }
});

// ─── 2. Task Analyzer & Breakdown ─────────────────────────────────────────────
app.post("/api/gemini/analyze-task", async (req, res) => {
  try {
    const { title, description, deadline, vibeCategory, currentMood } = req.body;
    if (!title) return res.status(400).json({ error: "Task title is required" });

    const promptText = `
Task Title: ${title}
Details: ${description || "None provided"}
Deadline: ${deadline || "No strict deadline"}
Category: ${vibeCategory || "General"}
User's Current Mood/Energy Level: ${currentMood || "Productive"}
`;

    const systemPrompt = `You are the 'Deadline Bodyguard' on the DeadlineVibe app.
Deconstruct this task and provide:
1. Priority assessment: 'high', 'medium', or 'low'.
2. A witty, energetic, slightly humorous bodyguard commentary ('funReasoning') on why this task cannot be ignored.
3. 3 to 5 clear, actionable subtasks with estimated time in minutes.
4. A highly actionable first 5-minute micro-action ('microAction') to break the user's inertia immediately.
5. A matching modern color theme badge ('moodColor'): 'rose' (dangerous deadline), 'amber' (needs hustle), 'emerald' (steady rhythm), or 'indigo' (creative deep state).`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        priority: { type: Type.STRING },
        funReasoning: { type: Type.STRING },
        subtasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER },
            },
            required: ["title", "estimatedMinutes"],
          },
        },
        microAction: { type: Type.STRING },
        moodColor: { type: Type.STRING },
      },
      required: ["priority", "funReasoning", "subtasks", "microAction", "moodColor"],
    };

    const result = await generateWithFallback(
      promptText, 
      { systemInstruction: systemPrompt, responseSchema: schema }, 
      'standard'
    );

    res.json(result);
  } catch (err: any) {
    console.error("Error analyzing task:", err);
    res.status(500).json({ error: err.message || "Failed to analyze task" });
  }
});

// ─── 3. Enhanced Rescue Envoy (Heavy Reasoning -> NVIDIA) ──────────────────────
app.post("/api/gemini/rescue", async (req, res) => {
  try {
    const { title, reason, deadline } = req.body;
    if (!title) return res.status(400).json({ error: "Task title is required" });

    const promptText = `
Task at Risk: "${title}"
Stated obstacle/reason: "${reason || "Procrastination running high"}"
Deadline: "${deadline || "ASAP"}"
`;

    const systemPrompt = `You are the 'Emergency Rescue Envoy' for DeadlineVibe. The user is struggling to start or finish a crucial task.
Provide PARALLEL MULTI-FRONT rescue:
- emergencyPlan: 3 actionable sprint bullets to get 80% outcome with 20% effort.
- communicationDrafts: 3 distinct polite communication drafts (tones: 'Professional Email', 'Strategic & Honest', 'High-Pressure Pivot') with realistic subject lines and bodies.
- calendarBlock: A concrete calendar block suggestion (e.g., "Block 2–4pm today as 'Deep Sprint: [task]' — mark unavailable on all calendars"). Be specific.
- scopeReduction: What SPECIFIC features/sections/requirements to cut to still ship something meaningful by deadline. Be brutally practical.
- rescheduleVibe: Funny, brutally honest advice on which recurring habits to sacrifice RIGHT NOW to clear focus time.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        emergencyPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        communicationDrafts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ["tone", "subject", "body"],
          },
        },
        calendarBlock: { type: Type.STRING },
        scopeReduction: { type: Type.STRING },
        rescheduleVibe: { type: Type.STRING },
      },
      required: ["emergencyPlan", "communicationDrafts", "calendarBlock", "scopeReduction", "rescheduleVibe"],
    };

    const result = await generateWithFallback(
      promptText, 
      { systemInstruction: systemPrompt, responseSchema: schema }, 
      'heavy_reasoning'
    );

    res.json(result);
  } catch (err: any) {
    console.error("Error generating rescue payload:", err);
    res.status(500).json({ error: err.message || "Failed to generate emergency plan" });
  }
});

// ─── 4. Accountability Ghost Chat (Fast Chat -> Qwen) ─────────────────────────
app.post("/api/gemini/coach-chat", async (req, res) => {
  try {
    const { messages, currentTasks } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages thread is required" });
    }

    const activeTasks = currentTasks?.filter((t: any) => !t.completed) || [];
    const completedTasks = currentTasks?.filter((t: any) => t.completed) || [];

    const taskContext = activeTasks.length > 0
      ? `ACTIVE TASKS (${activeTasks.length}):\n${activeTasks.map((t: any) => {
          const hoursLeft = t.deadline ? Math.round((new Date(t.deadline).getTime() - Date.now()) / 3600000) : null;
          return `- "${t.title}" (${hoursLeft !== null ? `${hoursLeft > 0 ? hoursLeft + "h left" : "OVERDUE by " + Math.abs(hoursLeft) + "h"}` : "no deadline"}, Priority: ${t.priority || "medium"})`;
        }).join("\n")}`
      : "No active tasks.";

    const completedContext = completedTasks.length > 0
      ? `\nRECENTLY COMPLETED (${completedTasks.length}):\n${completedTasks.slice(-3).map((t: any) => `- "${t.title}" ✓`).join("\n")}`
      : "";

    const systemPrompt = `You are the 'Accountability Ghost' — a proactive, supportive, cheeky, and dedicated AI coach inside DeadlineVibe.
Guidelines:
- Act like a caring, slightly dramatic, and witty bodyguard for the user's deadlines.
- If the user implies they have a new task/assignment but haven't provided enough details (e.g., "I have an assignment tomorrow"), ASK follow-up questions to get the exact title, description, and deadline. Do NOT extract the task yet.
- ONLY when you have enough details (title, description, and deadline/timeframe), you should extract the task into the JSON object.
- ALWAYS reference specific active tasks when relevant.
- Provide bite-sized, highly direct responses. Max 3 sentences.

IMPORTANT: You MUST return a JSON object with this exact structure:
{
  "reply": "Your conversational response to the user",
  "extractedTask": { // ONLY include this if you have enough details to create a task, otherwise set to null
    "title": "Task title",
    "description": "Brief description",
    "deadlineOffsetDays": 0 for today, 1 for tomorrow, 7 for next week, etc.,
    "deadlineTimeStr": "The time formatted as 24-hour HH:MM (e.g. '18:30' for 6:30pm)",
    "vibeCategory": "General, Deep Work, etc."
  }
}

User's Current Task Context:
${taskContext}${completedContext}`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        reply: { type: Type.STRING },
        extractedTask: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            deadlineOffsetDays: { type: Type.INTEGER },
            deadlineTimeStr: { type: Type.STRING },
            vibeCategory: { type: Type.STRING },
          },
          required: ["title", "description", "deadlineOffsetDays", "deadlineTimeStr", "vibeCategory"],
        },
      },
      required: ["reply"],
    };

    const geminiContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const result = await generateWithFallback(
      geminiContents, 
      { systemInstruction: systemPrompt, responseSchema: schema, temperature: 0.82 }, 
      'fast_chat'
    );

    // Robust Date calculation in JS to bypass LLM 2024 calendar hallucinations
    if (result && result.extractedTask) {
      const refDate = new Date();
      let deadlineDate = new Date(refDate);
      if (typeof result.extractedTask.deadlineOffsetDays === 'number') {
        deadlineDate.setDate(deadlineDate.getDate() + result.extractedTask.deadlineOffsetDays);
      }
      if (result.extractedTask.deadlineTimeStr && result.extractedTask.deadlineTimeStr.includes(':')) {
        const [hours, minutes] = result.extractedTask.deadlineTimeStr.split(':');
        deadlineDate.setHours(parseInt(hours) || 23, parseInt(minutes) || 59, 0, 0);
      } else {
        deadlineDate.setHours(23, 59, 0, 0);
      }
      result.extractedTask.deadline = deadlineDate.toISOString();
      delete result.extractedTask.deadlineOffsetDays;
      delete result.extractedTask.deadlineTimeStr;
    }

    res.json(result);
  } catch (err: any) {
    console.error("Error in coach chat:", err);
    res.status(500).json({ error: err.message || "Failed to get coaching advice" });
  }
});

// ─── 5. Text-to-Speech (ElevenLabs Natural Voice) ──────────────────────────────────
app.post("/api/tts", async (req, res) => {
  try {
    const { text, urgency } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is missing in .env");
    }

    // ElevenLabs Voice ID for Rachel (Natural American Female)
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; 

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs Error: ${response.status} - ${errText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));

  } catch (err: any) {
    console.error("TTS Error:", err);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

// ─── 5.1. Speech-to-Text (Groq Whisper High Accuracy) ────────────────────────────────────────
app.post("/api/stt", async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) return res.status(400).json({ error: "No audio provided" });

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const buffer = Buffer.from(audioBase64, "base64");
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'audio/webm' });
    
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");
    formData.append("language", "en"); // Force English to prevent hallucination/translation issues

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: formData as any
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq STT Error: ${errText}`);
    }

    const data = await groqRes.json();
    res.json({ text: data.text });
  } catch (err: any) {
    console.error("STT Error:", err);
    res.status(500).json({ error: err.message || "Failed to transcribe audio" });
  }
});

// ─── AI Auto-Pilot (Snooze Feature) ──────────────────────────
app.post("/api/gemini/autopilot", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Task title is required" });

    const systemPrompt = `You are a proactive, hyper-competent AI Assistant for DeadlineVibe.
The user just snoozed a task reminder. Instead of just delaying, your job is to auto-complete or draft a huge chunk of the task for them right now, so they don't have to start from scratch.
If it's an email/message, write the full draft.
If it's code, write a skeleton or the core logic.
If it's an assignment/essay, write an outline or the first paragraph.
Keep it highly professional, extremely helpful, and ready to use. Do not add filler text. Just give the output.`;

    const userPrompt = `Task Title: ${title}\nDescription: ${description || "No further details provided."}\nPlease auto-draft this task for me now.`;

    const result = await generateWithFallback(
      userPrompt,
      { systemInstruction: systemPrompt },
      'heavy_reasoning'
    );

    res.json({ draft: result.text || "Could not generate draft." });
  } catch (err: any) {
    console.error("AutoPilot Error:", err);
    res.status(500).json({ error: err.message || "Failed to auto-pilot task" });
  }
});

// ─── 5. One-Click Ship It (Heavy Reasoning -> NVIDIA) ──────────────────────────
app.post("/api/gemini/ship-it", async (req, res) => {
  try {
    const { title, description, deadline, subtasks } = req.body;
    if (!title) return res.status(400).json({ error: "Task title is required" });

    const subtasksList = subtasks?.map((s: any) => `- ${s.title} (${s.estimatedMinutes}min)`).join("\n") || "No subtasks defined";

    const promptText = `
Task: "${title}"
Details: ${description || "No details"}
Deadline: ${deadline || "ASAP"}
Planned subtasks:
${subtasksList}
`;

    const systemPrompt = `You are a ruthless scope-reduction expert for DeadlineVibe's "One-Click Ship It" feature.
The user has a tight deadline and needs to ship SOMETHING meaningful rather than nothing perfect.
Generate a "Minimal Viable Ship" plan:
- shipItPlan: 2-4 sentence ultra-concrete plan describing EXACTLY what to build/submit RIGHT NOW to have a shippable outcome. Cut everything non-essential. Focus on the core value.
- shipItProof: A short block of text the user can immediately copy/paste as proof of work or an update (e.g. "Hey, just pushing the core MVP: [X]. Will follow up with [Y] tomorrow").
- shipItMessage: A short, highly encouraging 1-sentence message telling them to just send it.
Be direct, specific, and encouraging.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        shipItPlan: { type: Type.STRING },
        shipItProof: { type: Type.STRING },
        shipItMessage: { type: Type.STRING },
      },
      required: ["shipItPlan", "shipItProof", "shipItMessage"],
    };

    const result = await generateWithFallback(
      promptText, 
      { systemInstruction: systemPrompt, responseSchema: schema }, 
      'heavy_reasoning'
    );

    res.json(result);
  } catch (err: any) {
    console.error("Error generating ship-it plan:", err);
    res.status(500).json({ error: err.message || "Failed to generate Ship It plan" });
  }
});

// ─── 5.5. Smart Schedule (Heavy Reasoning) ─────────────────────────────────────
app.post("/api/gemini/smart-schedule", async (req, res) => {
  try {
    const { tasks, currentMood, energyLevel } = req.body;
    if (!tasks || !Array.isArray(tasks)) return res.status(400).json({ error: "Tasks array required" });

    const promptText = `
Current Mood: ${currentMood}
Energy Level: ${energyLevel}%
Active Tasks:
${tasks.map((t: any) => `- ID: ${t.id} | Title: "${t.title}" | Deadline: ${t.deadline}`).join("\n")}
`;

    const systemPrompt = `You are an Energy-Aware Smart Scheduler.
Given the user's current mood, energy level, and active tasks, re-evaluate them.
Assign a specific 'suggestedTimeBlock' for each task (e.g., "Deep Sprint: 10am-12pm", "Low-Energy Evening: 8pm-9pm").
Return an array matching the exact task IDs with their new suggested time block.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        scheduledTasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              suggestedTimeBlock: { type: Type.STRING }
            },
            required: ["id", "suggestedTimeBlock"]
          }
        }
      },
      required: ["scheduledTasks"]
    };

    const result = await generateWithFallback(
      promptText,
      { systemInstruction: systemPrompt, responseSchema: schema },
      'heavy_reasoning'
    );

    res.json(result);
  } catch (err: any) {
    console.error("Error generating smart schedule:", err);
    res.status(500).json({ error: err.message || "Failed to generate schedule" });
  }
});

// ─── 5.6. Pattern Insights ─────────────────────────────────────────────────────
app.post("/api/gemini/pattern-insights", async (req, res) => {
  try {
    const { completedTasks } = req.body;
    if (!completedTasks) return res.status(400).json({ error: "completedTasks required" });

    const promptText = `
Completed Tasks History:
${completedTasks.map((t: any) => `- "${t.title}" | Category: ${t.vibeCategory} | Deadline: ${t.deadline} | Completed: ${t.completedAt}`).join("\n")}
`;

    const systemPrompt = `You are a Productivity Behavioral Analyst.
Look at the user's completed tasks (their deadlines vs completion times, categories).
Identify 2 distinct, highly specific behavioral patterns (e.g., "You tend to finish 'Admin Hustle' tasks 2 hours before the deadline, but 'Deep Work' tasks go down to the wire" or "You complete coding tasks 40% faster in the evening").
Keep each insight under 2 sentences.

Return a JSON object with EXACTLY this key:
- "patterns": array of strings (each string is a behavioral pattern insight)`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        patterns: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["patterns"]
    };

    const result = await generateWithFallback(
      promptText,
      { systemInstruction: systemPrompt, responseSchema: schema },
      'standard'
    );

    console.log("[Pattern Insights] API Result parsed:", JSON.stringify(result, null, 2));

    const safePatterns = result?.patterns || result?.summary?.patterns || result?.response?.patterns || [];

    res.json({ patterns: safePatterns });
  } catch (err: any) {
    console.error("Error generating pattern insights:", err);
    res.status(500).json({ error: err.message || "Failed to generate patterns" });
  }
});

// ─── 6. Weekly Insights Summary ────────────────────────────────────────────────
app.post("/api/gemini/weekly-insights", async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required" });
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentTasks = tasks.filter((t: any) => {
      const created = new Date(t.deadline).getTime();
      return created > oneWeekAgo - 7 * 24 * 60 * 60 * 1000;
    });

    const completed = recentTasks.filter((t: any) => t.completed);
    const overdue = recentTasks.filter((t: any) => !t.completed && new Date(t.deadline).getTime() < Date.now());

    const categoryMap: Record<string, number> = {};
    completed.forEach((t: any) => {
      categoryMap[t.vibeCategory] = (categoryMap[t.vibeCategory] || 0) + 1;
    });
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

    const taskSummary = recentTasks.map((t: any) => ({
      title: t.title,
      completed: t.completed,
      category: t.vibeCategory,
      priority: t.priority,
      deadline: t.deadline,
    }));

    const systemPrompt = `You are the DeadlineVibe Weekly Review AI. Generate an insightful, motivating weekly summary.
Task data provided. Stats: ${completed.length} completed, ${overdue.length} overdue, top category: ${topCategory}.
Be warm, data-driven, and forward-looking. Use specific numbers. Keep each field concise (2-3 sentences max).

Return a JSON object with EXACTLY these keys:
- "momentum": string (e.g. "accelerating", "stable", "declining")
- "aiNarrative": string (the main summary)
- "winHighlight": string (biggest win)
- "nextWeekFocus": string (what to focus on next)`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        momentum: { type: Type.STRING },
        aiNarrative: { type: Type.STRING },
        winHighlight: { type: Type.STRING },
        nextWeekFocus: { type: Type.STRING },
      },
      required: ["momentum", "aiNarrative", "winHighlight", "nextWeekFocus"],
    };

    const result = await generateWithFallback(
      `Weekly task review:\n${JSON.stringify(taskSummary, null, 2)}`,
      { systemInstruction: systemPrompt, responseSchema: schema },
      'standard'
    );
    
    // Compute avg completion hours client-side too, but send enriched
    const avgCompletionHours = completed.length > 0
      ? completed.reduce((acc: number, t: any) => {
          if (t.completedAt && t.deadline) {
            const diff = (new Date(t.completedAt).getTime() - new Date(t.deadline).getTime()) / 3600000;
            return acc + Math.abs(diff);
          }
          return acc;
        }, 0) / completed.length
      : 0;

    console.log("[Weekly Insights] API Result parsed:", JSON.stringify(result, null, 2));

    // Safely extract values in case the AI nested them or failed to generate them
    const safeResult = {
      momentum: result?.momentum || result?.summary?.momentum || result?.response?.momentum || "stable",
      aiNarrative: result?.aiNarrative || result?.summary?.aiNarrative || result?.response?.aiNarrative || `You've completed ${completed.length} tasks this week, with ${overdue.length} overdue. Keep pushing!`,
      winHighlight: result?.winHighlight || result?.summary?.winHighlight || result?.response?.winHighlight || (completed.length > 0 ? `Completed your task successfully!` : "No completions yet — time to start!"),
      nextWeekFocus: result?.nextWeekFocus || result?.summary?.nextWeekFocus || result?.response?.nextWeekFocus || "Prioritize your highest urgency tasks first thing each morning."
    };

    res.json({
      completedCount: completed.length,
      overdueCount: overdue.length,
      topCategory,
      avgCompletionHours: Math.round(avgCompletionHours),
      ...safeResult,
    });
  } catch (err: any) {
    console.error("Error generating weekly insights:", err);
    res.status(500).json({ error: err.message || "Failed to generate weekly insights" });
  }
});

// ─── Server Setup ──────────────────────────────────────────────────────────────
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // SPA fallback: serve index.html for all non-API GET routes
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const fs = await import("fs");
        const pathLib = await import("path");
        const { fileURLToPath } = await import("url");
        const __dirname = pathLib.default.dirname(fileURLToPath(import.meta.url));
        let template = fs.default.readFileSync(
          pathLib.default.resolve(__dirname, "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DeadlineVibe] Server running on http://localhost:${PORT} (Primary model: ${MODEL_NAME})`);
  });
}

configureServer();
