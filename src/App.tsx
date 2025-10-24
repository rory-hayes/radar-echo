import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Marketing from "./pages/Marketing";
import Dashboard from "./pages/Dashboard";
import Calls from "./pages/Calls";
import CallDetail from "./pages/CallDetail";
import CallTranscript from "./pages/CallTranscript";
import CallLive from "./pages/CallLive";
import Frameworks from "./pages/Frameworks";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
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
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/calls" element={<Layout><Calls /></Layout>} />
          <Route path="/calls/:id" element={<Layout><CallDetail /></Layout>} />
          <Route path="/calls/:id/transcript" element={<Layout><CallTranscript /></Layout>} />
          <Route path="/calls/:id/live" element={<CallLive />} />
          <Route path="/frameworks" element={<Layout><Frameworks /></Layout>} />
          <Route path="/integrations" element={<Layout><Integrations /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
