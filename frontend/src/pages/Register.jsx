import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Lock, User, Clock3, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import VoidBackground from "../components/VoidBackground";
import SealBadge from "../components/SealBadge";
import CenterLoadingOverlay from "../components/CenterLoadingOverlay";

export default function Register() {
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (form.password !== form.confirm) {
      setLocalError("Passwords do not match.");
      return;
    }
    const result = await register(form.name, form.email, form.password);
    if (result.ok) setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[var(--void)] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <CenterLoadingOverlay active={loading} label="Creating account…" />
      <VoidBackground />

      <div className="w-full max-w-[880px] relative z-10">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-sm mx-auto rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] border border-[var(--gold-500)]/20"
            >
              <div className="bg-gradient-to-br from-[var(--navy-950)] via-[var(--navy-800)] to-[var(--navy-950)] px-6 py-8 text-center">
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                  className="inline-flex w-16 h-16 rounded-full border-[3px] border-double border-[var(--gold-500)] text-[var(--gold-300)] items-center justify-center mb-3 shadow-[0_0_25px_rgba(201,153,47,0.4)]"
                >
                  <Clock3 size={26} />
                </motion.span>
                <h1 className="font-display text-xl foil-text font-semibold">
                  Registration submitted
                </h1>
              </div>
              <div className="bg-[var(--paper)] exam-paper p-6">
                <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                  Your account has been created for{" "}
                  <b className="text-[var(--ink)]">{form.name}</b> and is now{" "}
                  <b className="text-[var(--gold-500)]">awaiting admin approval</b>. You'll be
                  able to log in as soon as it's approved.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 mt-6 text-[var(--gold-500)] font-semibold hover:text-[var(--gold-300)] transition-colors"
                >
                  Go to login →
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] border border-[var(--gold-500)]/20 grid md:grid-cols-[0.82fr_1.18fr] bg-[#0d1830]">
                {/* Stub panel */}
                <div className="relative bg-gradient-to-br from-[var(--navy-950)] via-[var(--navy-800)] to-[var(--navy-950)] text-[var(--paper)] px-8 py-10 md:py-12 flex flex-col justify-between overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, var(--gold-100) 0px, var(--gold-100) 1px, transparent 1px, transparent 14px)",
                    }}
                  />
                  <div className="relative">
                    <div className="ambient-glow">
                      <SealBadge tone="gold">AN</SealBadge>
                    </div>
                    <p className="font-display text-2xl foil-text font-semibold mt-5 leading-tight">
                      Awais Napar
                      <br />
                      Bioacademy
                    </p>
                    <p className="text-[10px] text-[var(--gold-300)]/80 tracking-[0.25em] uppercase mt-2">
                      New Candidate Registration
                    </p>
                  </div>

                  <div className="relative hidden md:block space-y-3 mt-10">
                    <p className="text-sm text-white/55 leading-relaxed font-display italic">
                      "Every topper was once a beginner."
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 pt-3 border-t border-white/10">
                      <ShieldCheck size={14} className="text-[var(--gold-500)] shrink-0" />
                      Reviewed and approved by admin
                    </div>
                  </div>
                </div>

                <span className="hidden md:block absolute w-5 h-5 rounded-full bg-[var(--void)]" style={{ left: "calc(41% - 10px)", top: "40px" }} />
                <span className="hidden md:block absolute w-5 h-5 rounded-full bg-[var(--void)]" style={{ left: "calc(41% - 10px)", bottom: "40px" }} />

                {/* Form panel */}
                <div className="bg-[var(--paper)] exam-paper px-7 py-10 md:px-11 md:py-12 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[var(--ink)]/12">
                  <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--gold-500)] font-semibold">
                    Create Account
                  </p>
                  <h1 className="font-display text-[26px] text-[var(--ink)] font-semibold mt-1.5">
                    Join the academy
                  </h1>
                  <p className="text-sm text-[var(--ink-soft)] mt-1.5 flex items-start gap-1.5">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-[var(--gold-500)]" />
                    Registration requires admin approval before you can log in.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <Field icon={User} label="Full name">
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="input-light"
                        placeholder="Ali Raza"
                        autoComplete="name"
                      />
                    </Field>

                    <Field icon={Mail} label="Email">
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="input-light"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field icon={Lock} label="Password">
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            minLength={6}
                            value={form.password}
                            onChange={handleChange}
                            className="input-light pr-9"
                            placeholder="6+ characters"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </Field>

                      <Field icon={Lock} label="Confirm">
                        <div className="relative">
                          <input
                            type={showConfirm ? "text" : "password"}
                            name="confirm"
                            required
                            value={form.confirm}
                            onChange={handleChange}
                            className="input-light pr-9"
                            placeholder="Retype"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </Field>
                    </div>

                    {(localError || error) && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                        {localError || error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[var(--gold-500)] to-[var(--gold-300)] text-[var(--navy-950)] font-semibold py-3 rounded-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_28px_-10px_rgba(201,153,47,0.55)]"
                    >
                      <UserPlus size={17} />
                      {loading ? "Creating account…" : "Register"}
                    </button>
                  </form>

                  <p className="text-center text-sm text-[var(--ink-soft)] mt-6">
                    Already registered?{" "}
                    <Link to="/login" className="text-[var(--gold-500)] font-semibold hover:text-[var(--gold-300)] transition-colors">
                      Log in
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1.5">
        <Icon size={13} /> {label}
      </label>
      {children}
    </div>
  );
}
