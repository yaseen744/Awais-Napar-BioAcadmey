import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle, MinusCircle, RotateCcw, LayoutDashboard, ShieldAlert } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import CountUp from "../components/CountUp";

export default function ResultPage() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/attempts/${id}`)
      .then(({ data }) => {
        setAttempt(data);
        if (data.scorePercent >= 60) {
          fireConfetti();
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load result."))
      .finally(() => setLoading(false));
  }, [id]);

  function fireConfetti() {
    const colors = ["#c9992f", "#e6c876", "#f0d78c"];
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.35 },
        colors,
        startVelocity: 32,
        scalar: 0.9,
      });
    }, 350);
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-10">
        {loading && (
          <div className="h-64 bg-black/5 rounded-md shimmer relative overflow-hidden" />
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {attempt && (
          <>
            {attempt.terminatedReason && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-[var(--danger)] text-sm px-4 py-3 rounded-sm mb-4">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <span>
                  <b>Attempt ended early:</b> {attempt.terminatedReason} Only the questions you'd
                  answered before that were submitted.
                </span>
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-gradient-to-br from-[var(--navy-950)] via-[var(--navy-800)] to-[var(--navy-950)] text-[var(--paper)] rounded-xl p-8 text-center mb-8 border border-[var(--gold-500)]/20 shadow-[0_20px_50px_-20px_rgba(10,22,40,0.5)]"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-300)]">
                {attempt.subject} · {attempt.chapter}
              </span>
              <p className="font-display text-7xl font-semibold mt-2 foil-text">
                <CountUp value={attempt.scorePercent} suffix="%" />
              </p>
              <p className="text-[var(--paper)]/60 mt-1">
                {attempt.correctCount} of {attempt.totalQuestions} correct
              </p>

              <div className="flex justify-center gap-6 mt-6 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[var(--success)]" />
                  <b className="text-[var(--success)]">{attempt.correctCount}</b> correct
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle size={15} className="text-[var(--danger)]" />
                  <b className="text-[var(--danger)]">{attempt.incorrectCount}</b> incorrect
                </span>
                <span className="flex items-center gap-1.5">
                  <MinusCircle size={15} className="text-[var(--gold-300)]" />
                  <b className="text-[var(--gold-300)]">{attempt.unattemptedCount}</b> skipped
                </span>
              </div>
            </motion.div>

            <h2 className="font-display text-xl text-[var(--navy-950)] mb-3">Review answers</h2>

            <div className="space-y-3">
              {attempt.answers.map((a, idx) => {
                const q = a.question;
                if (!q) return null;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.5), duration: 0.3 }}
                    className="bg-white border border-black/10 rounded-md p-5"
                  >
                    <p className="font-medium text-[var(--navy-950)] mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectOpt = oIdx === q.correctIndex;
                        const isSelectedOpt = oIdx === a.selectedIndex;
                        let style = "border-black/10";
                        if (isCorrectOpt) style = "border-[var(--success)] bg-green-50";
                        else if (isSelectedOpt && !isCorrectOpt)
                          style = "border-[var(--danger)] bg-red-50";

                        return (
                          <div
                            key={oIdx}
                            className={`text-sm px-3 py-2 rounded-sm border ${style} flex items-center gap-2`}
                          >
                            <span className="font-mono text-xs opacity-60">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                            {isCorrectOpt && (
                              <span className="ml-auto text-xs text-[var(--success)] font-semibold">
                                Correct
                              </span>
                            )}
                            {isSelectedOpt && !isCorrectOpt && (
                              <span className="ml-auto text-xs text-[var(--danger)] font-semibold">
                                Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-8">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Link
                  to="/test/new"
                  className="flex items-center justify-center gap-2 bg-[var(--navy-950)] text-[var(--paper)] font-semibold py-3 rounded-sm hover:bg-[var(--navy-800)]"
                >
                  <RotateCcw size={16} /> Take another test
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 border border-black/15 font-semibold py-3 rounded-sm hover:border-[var(--navy-950)]"
                >
                  <LayoutDashboard size={16} /> Back to dashboard
                </Link>
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
