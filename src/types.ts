export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  vibeCategory: 'Deep Work' | 'Admin Hustle' | 'Creative Flow' | 'Quick Win' | 'Personal';
  completed: boolean;
  completedAt?: string; // ISO string
  createdAt?: string;
  priority?: 'high' | 'medium' | 'low';
  funReasoning?: string;
  microAction?: string;
  moodColor?: string; // e.g., 'rose' | 'amber' | 'emerald' | 'indigo'
  subtasks?: Subtask[];
  activeMicroActionTimer?: boolean;
  elapsedSeconds?: number;
  shipItPlan?: string; // Gemini-condensed minimal deliverable
  shipItProof?: string; // Copy-pasteable proof of work
  shipItMessage?: string; // Encouraging message
  shipItLoading?: boolean;
  suggestedTimeBlock?: string; // Smart Scheduler block
  autoPilotDraft?: string; // AI generated draft/work from Snooze feature
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RescuePlan {
  id?: string;
  taskId: string;
  taskTitle?: string;
  emergencyPlan?: string[];
  communicationDrafts?: Array<{
    tone: string;
    subject: string;
    body: string;
  }>;
  calendarBlock?: string;       // Suggested calendar block description
  scopeReduction?: string;      // What to cut to still ship
  rescheduleVibe?: string;
  emailDraft?: string;
  survivalSteps?: string[];
  generatedAt?: string;
}

export interface FocusInsight {
  totalCompleted: number;
  completedOnTime: number;
  favoriteVibe: string;
  coachVibeCommentary: string;
}

export interface WeeklyInsight {
  completedCount: number;
  overdueCount: number;
  topCategory: string;
  avgCompletionHours: number;
  momentum: string;      // 'accelerating' | 'stable' | 'declining'
  aiNarrative: string;   // Gemini-generated weekly summary
  winHighlight: string;  // Best win of the week
  nextWeekFocus: string; // AI-recommended focus for next 7 days
  patterns?: string[];   // AI-identified behavioral patterns
}
