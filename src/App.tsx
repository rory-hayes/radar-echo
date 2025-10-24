import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Marketing from "./pages/Marketing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Calls from "./pages/Calls";
import CallDetail from "./pages/CallDetail";
import CallTranscript from "./pages/CallTranscript";
import CallLive from "./pages/CallLive";
import Frameworks from "./pages/Frameworks";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Marketing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/calls" element={<ProtectedRoute><Layout><Calls /></Layout></ProtectedRoute>} />
          <Route path="/calls/:id" element={<ProtectedRoute><Layout><CallDetail /></Layout></ProtectedRoute>} />
          <Route path="/calls/:id/transcript" element={<ProtectedRoute><Layout><CallTranscript /></Layout></ProtectedRoute>} />
          <Route path="/calls/:id/live" element={<ProtectedRoute><CallLive /></ProtectedRoute>} />
          <Route path="/frameworks" element={<ProtectedRoute><Layout><Frameworks /></Layout></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><Layout><Integrations /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><Layout><Team /></Layout></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
