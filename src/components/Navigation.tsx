import { NavLink } from "./NavLink";
import { LayoutDashboard, FileText, TrendingUp, Settings, Sparkles } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PlanAI
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <NavLink
                to="/onboarding"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Setup
              </NavLink>
              <NavLink
                to="/"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Dashboard
              </NavLink>
              <NavLink
                to="/business-model"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Business Model
              </NavLink>
              <NavLink
                to="/financial-plan"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Financial Plan
              </NavLink>
              <NavLink
                to="/scenarios"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="bg-muted text-foreground"
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Scenarios
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
