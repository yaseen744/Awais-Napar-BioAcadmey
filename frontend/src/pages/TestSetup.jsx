import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Atom, FlaskConical, Dna, Languages, Brain, PlayCircle } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const SUBJECT_ICONS = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Dna,
  English: Languages,
  "Logical Reasoning": Brain,
};

export default function TestSetup() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState([]);
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/questions/meta")
      .then(({ data }) => {
        setMeta(data);
        if (data.length > 0) setSubject(data[0]._id);
      })
      .catch(() => setError("Could not load question bank."))
      .finally(() => setLoading(false));
  }, []);

  const currentSubjectMeta = meta.find((m) => m._id === subject);
  const chapters = currentSubjectMeta?.chapters || [];

  async function handleStart() {
    setStarting(true);
    setError("");
    try {
      const { data } = await api.get("/questions", {
        params: { subject, chapter: chapter || undefined, limit: count },
      });
      if (!data || data.length === 0) {
        setError("No questions found for this selection.");
        setStarting(false);
        return;
      }
      navigate("/test/run", { state: { questions: data, subject, chapter: chapter || "Mixed" } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not start the test.");
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-3xl text-[var(--navy-950)] mb-1">Build a test</h1>
        <p className="text-[var(--ink-soft)] mb-8">
          Pick a subject and chapter, then start practicing.
        </p>

        {loading && (
          <div className="bg-white border border-black/10 rounded-md p-6 space-y-5 animate-pulse">
            <div className="h-4 w-24 bg-black/10 rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-black/10 rounded-sm" />
              <div className="h-9 w-24 bg-black/10 rounded-sm" />
              <div className="h-9 w-24 bg-black/10 rounded-sm" />
            </div>
          </div>
        )}

        {!loading && meta.length === 0 && (
          <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)]">
            No questions in the bank yet. Ask an admin to add some, or run the seed script.
          </div>
        )}

        {!loading && meta.length > 0 && (
          <div className="bg-white border border-black/10 rounded-md p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-2">
                Subject
              </label>
              <div className="flex flex-wrap gap-2">
                {meta.map((m) => {
                  const Icon = SUBJECT_ICONS[m._id] || Atom;
                  return (
                    <button
                      key={m._id}
                      onClick={() => {
                        setSubject(m._id);
                        setChapter("");
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium border transition-colors ${
                        subject === m._id
                          ? "bg-[var(--navy-950)] text-[var(--paper)] border-[var(--navy-950)]"
                          : "border-black/15 text-[var(--ink)] hover:border-[var(--navy-950)]"
                      }`}
                    >
                      <Icon size={15} />
                      {m._id} <span className="opacity-60">({m.total})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-2">
                Chapter (optional — leave blank for mixed)
              </label>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full px-3 py-2 border border-black/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-500)]"
              >
                <option value="">All chapters (mixed)</option>
                {chapters.map((c) => (
                  <option key={c.chapter} value={c.chapter}>
                    {c.chapter} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-2">
                Number of questions
              </label>
              <div className="flex gap-2">
                {[10, 20, 30, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded-sm text-sm font-medium border transition-colors ${
                      count === n
                        ? "bg-[var(--gold-500)] text-[var(--navy-950)] border-[var(--gold-500)]"
                        : "border-black/15 hover:border-[var(--gold-500)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full bg-[var(--navy-950)] text-[var(--paper)] font-semibold py-3 rounded-sm hover:bg-[var(--navy-800)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <PlayCircle size={18} />
              {starting ? "Preparing test..." : "Start test"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
