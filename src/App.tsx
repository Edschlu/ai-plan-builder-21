import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthGuard } from "./components/AuthGuard";
import Login from "./pages/Login";
import Demo from "./pages/Demo";
import Ideas from "./pages/Ideas";
import IdeaDetail from "./pages/IdeaDetail";
import BusinessCases from "./pages/BusinessCases";
import Workspace from "./pages/Workspace";
import Cashflow from "./pages/Cashflow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
        <Route path="/" element={<Demo />} />
        <Route path="/demo/table/:templateId" element={<Demo />} />
            <Route path="/business-cases" element={<BusinessCases />} />
            <Route path="/ideas" element={<AuthGuard><Ideas /></AuthGuard>} />
            <Route path="/idea/:id" element={<AuthGuard><IdeaDetail /></AuthGuard>} />
            <Route path="/cashflow" element={<AuthGuard><Cashflow /></AuthGuard>} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
