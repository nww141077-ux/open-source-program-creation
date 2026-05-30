import { useNavigate } from "react-router-dom";
import EcsuSystem from "./EcsuSystem";

export default function EcsuPage() {
  const navigate = useNavigate();

  return (
    <EcsuSystem
      onLogout={() => navigate("/")}
      role="admin"
      userName="Николаев В.В."
    />
  );
}