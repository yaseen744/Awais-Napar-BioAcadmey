import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePlus2,
  PlayCircle,
  BookOpen,
  Trophy,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/test/new", label: "New Test", icon: FilePlus2 },
  { to: "/videos", label: "Videos", icon: PlayCircle },
  { to: "/notes", label: "Notes", icon: BookOpen },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/community", label: "Community", icon: Users },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const allLinks = user?.role === "admin" ? [...LINKS, { to: "/admin", label: "Admin", icon: ShieldCheck, admin: true }] : LINKS;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 glass text-[var(--paper)]">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-full bg-[var(--gold-500)] text-[var(--navy-950)] font-display font-bold flex items-center justify-center text-sm border-2 border-[var(--gold-300)] shadow-[0_0_14px_rgba(201,153,47,0.4)]">
            AN
          </span>
          <span className="font-display text-lg tracking-tight hidden sm:inline foil-text font-semibold">
            Awais Napar Bioacademy
          </span>
        </Link>

        {user && (
          <>
            <nav className="hidden md:flex items-center gap-1 text-sm overflow-x-auto">
              {allLinks.map(({ to, label, icon: Icon, admin }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-sm transition-colors whitespace-nowrap ${
                      active
                        ? admin
                          ? "text-[var(--gold-300)]"
                          : "text-[var(--gold-300)]"
                        : admin
                        ? "text-[var(--gold-300)]/70 hover:text-[var(--gold-300)]"
                        : "text-[var(--paper)]/75 hover:text-[var(--gold-300)]"
                    }`}
                  >
                    <Icon size={15} strokeWidth={2} />
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-2 right-2 -bottom-[1px] h-[2px] bg-[var(--gold-500)] rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 pl-4 border-l border-white/15 shrink-0">
              <span className="text-[var(--paper)]/70 text-sm hidden lg:inline truncate max-w-[140px]">
                {user.name}
              </span>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleLogout}
                title="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[var(--gold-500)]/50 text-[var(--gold-300)] hover:bg-[var(--gold-500)] hover:text-[var(--navy-950)] transition-colors text-xs font-semibold uppercase tracking-wide"
              >
                <LogOut size={13} strokeWidth={2.5} />
                <span className="hidden sm:inline">Log out</span>
              </motion.button>
            </div>
          </>
        )}
      </div>

      {user && (
        <nav className="md:hidden flex items-center gap-3 overflow-x-auto px-5 pb-2.5 text-xs border-t border-white/10 pt-2">
          {allLinks.map(({ to, label, icon: Icon, admin }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1 whitespace-nowrap ${
                admin ? "text-[var(--gold-300)]" : "text-[var(--paper)]/75 hover:text-[var(--gold-300)]"
              }`}
            >
              <Icon size={13} /> {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
