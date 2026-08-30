import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, ChevronLeft, ChevronRight, Send, Check, Maximize, ShieldAlert } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function requestFullscreenCompat(el) {
  const fn =
    el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (!fn) return Promise.reject(new Error("Fullscreen not supported"));
  return fn.call(el);
}

function exitFullscreenCompat() {
  const fn =
    document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
  if (fn && document.fullscreenElement) fn.call(document).catch(() => {});
}

function isCurrentlyFullscreen() {
  return Boolean(
    document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement
  );
}

export default function TestPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const questions = state?.questions || [];
  const subject = state?.subject;
  const chapter = state?.chapter;
  const testId = state?.testId; // present when this is an admin-configured Test attempt
  const testTitle = state?.title;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // --- Anti-cheating guard state ---
  // The exam only actually starts once the student enters fullscreen. From
  // that point on, switching tabs/apps or leaving fullscreen immediately
  // force-submits whatever was answered so far and ends the attempt.
  const [examStarted, setExamStarted] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [terminating, setTerminating] = useState(false);
  const terminatedRef = useRef(false);
  const examStartedRef = useRef(false);
  const stateRef = useRef({ selected: {}, seconds: 0 });

  useEffect(() => {
    stateRef.current = { selected, seconds };
  }, [selected, seconds]);

  useEffect(() => {
    if (!questions.length) {
      navigate("/test/new", { replace: true });
    }
  }, [questions, navigate]);

  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [examStarted]);

  // Guard: tab switch (visibilitychange) or leaving fullscreen -> terminate.
  useEffect(() => {
    if (!examStarted) return;

    function handleVisibility() {
      if (document.hidden) terminateExam("You switched away from the test tab.");
    }
    function handleFullscreenChange() {
      if (fullscreenSupported && !isCurrentlyFullscreen()) {
        terminateExam("You exited fullscreen mode.");
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, fullscreenSupported]);

  async function handleEnterFullscreenAndStart() {
    try {
      await requestFullscreenCompat(document.documentElement);
      setFullscreenSupported(true);
    } catch {
      // Some devices (notably iOS Safari) don't support the Fullscreen API at
      // all. We still start the test and keep tab-switch detection active --
      // it's a best-effort deterrent, not a guarantee, on those devices.
      setFullscreenSupported(false);
    }
    examStartedRef.current = true;
    setExamStarted(true);
  }

  async function terminateExam(reason) {
    if (terminatedRef.current || submitting) return;
    terminatedRef.current = true;
    setTerminating(true);
    await handleSubmit(reason);
  }

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

  async function handleSubmit(terminatedReason) {
    setSubmitting(true);
    const { selected: latestSelected, seconds: latestSeconds } = stateRef.current;
    const answers = questions.map((qq) => ({
      questionId: qq._id,
      selectedIndex: latestSelected[qq._id] ?? null,
    }));

    try {
      const { data } = await api.post("/attempts", {
        subject,
        chapter,
        timeTakenSeconds: latestSeconds,
        answers,
        testId: testId || undefined,
        terminatedReason: terminatedReason || undefined,
      });
      exitFullscreenCompat();
      navigate(`/result/${data._id}`, {
        replace: true,
        state: terminatedReason ? { terminatedReason } : undefined,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Could not submit the test.");
      setSubmitting(false);
      setTerminating(false);
      terminatedRef.current = false;
    }
  }

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  // --- Pre-start gate: must enter fullscreen before questions are shown ---
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <Navbar />
        <main className="max-w-md mx-auto px-5 py-16 text-center">
          <ShieldAlert size={40} className="mx-auto text-[var(--gold-500)] mb-4" />
          <h1 className="font-display text-2xl text-[var(--navy-950)] mb-2">
            {testTitle || "Test"} — Ready to begin?
          </h1>
          <p className="text-[var(--ink-soft)] text-sm mb-6">
            This test runs in fullscreen. Once started, switching tabs/apps or leaving
            fullscreen will immediately end your attempt and submit whatever you've
            answered so far.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEnterFullscreenAndStart}
            className="flex items-center gap-2 mx-auto px-6 py-3 text-sm font-semibold bg-[var(--navy-950)] text-[var(--paper)] rounded-sm hover:bg-[var(--navy-800)]"
          >
            <Maximize size={16} /> Enter fullscreen &amp; start test
          </motion.button>
        </main>
      </div>
    );
  }

  if (terminating) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <p className="text-[var(--ink-soft)] text-sm">Ending your attempt…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-8">
        {!fullscreenSupported && (
          <p className="text-xs text-[var(--danger)] bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-4">
            Fullscreen isn't supported on this device. Tab-switch detection is still active —
            switching apps will still end your attempt.
          </p>
        )}

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-[var(--navy-950)]">
            {testTitle ? `${testTitle} — ` : ""}Question {current + 1} of {questions.length}
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
              onClick={() => handleSubmit()}
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
