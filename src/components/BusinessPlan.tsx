import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BusinessPlan({ ideaId }: { ideaId: string }) {
  const [plan, setPlan] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, [ideaId]);

  const loadPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('idea_id', ideaId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        generatePlan();
      } else {
        setPlan(data);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data: idea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !idea) return;

      const { data: planData, error: planError } = await supabase.functions.invoke('generate-business-plan', {
        body: { 
          name: idea.name,
          description: idea.description,
          businessModel: idea.business_model
        }
      });

      if (planError) throw planError;

      const { data, error } = await supabase
        .from('business_plans')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          ...planData
        })
        .select()
        .single();

      if (error) throw error;
      setPlan(data);
      toast.success("Business plan generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading business plan...</div>;

  if (generating) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold mb-2">Generating Your Business Plan</h3>
        <p className="text-muted-foreground">
          AI is creating a comprehensive business plan with market analysis, strategy, and financial assumptions...
        </p>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Button onClick={generatePlan} className="gap-2 bg-gradient-primary">
          <Sparkles className="w-4 h-4" />
          Generate Business Plan
        </Button>
      </Card>
    );
  }

  const sections = [
    { key: 'problem_solution', label: 'Problem & Solution', icon: '🎯' },
    { key: 'target_users', label: 'Target Users', icon: '👥' },
    { key: 'customer_segments', label: 'Customer Segments', icon: '📊' },
    { key: 'competitive_insight', label: 'Competitive Insight', icon: '⚔️' },
    { key: 'revenue_logic', label: 'Revenue Logic', icon: '💰' },
    { key: 'cost_structure', label: 'Cost Structure', icon: '💸' },
    { key: 'hiring_assumptions', label: 'Hiring Plan', icon: '🧑‍💼' },
    { key: 'kpis', label: 'Key Metrics', icon: '📈' },
    { key: 'risks', label: 'Risks & Mitigation', icon: '⚠️' },
    { key: 'investor_summary', label: 'Investor Summary', icon: '🚀' },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.key} className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{section.icon}</span>
            <h3 className="text-lg font-semibold">{section.label}</h3>
          </div>
          <div className="space-y-2">
            {typeof plan[section.key] === 'string' ? (
              <Textarea
                value={plan[section.key] || ''}
                onChange={(e) => setPlan({ ...plan, [section.key]: e.target.value })}
                rows={4}
                className="font-mono text-sm"
              />
            ) : (
              <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto">
                {JSON.stringify(plan[section.key], null, 2)}
              </pre>
            )}
          </div>
        </Card>
      ))}

      <Button className="w-full gap-2 bg-gradient-primary">
        <Save className="w-4 h-4" />
        Save Changes
      </Button>
    </div>
  );
}
