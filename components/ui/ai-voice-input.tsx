import React, { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  className?: string;
}

export function AIVoiceInput({ onStart, onStop, className }: AIVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (onStop) onStop(duration);
      setDuration(0);
    } else {
      // Start
      setIsRecording(true);
      if (onStart) onStart();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500",
        isRecording ? "bg-rose-500 scale-110 shadow-[0_0_20px_rgba(244,63,94,0.6)]" : "bg-gray-200 hover:bg-gray-300",
        className
      )}
    >
      {/* Siri-like animated waveform rings when recording */}
      {isRecording && (
        <>
          <div className="absolute inset-0 border-[2px] border-white/40 rounded-full animate-ping [animation-duration:1.5s]" />
          <div className="absolute inset-0 border-[2px] border-white/20 rounded-full animate-ping [animation-duration:1s] [animation-delay:0.2s]" />
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse [animation-duration:0.8s]" />
        </>
      )}
      
      <Mic 
        className={cn(
          "w-5 h-5 relative z-10 transition-colors duration-300",
          isRecording ? "text-white animate-bounce" : "text-gray-600"
        )} 
      />
    </button>
  );
}
