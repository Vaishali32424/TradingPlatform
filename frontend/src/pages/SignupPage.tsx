import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { PasswordInput } from "../components/PasswordInput";
import { formatPersonLabel } from "../utils/displayName";
import { toastSuccess } from "../utils/toast";

export default function SignupPage() {
  const [params] = useSearchParams();
  const brokerId = params.get("brokerId") ?? "";
  const navigate = useNavigate();
  const [brokerName, setBrokerName] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    aadharNumber: "",
    panNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brokerId) return;
    api.get(`/user/broker-info/${brokerId}`).then((res) => {
      setBrokerName(res.data.name);
    }).catch(() => setBrokerName(""));
  }, [brokerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!brokerId) {
      setError("Missing broker link. Ask your broker for the signup URL.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/user/signup", {
        brokerId,
        ...form,
        panNumber: form.panNumber.toUpperCase(),
      });
      toastSuccess(`Account created! User ID: ${data.userId}. You can also log in with email.`);
      navigate("/login");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">Create account</h1>
        {brokerId ? (
          <p className="text-sm text-slate-400">
            Registering under broker:{" "}
            <strong className="text-white">
              {brokerName ? formatPersonLabel(brokerName, brokerId) : brokerId}
            </strong>
          </p>
        ) : (
          <p className="text-sm text-amber-400">Open the link your broker shared (includes brokerId).</p>
        )}
        <input className="input-field" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input-field" placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input
          className="input-field"
          placeholder="Aadhar number (12 digits)"
          required
          maxLength={12}
          value={form.aadharNumber}
          onChange={(e) => setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, "") })}
        />
        <input
          className="input-field"
          placeholder="PAN (e.g. ABCDE1234F)"
          required
          maxLength={10}
          value={form.panNumber}
          onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
        />
        <PasswordInput placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <PasswordInput placeholder="Confirm password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>Sign up</button>
        <Link to="/login" className="block text-center text-sm text-brand-500">Already have an account?</Link>
      </form>
    </div>
  );
}
