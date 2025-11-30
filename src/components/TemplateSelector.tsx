import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";
import { templates } from "@/lib/templates";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string) => void;
  onConfirm: () => void;
}

export default function TemplateSelector({ 
  selectedTemplate, 
  onSelectTemplate, 
  onConfirm 
}: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Business Template</h2>
        <p className="text-muted-foreground">
          Start with a pre-configured financial model tailored to your business type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(templates).map((template) => (
          <Card
            key={template.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:shadow-lg",
              selectedTemplate === template.id && "ring-2 ring-primary shadow-lg"
            )}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{template.icon}</div>
              {selectedTemplate === template.id && (
                <Check className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {template.description}
            </p>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {template.categories.map((cat) => (
                  <Badge 
                    key={cat.name}
                    style={{ backgroundColor: cat.color }}
                    className="text-white text-xs"
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground mt-3">
                <div>• {template.rows.length} pre-configured line items</div>
                <div>• {template.assumptions.revenue_growth_rate}% revenue growth</div>
                <div>• Starting cash: ${template.assumptions.starting_cash.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onConfirm}
          disabled={!selectedTemplate}
          size="lg"
          className="gap-2 bg-gradient-primary px-12"
        >
          Continue with {selectedTemplate && templates[selectedTemplate].name}
        </Button>
      </div>
    </div>
  );
}