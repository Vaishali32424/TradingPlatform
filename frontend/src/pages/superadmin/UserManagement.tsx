import { useEffect, useState } from "react";
import api from "../../api/client";
import { PersonRow } from "../../components/PersonRow";
import type { PlatformUser } from "../../types";

export default function SuperAdminUserManagement() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [brokerFilter, setBrokerFilter] = useState("");

  useEffect(() => {
    const q = brokerFilter ? `?brokerId=${brokerFilter}` : "";
    api.get(`/superadmin/users${q}`).then((res) => setUsers(res.data));
  }, [brokerFilter]);

  return (
    <div className="page-container space-y-6">
      <h2 className="text-xl font-bold">User management</h2>
      <div className="max-w-xs">
        <label className="block text-sm text-slate-400 mb-1.5">Filter by Broker ID (optional)</label>
        <input
          className="input-field"
          value={brokerFilter}
          onChange={(e) => setBrokerFilter(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u._id} className="card flex justify-between items-center gap-3 flex-wrap">
            <PersonRow name={u.name} id={u.userId} photoUrl={u.profilePhoto} />
            <p className="text-sm shrink-0">${u.totalDeposited.toLocaleString()}</p>
            <p className="text-xs text-slate-300 w-full sm:w-auto">
              Password: <span className="font-mono text-white">{u.passwordPlain || "Not available"}</span>
            </p>
          </div>
        ))}
        {users.length === 0 && <p className="text-slate-400">No users found.</p>}
      </div>
    </div>
  );
}
