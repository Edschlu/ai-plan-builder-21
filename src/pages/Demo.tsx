import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TemplateSelector from "@/components/TemplateSelector";
import FinancialTableDemo from "@/components/FinancialTableDemo";

export default function Demo() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const navigate = useNavigate();

  if (!showTable) {
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
                setShowTable(true);
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <FinancialTableDemo templateId={selectedTemplate!} />
    </div>
  );
}