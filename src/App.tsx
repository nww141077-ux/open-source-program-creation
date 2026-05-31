
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EcsuPage from "./pages/EcsuPage";
import EcsuFinance from "./pages/EcsuFinance";
import EgsuLegal from "./pages/EgsuLegal";
import EgsuNotifications from "./pages/EgsuNotifications";
import EgsuOwner from "./pages/EgsuOwner";
import EgsuReport from "./pages/EgsuReport";
import EgsuSecurity from "./pages/EgsuSecurity";
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
          <Route path="/ecsu" element={<EcsuPage />} />
          <Route path="/ecsu/finance" element={<EcsuFinance />} />
          <Route path="/ecsu/legal" element={<EgsuLegal />} />
          <Route path="/ecsu/notifications" element={<EgsuNotifications />} />
          <Route path="/ecsu/owner" element={<EgsuOwner />} />
          <Route path="/ecsu/report" element={<EgsuReport />} />
          <Route path="/ecsu/security" element={<EgsuSecurity />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;