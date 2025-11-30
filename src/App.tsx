import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { CashflowNavigation } from "./components/CashflowNavigation";
import Login from "./pages/Login";
import CashflowDashboard from "./pages/CashflowDashboard";
import Cashflow from "./pages/Cashflow";
import DataInput from "./pages/DataInput";
import CashflowScenarios from "./pages/CashflowScenarios";
import Export from "./pages/Export";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <div className="min-h-screen bg-background">
                  <CashflowNavigation />
                  <Routes>
                    <Route path="/" element={<CashflowDashboard />} />
                    <Route path="/cashflow" element={<Cashflow />} />
                    <Route path="/data" element={<DataInput />} />
                    <Route path="/scenarios" element={<CashflowScenarios />} />
                    <Route path="/export" element={<Export />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
