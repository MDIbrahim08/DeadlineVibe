import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedTextProps {
  text: string;
  textClassName?: string;
  underlinePath?: string;
  underlineHoverPath?: string;
  underlineDuration?: number;
}

export function AnimatedText({
  text,
  textClassName,
  underlinePath = "M 0,10 Q 75,0 150,10 Q 225,20 300,10",
  underlineHoverPath = "M 0,10 Q 75,20 150,10 Q 225,0 300,10",
  underlineDuration = 1.5,
}: AnimatedTextProps) {
  return (
    <motion.div className="relative inline-block group cursor-default" initial="initial" whileHover="hover" animate="animate">
      <span className={cn("relative z-10 block", textClassName)}>
        {text}
      </span>
      <svg
        className="absolute left-0 w-full overflow-visible"
        style={{ bottom: "-0.2em", height: "0.5em" }}
        viewBox="0 0 300 20"
        preserveAspectRatio="none"
      >
        <motion.path
          d={underlinePath}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-rose-500"
          variants={{
            initial: { pathLength: 0, opacity: 0 },
            animate: { 
              pathLength: 1, 
              opacity: 1, 
              transition: { duration: underlineDuration, ease: "easeInOut" } 
            },
            hover: {
              d: underlineHoverPath,
              transition: { duration: 0.3, ease: "easeInOut" }
            }
          }}
        />
      </svg>
    </motion.div>
  );
}
