import { useState } from "react";
import EcsuLogin from "@/components/ecsu/EcsuLogin";
import EcsuSystem from "./EcsuSystem";

export default function EcsuPage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <EcsuLogin onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <EcsuSystem
      onLogout={() => setAuthenticated(false)}
      role="admin"
      userName="Николаев В.В."
    />
  );
}
