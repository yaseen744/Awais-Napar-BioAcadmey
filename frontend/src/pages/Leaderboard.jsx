import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Medal, Trophy } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const MEDAL_COLORS = { 1: "#c9992f", 2: "#9aa3ad", 3: "#b0743f" };

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/leaderboard"), api.get("/leaderboard/me")])
      .then(([lb, me]) => {
        setRows(lb.data);
        setMyRank(me.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-3xl text-[var(--navy-950)] mb-1 flex items-center gap-2">
          <Trophy size={26} className="text-[var(--gold-500)]" /> Leaderboard
        </h1>
        <p className="text-[var(--ink-soft)] mb-6">
          Points are earned for every correct answer across all tests.
        </p>

        {myRank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-[var(--navy-950)] to-[var(--navy-800)] text-[var(--paper)] rounded-md p-5 flex items-center justify-between mb-6 border border-[var(--gold-500)]/20"
          >
            <div>
              <span className="text-xs uppercase tracking-wide text-[var(--gold-300)]">
                Your standing
              </span>
              <p className="font-display text-2xl foil-text font-semibold">#{myRank.rank}</p>
            </div>
            <p className="font-mono text-lg">{myRank.points} pts</p>
          </motion.div>
        )}

        {loading && (
          <div className="space-y-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-black/5 rounded-sm animate-pulse" />
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)] text-sm">
            No attempts yet — be the first to take a test!
          </div>
        )}

        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <motion.div
              key={r.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
              whileHover={{ scale: 1.01 }}
              className={`flex items-center gap-4 px-4 py-3 rounded-sm border transition-shadow hover:shadow-sm ${
                r.name === user?.name
                  ? "border-[var(--gold-500)] bg-[var(--gold-500)]/10"
                  : "border-black/10 bg-white"
              }`}
            >
              <span className="w-6 flex items-center justify-center">
                {r.rank <= 3 ? (
                  <Medal size={17} style={{ color: MEDAL_COLORS[r.rank] }} />
                ) : (
                  <span className="font-mono text-sm text-[var(--ink-soft)]">{r.rank}</span>
                )}
              </span>
              <span className="flex-1 font-medium text-[var(--navy-950)]">{r.name}</span>
              <span className="text-xs text-[var(--ink-soft)]">{r.solved} solved</span>
              <span className="text-xs text-[var(--ink-soft)] w-14 text-right">
                {r.accuracy}%
              </span>
              <span className="font-mono font-semibold text-[var(--navy-950)] w-16 text-right">
                {r.points} pts
              </span>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
