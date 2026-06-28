import { useEffect, useRef } from 'react';
import { Task } from '../types';

export function useProactiveVoice(tasks: Task[]) {
  const lastSpokenTaskRef = useRef<string | null>(null);

  useEffect(() => {
    const checkDeadlines = () => {
      const now = Date.now();
      
      for (const task of tasks) {
        if (task.completed || !task.deadline) continue;

        const deadlineTime = new Date(task.deadline).getTime();
        const hoursLeft = (deadlineTime - now) / 3600000;

        // If the task is due in less than 24 hours, and we haven't reminded them yet today...
        if (hoursLeft > 0 && hoursLeft <= 24 && lastSpokenTaskRef.current !== task.id) {
          console.log(`[Proactive Voice] Triggering reminder for task: ${task.title}`);
          lastSpokenTaskRef.current = task.id;

          const text = `Hey, just a heads up. Your task, ${task.title}, is due in ${Math.round(hoursLeft)} hours. Let's get focused and crush it.`;

          fetch(`${import.meta.env.VITE_API_URL || ""}/api/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, urgency: "high" }),
          })
            .then((res) => res.blob())
            .then((blob) => {
              const audioUrl = URL.createObjectURL(blob);
              const audio = new Audio(audioUrl);
              audio.play().catch(e => console.error("Proactive Voice autoplay blocked by browser:", e));
            })
            .catch(console.error);
            
          break; // Only remind about one task at a time to prevent audio overlap
        }
      }
    };

    // Check immediately on mount, then every 60 seconds
    checkDeadlines();
    const intervalId = setInterval(checkDeadlines, 60000);

    return () => clearInterval(intervalId);
  }, [tasks]);
}
