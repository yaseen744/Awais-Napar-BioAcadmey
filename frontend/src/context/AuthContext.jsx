import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mdcat_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function persist(token, user) {
    localStorage.setItem("mdcat_token", token);
    localStorage.setItem("mdcat_user", JSON.stringify(user));
    setUser(user);
  }

  async function register(name, email, password) {
    setLoading(true);
    setError("");
    try {
      // Registration no longer logs the person in — the account is created
      // as "pending" and needs an admin to approve it first.
      const { data } = await api.post("/auth/register", { name, email, password });
      return { ok: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      setError(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persist(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("mdcat_token");
    localStorage.removeItem("mdcat_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
