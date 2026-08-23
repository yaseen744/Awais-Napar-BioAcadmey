import { AnimatePresence, motion } from "framer-motion";

// A centered, full-screen loading overlay — a soft blurred backdrop with a
// small card in the middle showing a status line and a gold progress bar
// that fills gradually. Used instead of (or alongside) inline button
// spinners for actions like signing in or creating an account.
export default function CenterLoadingOverlay({ active, label = "Loading…" }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--void)]/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-[260px] rounded-xl border border-[var(--gold-500)]/25 bg-gradient-to-br from-[var(--navy-950)] via-[var(--navy-800)] to-[var(--navy-950)] px-6 py-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
          >
            <p className="text-center font-display text-[15px] text-[var(--paper)] font-semibold tracking-wide">
              {label}
            </p>

            <div className="mt-4 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--gold-500)] via-[var(--gold-100)] to-[var(--gold-500)] shadow-[0_0_10px_rgba(201,153,47,0.6)]"
                initial={{ width: "0%" }}
                animate={{ width: "88%" }}
                transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <p className="text-center text-[10px] text-white/40 tracking-[0.2em] uppercase mt-3">
              Please wait
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
