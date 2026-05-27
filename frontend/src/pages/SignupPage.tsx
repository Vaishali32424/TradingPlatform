import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { PasswordInput } from "../components/PasswordInput";
import { ForexWordmark } from "../components/ForexWordmark";
import { toastSuccess } from "../utils/toast";
import { ModalShell } from "../components/ModalShell";

export default function SignupPage() {
  const [params] = useSearchParams();
  const brokerId = params.get("brokerId") ?? "";
  const navigate = useNavigate();
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  const validate = () => {
    const errors: Record<string, string> = {};
    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const aadhar = form.aadharNumber.trim();
    const pan = form.panNumber.trim().toUpperCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name) errors.name = "Name is required";
    if (phone && phone.replace(/\D/g, "").length < 10) errors.phone = "Phone must be at least 10 digits";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
    if (!/^\d{12}$/.test(aadhar)) errors.aadharNumber = "Aadhar must be exactly 12 digits";
    if (!panRegex.test(pan)) errors.panNumber = "PAN must be like ABCDE1234F";
    if (password.length < 6) errors.password = "Password must be at least 6 characters";
    if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setShowReview(true);
  };

  const submitToBroker = async () => {
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
      toastSuccess(`Signup request sent! User ID: ${data.userId}. You can log in only after broker approval.`);
      setShowReview(false);
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
        <div className="flex justify-center pb-2">
          <ForexWordmark variant="dark" size="md" />
        </div>
        <h1 className="text-xl font-bold text-center">Create account</h1>
        {brokerId ? (
          <p className="text-sm text-slate-400">
            Registering under broker ID: <strong className="text-white">{brokerId}</strong>
          </p>
        ) : (
          <p className="text-sm text-amber-400">Open the link your broker shared (includes brokerId).</p>
        )}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Full name</label>
          <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Phone (optional)</label>
          <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Email (optional)</label>
          <input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Aadhar number</label>
          <input
            className="input-field"
            required
            maxLength={12}
            value={form.aadharNumber}
            onChange={(e) => setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, "") })}
          />
          {fieldErrors.aadharNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.aadharNumber}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">PAN</label>
          <input
            className="input-field"
            required
            maxLength={10}
            value={form.panNumber}
            onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
          />
          {fieldErrors.panNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.panNumber}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Password</label>
          <PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Confirm password</label>
          <PasswordInput required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>Continue</button>
        <Link to="/login" className="block text-center text-sm text-brand-500">Already have an account?</Link>
      </form>

      {showReview && (
        <ModalShell title="Confirm signup details" onClose={() => setShowReview(false)}>
          <div className="space-y-3 text-sm">
            <p className="text-slate-300">
              Your request will be sent to broker <span className="font-semibold text-white">{brokerId}</span>. Account becomes active only after approval.
            </p>
            <div className="rounded-lg border border-slate-700/60 p-3 space-y-1 text-slate-300">
              <p><span className="text-slate-400">Name:</span> {form.name}</p>
              <p><span className="text-slate-400">Phone:</span> {form.phone || "—"}</p>
              <p><span className="text-slate-400">Email:</span> {form.email || "—"}</p>
              <p><span className="text-slate-400">Aadhar:</span> {form.aadharNumber}</p>
              <p><span className="text-slate-400">PAN:</span> {form.panNumber.toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setShowReview(false)} disabled={loading}>
                Edit
              </button>
              <button type="button" className="btn-primary flex-1" onClick={submitToBroker} disabled={loading}>
                {loading ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
