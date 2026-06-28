import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Card {
  image: string;
  title: string;
  description: string;
  href?: string;
}

interface StackedCardsInteractionProps {
  cards: Card[];
}

export function StackedCardsInteraction({ cards }: StackedCardsInteractionProps) {
  const [stack, setStack] = useState<Card[]>(cards);
  const [exiting, setExiting] = useState(false);

  const handleNext = () => {
    if (exiting || stack.length <= 1) return;
    setExiting(true);
    setTimeout(() => {
      setStack(prev => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      setExiting(false);
    }, 300);
  };

  // How many back-cards to show (max 3 total)
  const visibleCards = stack.slice(0, Math.min(3, stack.length));

  return (
    <div className="relative flex items-center justify-center" style={{ height: 340, width: "100%" }}>
      {visibleCards.map((card, i) => {
        const isTop = i === 0;
        // Back cards: smaller, offset down, lower z
        const scale = 1 - i * 0.06;
        const yOffset = i * 16;
        const zIndex = visibleCards.length - i;

        return (
          <motion.div
            key={card.title + i}
            layout
            animate={{
              scale,
              y: yOffset,
              opacity: 1 - i * 0.15,
              rotate: i === 1 ? -2 : i === 2 ? 2 : 0,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            style={{ zIndex, position: "absolute" }}
            className="w-64 cursor-pointer select-none"
            onClick={isTop ? handleNext : undefined}
          >
            <div
              className={`rounded-2xl overflow-hidden border shadow-2xl transition-all duration-200
                ${isTop ? "border-white/10 hover:border-white/20 hover:shadow-[0_8px_40px_rgba(99,102,241,0.25)]" : "border-white/[0.05]"}
              `}
              style={{ background: "linear-gradient(160deg, #0f1a2e 0%, #0a0f1e 100%)" }}
            >
              {/* Image */}
              <div className="h-36 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${isTop ? "hover:scale-105" : ""}`}
                  draggable={false}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="w-8 h-[2px] bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mb-3" />
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.15em] mb-1">Feature</p>
                <h3 className="text-white font-semibold text-[15px] leading-snug mb-1">{card.title}</h3>
                <p className="text-slate-400 text-[12px] leading-relaxed">{card.description}</p>

                {isTop && (
                  <p className="mt-3 text-[11px] text-slate-600">Tap card to see next →</p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Tap hint */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5 pb-1">
        {stack.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${i === 0 ? "w-5 bg-indigo-400" : "w-1.5 bg-slate-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
