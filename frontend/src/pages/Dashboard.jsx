import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Target, ArrowRight, Sparkles, Users } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import TiltCard from "../components/TiltCard";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admins don't take tests themselves -- show recent attempts across ALL
    // students instead of their own (empty) history.
    const endpoint = isAdmin ? "/attempts" : "/attempts/me";
    api
      .get(endpoint)
      .then(({ data }) => setAttempts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attempts.length)
    : null;

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-10">
        {/* 3D holographic admit-card hero */}
        <TiltCard className="rounded-xl mb-8">
          <div
            className="bg-gradient-to-br from-[var(--navy-950)] via-[var(--navy-800)] to-[var(--navy-950)] text-[var(--paper)] rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-[0_20px_50px_-20px_rgba(10,22,40,0.5)] border border-[var(--gold-500)]/20"
            style={{ transform: "translateZ(30px)" }}
          >
            <div className="p-6 sm:p-7 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-300)] mb-1">
                {isAdmin ? "Instructor Dashboard" : "Candidate Dashboard"}
              </p>
              <h1 className="font-display text-3xl foil-text font-semibold">
                Welcome, {user?.name?.split(" ")[0]}
              </h1>
              <p className="text-[var(--paper)]/60 text-sm mt-1">
                {isAdmin
                  ? "Here's how your students are doing."
                  : "Here's where your practice stands."}
              </p>
            </div>
            <div className="ticket-perforation sm:border-t-0 sm:border-l-2 sm:border-dashed sm:border-white/20 bg-white/5 p-6 sm:p-7 flex flex-col justify-center gap-3 sm:w-64">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={isAdmin ? "/admin" : "/tests"}
                  className="inline-flex items-center justify-center gap-2 bg-[var(--gold-500)] text-[var(--navy-950)] font-semibold text-sm px-4 py-2.5 rounded-sm hover:bg-[var(--gold-300)] transition-colors w-full shadow-[0_8px_20px_-8px_rgba(201,153,47,0.6)]"
                >
                  {isAdmin ? (
                    <>
                      <Users size={16} /> Manage tests
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Start a new test
                    </>
                  )}
                </Link>
              </motion.div>
            </div>
          </div>
        </TiltCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <StatCard
            icon={ClipboardList}
            label={isAdmin ? "Attempts recorded" : "Tests taken"}
            value={attempts.length}
            delay={0.05}
          />
          <StatCard
            icon={Target}
            label={isAdmin ? "Average student score" : "Average score"}
            value={avgScore !== null ? `${avgScore}%` : "—"}
            delay={0.12}
          />
        </div>

        <h2 className="font-display text-xl text-[var(--navy-950)] mb-3">
          {isAdmin ? "Recent attempts (all students)" : "Recent attempts"}
        </h2>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative overflow-hidden h-16 bg-black/5 rounded-md shimmer" />
            ))}
          </div>
        )}

        {!loading && attempts.length === 0 && (
          <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center">
            <p className="text-[var(--ink-soft)]">
              {isAdmin
                ? "No student has taken a test yet."
                : "No attempts yet. Take your first test to see your results here."}
            </p>
            {!isAdmin && (
              <Link
                to="/tests"
                className="inline-flex items-center gap-1 mt-4 text-[var(--navy-800)] font-semibold hover:underline"
              >
                Start your first test <ArrowRight size={15} />
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2">
          {attempts.map((a, i) => (
            <motion.div
              key={a._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.35 }}
            >
              <Link
                to={`/result/${a._id}`}
                className="flex items-center justify-between bg-white border border-black/10 rounded-md px-4 py-3.5 hover:border-[var(--gold-500)] hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <p className="font-semibold text-[var(--navy-950)]">
                    {isAdmin && a.user ? `${a.user.name} — ` : ""}
                    {a.subject} · {a.chapter}
                    {a.test?.title ? ` (${a.test.title})` : ""}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)] font-mono mt-0.5">
                    {isAdmin && a.user?.email ? `${a.user.email} · ` : ""}
                    {a.correctCount}/{a.totalQuestions} correct ·{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`font-display text-2xl font-semibold ${
                    a.scorePercent >= 60 ? "text-[var(--success)]" : "text-[var(--danger)]"
                  }`}
                >
                  {a.scorePercent}%
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="bg-white border border-black/10 rounded-md p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
    >
      <span className="w-11 h-11 rounded-full bg-[var(--paper-dim)] text-[var(--navy-800)] flex items-center justify-center shrink-0">
        <Icon size={19} />
      </span>
      <div>
        <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">{label}</span>
        <p className="font-display text-2xl text-[var(--navy-950)]">{value}</p>
      </div>
    </motion.div>
  );
}
