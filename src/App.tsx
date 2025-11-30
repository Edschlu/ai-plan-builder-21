import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { Navigation } from "./components/Navigation";
import Login from "./pages/Login";
import Ideas from "./pages/Ideas";
import IdeaDetail from "./pages/IdeaDetail";
import Workspace from "./pages/Workspace";
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
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<Ideas />} />
                    <Route path="/idea/:id" element={<IdeaDetail />} />
                    <Route path="/workspace" element={<Workspace />} />
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
