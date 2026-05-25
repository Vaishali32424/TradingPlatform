import { useState } from "react";
import api from "../../api/client";
import type { Broker } from "../../types";
import { PasswordInput } from "../../components/PasswordInput";
import { formatPersonLabel } from "../../utils/displayName";
import { getApiErrorMessage, toastError, toastSuccess } from "../../utils/toast";

const empty = {
  name: "",
  relation: "",
  remark: "",
  email: "",
  bankAccountNumber: "",
  phone: "",
  address: "",
  ifscCode: "",
  aadharNumber: "",
  panNumber: "",
  password: "",
  confirmPassword: "",
};

export function BrokerFormModal({
  broker,
  onClose,
  onSaved,
}: {
  broker: Broker | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    broker
      ? {
          name: broker.name,
          relation: broker.relation ?? "",
          remark: broker.remark ?? "",
          email: broker.email ?? "",
          bankAccountNumber: broker.bankAccountNumber,
          phone: broker.phone,
          address: broker.address,
          ifscCode: broker.ifscCode,
          aadharNumber: broker.aadharNumber ?? "",
          panNumber: broker.panNumber ?? "",
          password: "",
          confirmPassword: "",
        }
      : empty
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (broker) {
        await api.put(`/superadmin/brokers/${broker._id}`, form);
        toastSuccess("Broker updated successfully");
      } else {
        const { data } = await api.post("/superadmin/brokers", form);
        await navigator.clipboard.writeText(data.signupLink);
        toastSuccess(
          `Broker ${formatPersonLabel(data.broker.name, data.broker.brokerId)} created. Signup link copied.`
        );
      }
      onSaved();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Save failed"));
      toastError(getApiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    opts?: { required?: boolean; type?: string; maxLength?: number; transform?: (v: string) => string }
  ) => {
    const isPassword = key.includes("password");
    const required =
      opts?.required ??
      (broker
        ? !["password", "confirmPassword", "aadharNumber", "panNumber"].includes(key)
        : key !== "password" && key !== "confirmPassword");
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = opts?.transform ? opts.transform(e.target.value) : e.target.value;
      setForm({ ...form, [key]: v });
    };
    return (
      <div key={key}>
        <label className="block text-sm text-slate-400 mb-1">{label}</label>
        {isPassword ? (
          <PasswordInput
            value={form[key]}
            onChange={onChange}
            required={required}
          />
        ) : (
          <input
            className="input-field"
            value={form[key]}
            onChange={onChange}
            required={required}
            type={opts?.type ?? "text"}
            maxLength={opts?.maxLength}
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <form onSubmit={submit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
        <h3 className="font-bold text-lg">{broker ? "Edit broker" : "Create broker"}</h3>
        {broker && (
          <p className="text-sm text-brand-500">
            {formatPersonLabel(broker.name, broker.brokerId)} (ID cannot change)
          </p>
        )}
        {field("name", "Broker name")}
        {field("relation", "Relation to broker", { required: false })}
        {field("remark", "Remark", { required: false })}
        {field("email", "Email (for login)", { required: false, type: "email" })}
        {field("bankAccountNumber", "Bank account number (users pay here)")}
        {field("ifscCode", "IFSC code")}
        {field("phone", "Phone")}
        {field("address", "Address")}
        {field("aadharNumber", "Aadhar number (12 digits)", {
          required: !broker,
          maxLength: 12,
          transform: (v) => v.replace(/\D/g, ""),
        })}
        {field("panNumber", "PAN number", {
          required: !broker,
          maxLength: 10,
          transform: (v) => v.toUpperCase(),
        })}
        {field("password", broker ? "New password (leave blank to keep)" : "Password", {
          required: !broker,
        })}
        {field("confirmPassword", "Confirm password", { required: !broker })}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
