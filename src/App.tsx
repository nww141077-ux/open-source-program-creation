
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import EgsuDashboard from "./pages/EgsuDashboard";
import EgsuReport from "./pages/EgsuReport";
import EgsuDocs from "./pages/EgsuDocs";
import EgsuBusiness from "./pages/EgsuBusiness";
import EgsuLegal from "./pages/EgsuLegal";
import EgsuApi from "./pages/EgsuApi";
import EgsuFinance from "./pages/EgsuFinance";
import EgsuSecurity from "./pages/EgsuSecurity";
import EgsuOwner from "./pages/EgsuOwner";
import EgsuAnalytics from "./pages/EgsuAnalytics";
import EgsuNotifications from "./pages/EgsuNotifications";
import EgsuCpvoa from "./pages/EgsuCpvoa";
import EgsuInstall from "./pages/EgsuInstall";
import EgsuEmergency from "./pages/EgsuEmergency";
import EgsuAppeal from "./pages/EgsuAppeal";
import EgsuRewards from "./pages/EgsuRewards";
import EgsuForUsers from "./pages/EgsuForUsers";
import EgsuExport from "./pages/EgsuExport";
import EgsuCapabilities from "./pages/EgsuCapabilities";
import EgsuArk from "./pages/EgsuArk";
import EgsuMigration from "./pages/EgsuMigration";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import MyModel from "./pages/MyModel";
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
          <Route path="/egsu" element={<Navigate to="/egsu/dashboard" replace />} />
          <Route path="/egsu/dashboard" element={<EgsuDashboard />} />
          <Route path="/egsu/report" element={<EgsuReport />} />
          <Route path="/egsu/docs" element={<EgsuDocs />} />
          <Route path="/egsu/business" element={<EgsuBusiness />} />
          <Route path="/egsu/legal" element={<EgsuLegal />} />
          <Route path="/egsu/api" element={<EgsuApi />} />
          <Route path="/egsu/finance" element={<EgsuFinance />} />
          <Route path="/egsu/security" element={<EgsuSecurity />} />
          <Route path="/egsu/owner" element={<EgsuOwner />} />
          <Route path="/egsu/analytics" element={<EgsuAnalytics />} />
          <Route path="/egsu/notifications" element={<EgsuNotifications />} />
          <Route path="/egsu/cpvoa" element={<EgsuCpvoa />} />
          <Route path="/egsu/install" element={<EgsuInstall />} />
          <Route path="/egsu/emergency" element={<EgsuEmergency />} />
          <Route path="/egsu/appeal" element={<EgsuAppeal />} />
          <Route path="/egsu/rewards" element={<EgsuRewards />} />
          <Route path="/egsu/for-users" element={<EgsuForUsers />} />
          <Route path="/egsu/export" element={<EgsuExport />} />
          <Route path="/egsu/capabilities" element={<EgsuCapabilities />} />
          <Route path="/egsu/ark" element={<EgsuArk />} />
          <Route path="/egsu/migration" element={<EgsuMigration />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/my-model" element={<MyModel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;