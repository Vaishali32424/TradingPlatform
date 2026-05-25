import { useEffect, useState } from "react";
import api from "../../api/client";
import { ProfilePhotoEditor } from "../../components/ProfilePhotoEditor";
import type { Broker } from "../../types";
import { formatPersonLabel } from "../../utils/displayName";

export default function BrokerProfile() {
  const [broker, setBroker] = useState<Broker | null>(null);

  useEffect(() => {
    api.get("/broker/profile").then((res) => setBroker(res.data));
  }, []);

  if (!broker) return <div className="page-container animate-pulse">Loading...</div>;

  return (
    <div className="page-container">
      <div className="card max-w-md space-y-4">
        <h2 className="text-xl font-bold">My profile</h2>
        <ProfilePhotoEditor
          name={broker.name}
          photoUrl={broker.profilePhoto}
          uploadUrl="/broker/profile/photo"
          onUpdated={(photo) => setBroker((b) => (b ? { ...b, profilePhoto: photo } : b))}
        />
        <Row label="Account" value={formatPersonLabel(broker.name, broker.brokerId)} />
        {broker.email && <Row label="Email (login)" value={broker.email} />}
        <Row label="Phone" value={broker.phone} />
        <Row label="Address" value={broker.address} />
        <Row label="Bank account" value={broker.bankAccountNumber} />
        <Row label="IFSC" value={broker.ifscCode} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
