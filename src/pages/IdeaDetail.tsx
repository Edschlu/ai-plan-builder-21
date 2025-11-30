import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, Sliders, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BusinessPlan from "@/components/BusinessPlan";
import FinancialModel from "@/components/FinancialModel";
import Sandbox from "@/components/Sandbox";
import Comments from "@/components/Comments";

export default function IdeaDetail() {
  const { id } = useParams();
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadIdea();
  }, [id]);

  const loadIdea = async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setIdea(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Idea not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{idea.name}</h1>
          <p className="text-muted-foreground">{idea.description}</p>
        </div>

        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plan" className="gap-2">
              <FileText className="w-4 h-4" />
              Business Plan
            </TabsTrigger>
            <TabsTrigger value="financials" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Financials
            </TabsTrigger>
            <TabsTrigger value="sandbox" className="gap-2">
              <Sliders className="w-4 h-4" />
              Sandbox
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan">
            <BusinessPlan ideaId={id!} />
          </TabsContent>

          <TabsContent value="financials">
            <FinancialModel ideaId={id!} />
          </TabsContent>

          <TabsContent value="sandbox">
            <Sandbox ideaId={id!} />
          </TabsContent>

          <TabsContent value="comments">
            <Comments ideaId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
