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
      <input
        className="input-field max-w-xs"
        placeholder="Filter by Broker ID (optional)"
        value={brokerFilter}
        onChange={(e) => setBrokerFilter(e.target.value)}
      />
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u._id} className="card flex justify-between items-center gap-3">
            <PersonRow name={u.name} id={u.userId} photoUrl={u.profilePhoto} />
            <p className="text-sm shrink-0">₹{u.totalDeposited.toLocaleString()}</p>
          </div>
        ))}
        {users.length === 0 && <p className="text-slate-400">No users found.</p>}
      </div>
    </div>
  );
}
