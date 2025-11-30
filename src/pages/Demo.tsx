import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import TemplateSelector from "@/components/TemplateSelector";
import FinancialTableImproved from "@/components/FinancialTableImproved";
import Dashboard from "./Dashboard";

export default function Demo() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [view, setView] = useState<'select' | 'dashboard'>('select');
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId?: string }>();

  // If we have a URL template, show the full table
  if (templateId) {
    return (
      <div className="min-h-screen bg-background">
        <FinancialTableImproved templateId={templateId} />
      </div>
    );
  }

  if (view === 'select') {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Demo Mode</Badge>
            <h1 className="text-4xl font-bold mb-4">
              Build Your Business Plan in Minutes
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a template and start planning instantly. No signup required.
            </p>
          </div>

          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onConfirm={() => {
              if (selectedTemplate) {
                setView('dashboard');
              }
            }}
          />

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Want to save your work? Create a free account.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Sign Up Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && selectedTemplate) {
    return <Dashboard templateId={selectedTemplate} />;
  }

  return null;
}