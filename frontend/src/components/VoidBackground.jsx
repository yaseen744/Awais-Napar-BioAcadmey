import { useMemo } from "react";
import { motion } from "framer-motion";

// Ambient floating gold particles in the dark void — like dust catching
// light in an exam hall. Pure decoration, kept subtle and slow.
export default function VoidBackground({ count = 22 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        size: 2 + Math.random() * 3,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 12 + Math.random() * 10,
        delay: Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* soft radial glows */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(201,153,47,0.10), transparent 65%)" }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(28,59,115,0.35), transparent 65%)" }}
      />

      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[var(--gold-300)]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -18, 0], opacity: [p.opacity, p.opacity * 1.6, p.opacity] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
