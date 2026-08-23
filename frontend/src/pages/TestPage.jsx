import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, ChevronLeft, ChevronRight, Send, Check } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function TestPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const questions = state?.questions || [];
  const subject = state?.subject;
  const chapter = state?.chapter;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!questions.length) {
      navigate("/test/new", { replace: true });
    }
  }, [questions, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!questions.length) return null;

  const q = questions[current];
  const answeredCount = Object.keys(selected).length;

  function pick(qId, idx) {
    setSelected((prev) => ({ ...prev, [qId]: idx }));
  }

  function goTo(idx) {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function handleSubmit() {
    setSubmitting(true);
    const answers = questions.map((qq) => ({
      questionId: qq._id,
      selectedIndex: selected[qq._id] ?? null,
    }));

    try {
      const { data } = await api.post("/attempts", {
        subject,
        chapter,
        timeTakenSeconds: seconds,
        answers,
      });
      navigate(`/result/${data._id}`, { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Could not submit the test.");
      setSubmitting(false);
    }
  }

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-[var(--navy-950)]">
            Question {current + 1} of {questions.length}
          </span>
          <span className="font-mono text-sm text-[var(--ink-soft)] bg-white border border-black/10 px-2.5 py-1 rounded-sm flex items-center gap-1.5">
            <Timer size={13} />
            {formatTime(seconds)}
          </span>
        </div>

        <div className="w-full h-1.5 bg-black/10 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--gold-500)] to-[var(--gold-300)]"
            animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={q._id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border border-black/10 rounded-md p-6 exam-paper"
            >
              {q.source && (
                <span className="inline-block text-xs font-mono text-[var(--ink-soft)] mb-3">
                  {q.source}
                </span>
              )}
              <p className="font-display text-lg text-[var(--navy-950)] mb-6 leading-snug">
                {q.text}
              </p>

              <div className="space-y-2.5">
                {q.options.map((opt, idx) => {
                  const isSelected = selected[q._id] === idx;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => pick(q._id, idx)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-sm border transition-colors ${
                        isSelected
                          ? "border-[var(--navy-950)] bg-[var(--navy-950)]/5"
                          : "border-black/12 hover:border-[var(--gold-500)]"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 flex-shrink-0 rounded-full border flex items-center justify-center text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-[var(--navy-950)] text-[var(--paper)] border-[var(--navy-950)]"
                            : "border-black/25 text-[var(--ink-soft)]"
                        }`}
                      >
                        {isSelected ? <Check size={12} /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-[var(--ink)] pt-0.5">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => goTo(Math.max(0, current - 1))}
            disabled={current === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-[var(--navy-950)] disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span className="text-xs text-[var(--ink-soft)]">{answeredCount} answered</span>

          {current < questions.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => goTo(current + 1)}
              className="flex items-center gap-1 px-5 py-2 text-sm font-semibold bg-[var(--navy-950)] text-[var(--paper)] rounded-sm hover:bg-[var(--navy-800)]"
            >
              Next <ChevronRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[var(--gold-500)] text-[var(--navy-950)] rounded-sm hover:bg-[var(--gold-300)] disabled:opacity-60"
            >
              <Send size={15} />
              {submitting ? "Submitting..." : "Submit test"}
            </motion.button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-1.5">
          {questions.map((qq, idx) => {
            const answered = selected[qq._id] !== undefined;
            return (
              <button
                key={qq._id}
                onClick={() => goTo(idx)}
                className={`w-8 h-8 text-xs rounded-sm font-mono border transition-all ${
                  idx === current
                    ? "border-[var(--gold-500)] bg-[var(--gold-500)]/20 scale-110"
                    : answered
                    ? "border-[var(--navy-950)]/30 bg-[var(--navy-950)]/5"
                    : "border-black/15"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
