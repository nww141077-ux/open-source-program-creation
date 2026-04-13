
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GlobalLaw from "./pages/GlobalLaw";
import EgsuDashboard from "./pages/EgsuDashboard";
import EgsuReport from "./pages/EgsuReport";
import EgsuDocs from "./pages/EgsuDocs";
import EgsuBusiness from "./pages/EgsuBusiness";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/egsu" element={<GlobalLaw />} />
          <Route path="/egsu/dashboard" element={<EgsuDashboard />} />
          <Route path="/egsu/report" element={<EgsuReport />} />
          <Route path="/egsu/docs" element={<EgsuDocs />} />
          <Route path="/egsu/business" element={<EgsuBusiness />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;