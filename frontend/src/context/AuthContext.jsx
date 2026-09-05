import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

// Distinguishes "the server replied with an error" (validation, wrong
// password, etc.) from "the request never reached the server at all" --
// wrong API URL, backend not running, or blocked by CORS. Without this,
// every connection problem shows the same unhelpful generic message.
function getErrorMessage(err, fallback) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.request) {
    return "Could not reach the server. Check that the backend is running and VITE_API_URL points to it.";
  }
  return fallback;
}

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
      const message = getErrorMessage(err, "Registration failed.");
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
      if (data.otpRequired) {
        // Password was correct, but a login code was emailed to the admin --
        // the caller (Login page) needs to show the OTP entry step.
        return { otpRequired: true, userId: data.userId, message: data.message };
      }
      persist(data.token, data.user);
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err, "Login failed.");
      setError(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(userId, otp) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-otp", { userId, otp });
      persist(data.token, data.user);
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err, "Could not verify code.");
      setError(message);
      return { ok: false, message };
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
    <AuthContext.Provider value={{ user, loading, error, register, login, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
