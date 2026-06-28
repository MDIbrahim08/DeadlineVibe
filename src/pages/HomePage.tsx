import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LandingHero from "../components/LandingHero";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedText } from "../components/ui/animated-underline-text-one";

export default function HomePage({ activeTasksCount, userName }: { activeTasksCount: number, userName?: string }) {
  const [showWelcome, setShowWelcome] = useState(() => {
    // Only show once per session by checking sessionStorage
    if (sessionStorage.getItem('hasSeenWelcome')) return false;
    sessionStorage.setItem('hasSeenWelcome', 'true');
    return true;
  });

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
          >
            <AnimatedText
              text={`Namaste ${userName || 'Viber'}!`}
              textClassName="font-serif text-5xl sm:text-7xl text-slate-100 mb-4"
              underlinePath="M 0,20 Q 100,0 200,20 Q 300,40 400,20"
              underlineHoverPath="M 0,20 Q 100,40 200,20 Q 300,0 400,20"
              underlineDuration={1.8}
            />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-rose-400/80 font-mono text-sm tracking-widest uppercase mt-4"
            >
              Welcome Home
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative z-10">
        <LandingHero
          onEnterApp={() => {}} // Could be removed or used differently if LandingHero has an "Enter App" button.
          activeTasksCount={activeTasksCount}
        />
      </div>
    </>
  );
}
