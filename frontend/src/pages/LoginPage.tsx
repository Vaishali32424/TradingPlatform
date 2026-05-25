import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { ForexWordmark } from "../components/ForexWordmark";

const roleHome: Record<string, string> = {
  superadmin: "/superadmin",
  broker: "/broker",
  user: "/user/home",
};

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(roleHome[user.role] ?? "/login", { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(loginId.trim(), password);
      const me = await api.get("/auth/me");
      navigate(roleHome[me.data.user.role] ?? "/login");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? "Login failed. Check your ID, email, and password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-surface to-slate-900">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <ForexWordmark variant="dark" size="lg" />
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Login ID or email</label>
            <input
              className="input-field"
              placeholder="ID or email"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
