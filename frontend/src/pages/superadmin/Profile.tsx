import { useAuth } from "../../context/AuthContext";

export default function SuperAdminProfile() {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <div className="card max-w-md">
        <h2 className="text-xl font-bold mb-4">My profile</h2>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-slate-400">Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt className="text-slate-400">Login ID</dt><dd className="font-medium">{user?.loginId}</dd></div>
          <div><dt className="text-slate-400">Role</dt><dd className="font-medium capitalize">{user?.role}</dd></div>
        </dl>
      </div>
    </div>
  );
}
