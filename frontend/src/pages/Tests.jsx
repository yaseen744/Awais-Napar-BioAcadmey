import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ClipboardList,
  Lock,
  Unlock,
  Shuffle,
  ListChecks,
  Timer,
  PlayCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function Tests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState(null);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    api
      .get("/tests")
      .then(({ data }) => setTests(data))
      .catch(() => setError("Could not load tests."));
  }, []);

  async function handleStart(test) {
    if (!test.isOpen) return;
    setStartingId(test._id);
    setError("");
    try {
      const { data } = await api.post(`/tests/${test._id}/start`);
      navigate("/test/run", {
        state: {
          questions: data.questions,
          subject: data.subject,
          chapter: data.chapter,
          testId: data.testId,
          title: data.title,
          duration: data.duration,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not start this test.");
      setStartingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="font-display text-3xl text-[var(--navy-950)] mb-1 flex items-center gap-2">
          <ClipboardList size={26} className="text-[var(--gold-500)]" /> Tests
        </h1>
        <p className="text-[var(--ink-soft)] mb-6">
          Instructor-configured tests. Closed tests are still viewable but can't be started.
        </p>

        {error && (
          <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {tests === null && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-black/5 rounded-md animate-pulse" />
            ))}
          </div>
        )}

        {tests?.length === 0 && (
          <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)]">
            No tests have been published yet. Check back soon.
          </div>
        )}

        <div className="space-y-4">
          {tests?.map((t) => (
            <div key={t._id} className="bg-white border border-black/10 rounded-md p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg text-[var(--navy-950)]">{t.title}</h2>
                  <p className="text-xs text-[var(--ink-soft)] uppercase tracking-wide mt-0.5">
                    {t.subject} · {t.chapter}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    t.isOpen
                      ? "bg-green-50 text-[var(--success)] border border-green-200"
                      : "bg-red-50 text-[var(--danger)] border border-red-200"
                  }`}
                >
                  {t.isOpen ? <Unlock size={12} /> : <Lock size={12} />}
                  {t.isOpen ? "Open" : "Closed"}
                </span>
              </div>

              {t.description && (
                <p className="text-sm text-[var(--ink-soft)] mt-2">{t.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--ink-soft)]">
                <span className="flex items-center gap-1.5">
                  {t.selectionMode === "random" ? <Shuffle size={13} /> : <ListChecks size={13} />}
                  {t.questionsPerAttempt} question(s) per attempt
                  {t.selectionMode === "random" && ` (random from ${t.totalAvailableQuestions})`}
                </span>
                {t.duration && (
                  <span className="flex items-center gap-1.5">
                    <Timer size={13} /> {t.duration} minutes
                  </span>
                )}
              </div>

              {t.attempted ? (
                <div className="mt-4">
                  <Link
                    to={`/result/${t.attemptId}`}
                    className="inline-flex items-center gap-2 bg-black/5 text-[var(--navy-950)] font-semibold px-5 py-2.5 rounded-sm hover:bg-black/10"
                  >
                    <CheckCircle2 size={16} className="text-[var(--success)]" />
                    View your result ({t.attemptScore}%)
                  </Link>
                  <p className="text-xs text-[var(--ink-soft)] mt-1.5">
                    You've already attempted this test — only one attempt is allowed. Ask your
                    admin if you need it reset.
                  </p>
                </div>
              ) : t.isOpen ? (
                <button
                  onClick={() => handleStart(t)}
                  disabled={startingId === t._id}
                  className="mt-4 flex items-center gap-2 bg-[var(--navy-950)] text-[var(--paper)] font-semibold px-5 py-2.5 rounded-sm hover:bg-[var(--navy-800)] disabled:opacity-60"
                >
                  {startingId === t._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <PlayCircle size={16} />
                  )}
                  {startingId === t._id ? "Preparing..." : "Start test"}
                </button>
              ) : (
                <div className="mt-4">
                  <button
                    disabled
                    className="flex items-center gap-2 bg-black/5 text-[var(--ink-soft)] font-semibold px-5 py-2.5 rounded-sm cursor-not-allowed"
                  >
                    <Lock size={16} /> Test Closed
                  </button>
                  <p className="text-xs text-[var(--ink-soft)] mt-1.5">
                    This test is currently closed by the instructor.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
