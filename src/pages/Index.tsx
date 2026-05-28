import { useState } from "react";
import NexaflowLogin from "@/components/nexaflow/NexaflowLogin";
import NexaflowDashboard from "@/components/nexaflow/NexaflowDashboard";

const Index = () => {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <NexaflowLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <NexaflowDashboard onLogout={() => setAuthenticated(false)} />;
};

export default Index;
