import React from "react";
import { motion } from "motion/react";

const bubbleConfigs = [
  {
    size: "h-24 w-24 md:h-32 md:w-32",
    className: "left-[2%] top-20 bg-primary/14",
    duration: 18,
    delay: 0,
  },
  {
    size: "h-16 w-16 md:h-24 md:w-24",
    className: "left-[14%] top-[58%] bg-white/55",
    duration: 14,
    delay: 1.2,
  },
  {
    size: "h-20 w-20 md:h-28 md:w-28",
    className: "right-[12%] top-24 bg-primary/10",
    duration: 16,
    delay: 0.8,
  },
  {
    size: "h-28 w-28 md:h-40 md:w-40",
    className: "right-[4%] top-[52%] bg-white/50",
    duration: 20,
    delay: 2.2,
  },
  {
    size: "h-14 w-14 md:h-20 md:w-20",
    className: "left-[44%] top-[18%] bg-primary/8",
    duration: 12,
    delay: 1.6,
  },
  {
    size: "h-12 w-12 md:h-16 md:w-16",
    className: "left-[52%] top-[76%] bg-white/45",
    duration: 13,
    delay: 2.8,
  },
];

export const AmbientBubbles = () => {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,79,0,0.14),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.9),transparent_18%),radial-gradient(circle_at_50%_62%,rgba(255,79,0,0.08),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 via-white/30 to-transparent" />

      {bubbleConfigs.map((bubble, index) => (
        <motion.div
          key={index}
          className={`ambient-bubble absolute rounded-full border border-white/50 shadow-[0_18px_60px_rgba(20,20,20,0.08)] backdrop-blur-xl ${bubble.size} ${bubble.className}`}
          animate={{
            y: [0, -8, 0, 4, 0],
            x: [0, 4, -3, 0],
            scale: [1, 1.02, 0.99, 1.01, 1],
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bubble.delay,
          }}
        >
          <div className="absolute inset-[14%] rounded-full border border-white/35" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.95),rgba(255,255,255,0.08)_36%,transparent_70%)] opacity-90" />
        </motion.div>
      ))}

      <motion.div
        className="absolute left-1/2 top-[12%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.38, 0.3] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default AmbientBubbles;
