import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimatedTextCycle from "./ui/animated-text-cycle";
import { Component as SpotlightButton } from "./ui/spotlight-button";

interface LandingHeroProps {
  onEnterApp?: () => void;
  activeTasksCount?: number;
}

export default function LandingHero({ onEnterApp, activeTasksCount }: LandingHeroProps) {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-foreground">
      {/* ── Optional Dark Overlay for contrast (Layout already has one, but keeping for extra depth if needed) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none"></div>

      {/* ── Content Wrapper ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── Navigation Bar ── */}
        <header className="flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center">
            <span className="text-3xl tracking-tight text-rose-100 font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>
              DeadlineVibe<sup className="text-xs font-sans text-rose-400">™</sup>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-foreground font-medium transition-colors">Home</Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Assistant</Link>
            <Link to="/insights" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
          </nav>

          <SpotlightButton
            onClick={() => navigate("/dashboard")}
            className="!h-9 !px-6"
          >
            Begin Journey
          </SpotlightButton>
        </header>

        {/* ── Main Hero Area ── */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 py-[90px] w-full max-w-7xl mx-auto">
          <h1 className="text-5xl sm:text-7xl md:text-8xl leading-[1.1] tracking-[-2.46px] font-normal text-slate-400 animate-fade-rise text-center max-w-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Master your <AnimatedTextCycle 
                words={[
                    "deadlines",
                    "focus",
                    "procrastination",
                    "momentum",
                    "workflow",
                    "chaos"
                ]}
                interval={3000}
                className="text-white font-bold italic" 
            /> <br className="hidden sm:block" /> with intelligent design.
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed font-sans animate-fade-rise-delay">
            We're designing tools for deep thinkers and quiet rebels. Stop fighting with complex interfaces and let our AI agent orchestrate your perfect workflow.
          </p>

          <Link
            to="/dashboard"
            className="liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-12 hover:scale-[1.03] cursor-pointer transition-transform duration-300 animate-fade-rise-delay-2 font-medium"
          >
            Begin Journey
          </Link>
        </main>
      </div>
    </div>
  );
}
