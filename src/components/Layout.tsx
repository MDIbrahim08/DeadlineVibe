import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, BarChart3, Volume2, VolumeX, Ghost, Zap, LayoutDashboard, ShieldAlert } from "lucide-react";
import GoogleAuthButton from "./ui/GoogleAuthButton";
import { Text_03 } from "./ui/wave-text";
import { Component as SpotlightButton } from "./ui/spotlight-button";

export default function Layout({ 
  isAmbientSoundOn, 
  setIsAmbientSoundOn 
}: { 
  isAmbientSoundOn: boolean, 
  setIsAmbientSoundOn: (v: boolean) => void 
}) {
  const location = useLocation();

  const isHome = location.pathname === "/";

  // Hide nav on landing page if you want, but user wants it visible? 
  // User asked for "updated navbar. Make the app fully navigable."
  // The screenshot shows the navbar in the app.
  
  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans">
      {/* ── Fullscreen Background Video ── */}
      <video autoPlay loop muted playsInline className="video-bg" key={location.pathname === "/chat" ? "fish" : "crystal"}>
        <source 
          src={
            location.pathname === "/chat" 
              ? "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4" 
              : "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          } 
          type="video/mp4" 
        />
      </video>
      <div className={`absolute inset-0 pointer-events-none z-0 ${location.pathname === '/chat' ? 'bg-gradient-to-b from-black/60 via-black/20 to-black/80' : 'bg-black/40 mix-blend-multiply'}`}></div>

      {isHome ? (
        <div className="relative z-10 w-full flex-1 flex flex-col">
          <Outlet />
        </div>
      ) : (
        <div className="relative z-10 w-full flex-1 flex flex-col">
          {/* ── Nav Bar ── */}
          <div className="w-full px-4 pt-6 md:px-8 md:pt-8 z-50 relative">
            <nav className="w-full max-w-7xl mx-auto flex items-center justify-between glass-panel px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-2xl bg-slate-950/40">
              
              {/* Left: Logo */}
              <Link to="/dashboard" className="flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 overflow-hidden group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 shadow-inner">
                  <img src="/logo.png" alt="DeadlineVibe Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-serif text-3xl text-white tracking-tight group-hover:text-indigo-400 transition-colors duration-300 mt-1">
                  DeadlineVibe
                </span>
              </Link>

              {/* Center: Nav Links */}
              <div className="hidden lg:flex items-center gap-8">
                <Link to="/dashboard" className="text-[15px] font-medium text-slate-300 hover:text-white transition-all hover:-translate-y-0.5">Dashboard</Link>
                <Link to="/chat" className="text-[15px] font-medium text-slate-300 hover:text-white transition-all hover:-translate-y-0.5">AI Assistant</Link>
                <Link to="/insights" className="text-[15px] font-medium text-slate-300 hover:text-white transition-all hover:-translate-y-0.5">Insights</Link>
              </div>

              {/* Right: CTA & Hidden Auth */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <GoogleAuthButton />
                </div>
                <SpotlightButton 
                  onClick={() => window.location.href = '/'}
                  className="!h-11 !px-7 !rounded-full !text-[15px] font-bold tracking-wide shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all"
                >
                  Home
                </SpotlightButton>
              </div>

            </nav>
          </div>

          {/* ── Page Content ── */}
          <div className={`w-full flex-1 flex flex-col ${location.pathname === "/chat" ? "" : "max-w-6xl mx-auto px-4 pb-4 md:px-6 md:pb-6 mt-6"}`}>
            <Outlet />
          </div>

          {/* ── Footer ── */}
          {location.pathname !== "/chat" && (
            <footer className="w-full flex-shrink-0 flex flex-col items-center justify-center text-center text-slate-600 text-[10px] font-mono py-8 border-t border-white/5 gap-1.5 mt-auto mb-2">
              <p className="text-slate-400 text-xs font-semibold">Built with Google AI Studio & Gemini for Vibe2Ship Hackathon 2026</p>
              <p className="text-slate-600">Problem Statement 1: "The Last-Minute Life Saver" · Powered by Gemini 2.0 Flash</p>
            </footer>
          )}
        </div>
      )}
    </div>
  );
}
