import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EcsuLogin from "@/components/ecsu/EcsuLogin";
import EcsuSystem from "./EcsuSystem";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (loggedIn) {
    return (
      <EcsuSystem
        onLogout={() => setLoggedIn(false)}
        role="admin"
        userName="Николаев В.В."
      />
    );
  }

  return <EcsuLogin onLogin={() => setLoggedIn(true)} />;
}
