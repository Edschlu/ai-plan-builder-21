import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Target, Users, DollarSign, Lightbulb, TrendingUp } from "lucide-react";

export default function BusinessModel() {
  const navigate = useNavigate();
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    const storedModel = localStorage.getItem('financialModel');
    if (!storedModel) {
      navigate('/onboarding');
      return;
    }
    setModel(JSON.parse(storedModel));
  }, [navigate]);

  if (!model) return null;

  const sections = [
    {
      icon: Building2,
      title: "Company Overview",
      content: model.companyOverview || "AI-powered business planning platform",
      color: "text-primary"
    },
    {
      icon: Target,
      title: "Target Market",
      content: model.targetMarket || "Startups and SMBs",
      color: "text-accent"
    },
    {
      icon: Lightbulb,
      title: "Value Proposition",
      content: model.valueProposition || "Simple input, powerful output",
      color: "text-success"
    },
    {
      icon: DollarSign,
      title: "Revenue Model",
      content: model.revenueModel || "Subscription-based SaaS",
      color: "text-warning"
    },
    {
      icon: Users,
      title: "Customer Segments",
      content: model.customerSegments || "Entrepreneurs, founders, business consultants",
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      title: "Growth Strategy",
      content: model.growthStrategy || "Product-led growth with freemium model",
      color: "text-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Model</h1>
          <p className="text-muted-foreground">
            Strategic overview of your business structure and approach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section, index) => (
            <Card key={index} className="p-6 shadow-card hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-primary/10 flex items-center justify-center flex-shrink-0`}>
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{section.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Business Model Canvas</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Key Activities</Badge>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {(model.keyActivities || [
                  "Product development and AI model training",
                  "Customer acquisition and onboarding",
                  "Financial model optimization",
                  "Customer support and success"
                ]).map((activity: string, i: number) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Key Resources</Badge>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {(model.keyResources || [
                  "AI and ML infrastructure",
                  "Engineering and data science team",
                  "Financial modeling expertise",
                  "Customer data and insights"
                ]).map((resource: string, i: number) => (
                  <li key={i}>{resource}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Key Partnerships</Badge>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {(model.keyPartnerships || [
                  "Cloud infrastructure providers",
                  "Payment processors",
                  "Business accelerators and incubators",
                  "Financial advisors and consultants"
                ]).map((partnership: string, i: number) => (
                  <li key={i}>{partnership}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Cost Structure</Badge>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {(model.costStructure || [
                  "Personnel costs (60%)",
                  "Cloud infrastructure and AI compute (20%)",
                  "Marketing and sales (15%)",
                  "Operations and overhead (5%)"
                ]).map((cost: string, i: number) => (
                  <li key={i}>{cost}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
