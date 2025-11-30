import { NavLink } from "./NavLink";
import { Briefcase, Users, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Navigation = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate('/login');
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PlanStudio
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <NavLink
                to="/cashflow"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Cashflow
              </NavLink>
              <NavLink
                to="/business-cases"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Business Cases
              </NavLink>
              <NavLink
                to="/workspace"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Workspace
              </NavLink>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};
