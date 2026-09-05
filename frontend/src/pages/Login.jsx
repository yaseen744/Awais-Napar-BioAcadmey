import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import VoidBackground from "../components/VoidBackground";
import SealBadge from "../components/SealBadge";
import CenterLoadingOverlay from "../components/CenterLoadingOverlay";

export default function Login() {
  const { login, verifyOtp, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [otpStage, setOtpStage] = useState(null); // null | { userId, message }
  const [otp, setOtp] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.ok) {
      navigate("/dashboard");
    } else if (result.otpRequired) {
      setOtpStage({ userId: result.userId, message: result.message });
      setOtp("");
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const result = await verifyOtp(otpStage.userId, otp);
    if (result.ok) navigate("/dashboard");
  }

  async function handleResend() {
    setOtp("");
    const result = await login(form.email, form.password);
    if (result.otpRequired) {
      setOtpStage({ userId: result.userId, message: result.message });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--void)] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <CenterLoadingOverlay active={loading} label={otpStage ? "Verifying…" : "Signing in…"} />
      <VoidBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[880px] relative z-10"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] border border-[var(--gold-500)]/20 grid md:grid-cols-[0.82fr_1.18fr] bg-[#0d1830]">
          {/* Stub panel — the "admit card" identity strip */}
          <div className="relative bg-gradient-to-br from-[var(--navy-950)] via-[var(--navy-800)] to-[var(--navy-950)] text-[var(--paper)] px-8 py-10 md:py-12 flex flex-col justify-between overflow-hidden">
            {/* faint decorative rule pattern */}
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
                MDCAT Preparation Portal
              </p>
            </div>

            <div className="relative hidden md:block space-y-3 mt-10">
              <p className="text-sm text-white/55 leading-relaxed font-display italic">
                "Discipline today, admission tomorrow."
              </p>
              <div className="flex items-center gap-2 text-[11px] text-white/40 pt-3 border-t border-white/10">
                <ShieldCheck size={14} className="text-[var(--gold-500)] shrink-0" />
                Secure candidate authentication
              </div>
            </div>
          </div>

          {/* Divider notches — horizontal on mobile, vertical on desktop */}
          <span className="hidden md:block absolute w-5 h-5 rounded-full bg-[var(--void)]" style={{ left: "calc(41% - 10px)", top: "40px" }} />
          <span className="hidden md:block absolute w-5 h-5 rounded-full bg-[var(--void)]" style={{ left: "calc(41% - 10px)", bottom: "40px" }} />

          {/* Form panel */}
          <div className="bg-[var(--paper)] exam-paper px-7 py-10 md:px-11 md:py-12 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[var(--ink)]/12 relative">
            {!otpStage ? (
              <>
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--gold-500)] font-semibold">
                  Candidate Sign-In
                </p>
                <h1 className="font-display text-[26px] text-[var(--ink)] font-semibold mt-1.5">
                  Welcome back
                </h1>
                <p className="text-sm text-[var(--ink-soft)] mt-1.5">
                  Enter your credentials to access your dashboard.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
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

                  <Field icon={Lock} label="Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        className="input-light pr-10"
                        placeholder="Your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>

                  {error && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-snug">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[var(--gold-500)] to-[var(--gold-300)] text-[var(--navy-950)] font-semibold py-3 rounded-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_28px_-10px_rgba(201,153,47,0.55)]"
                  >
                    <GraduationCap size={17} />
                    {loading ? "Signing in…" : "Log in"}
                  </button>
                </form>

                <p className="text-center text-sm text-[var(--ink-soft)] mt-7">
                  New here?{" "}
                  <Link to="/register" className="text-[var(--gold-500)] font-semibold hover:text-[var(--gold-300)] transition-colors">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => setOtpStage(null)}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] mb-4"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--gold-500)] font-semibold">
                  One-time code
                </p>
                <h1 className="font-display text-[26px] text-[var(--ink)] font-semibold mt-1.5">
                  Ask your admin for the code
                </h1>
                <p className="text-sm text-[var(--ink-soft)] mt-1.5">
                  {otpStage.message || "A 6-digit login code was sent to the admin's email. Ask them for it."}
                </p>

                <form onSubmit={handleVerifyOtp} className="mt-7 space-y-4">
                  <Field icon={KeyRound} label="6-digit code">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="input-light tracking-[0.5em] text-center text-lg font-mono"
                      placeholder="000000"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </Field>

                  {error && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-snug">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-[var(--gold-500)] to-[var(--gold-300)] text-[var(--navy-950)] font-semibold py-3 rounded-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_28px_-10px_rgba(201,153,47,0.55)]"
                  >
                    <ShieldCheck size={17} />
                    {loading ? "Verifying…" : "Verify & log in"}
                  </button>
                </form>

                <p className="text-center text-sm text-[var(--ink-soft)] mt-7">
                  Didn't get a code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-[var(--gold-500)] font-semibold hover:text-[var(--gold-300)] transition-colors disabled:opacity-60"
                  >
                    Resend
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
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
