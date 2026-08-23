// A small "official seal" badge — the recurring signature motif across the
// app, echoing the stamp on a real admit card / roll-number slip.
export default function SealBadge({ children, tone = "gold" }) {
  const tones = {
    gold: "border-[var(--gold-500)] text-[var(--gold-500)]",
    navy: "border-[var(--navy-950)] text-[var(--navy-950)]",
    success: "border-[var(--success)] text-[var(--success)]",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-14 h-14 rounded-full border-2 ${tones[tone]} font-display text-xs font-semibold text-center leading-tight p-1`}
      style={{ borderStyle: "double", borderWidth: "3px" }}
    >
      {children}
    </span>
  );
}
