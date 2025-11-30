import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Lightbulb, Loader2 } from "lucide-react";

interface AIInsightsProps {
  monthlyData: any[];
  categories: any[];
}

export function AIInsights({ monthlyData, categories }: AIInsightsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analyze");
  const [insights, setInsights] = useState<{
    analyze?: string;
    forecast?: string;
    suggest?: string;
  }>({});

  const getAIInsight = async (type: "analyze" | "forecast" | "suggest") => {
    if (insights[type]) {
      setActiveTab(type);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-cashflow", {
        body: { monthlyData, categories, type },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInsights({ ...insights, [type]: data.insight });
      setActiveTab(type);
      toast.success("AI analysis complete!");
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast.error(error.message || "Failed to analyze cashflow");
    } finally {
      setLoading(false);
    }
  };

  const formatInsight = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <li key={i} className="ml-4">
            {line.replace(/^[•\-*]\s*/, "")}
          </li>
        );
      }
      if (line.trim().match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 list-decimal">
            {line.replace(/^\d+\.\s*/, "")}
          </li>
        );
      }
      if (line.trim().startsWith("**") && line.trim().endsWith("**")) {
        return (
          <h4 key={i} className="font-semibold mt-4 mb-2">
            {line.replace(/\*\*/g, "")}
          </h4>
        );
      }
      return line.trim() ? (
        <p key={i} className="mb-2">
          {line}
        </p>
      ) : null;
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 px-6 shadow-lg gap-2 z-50"
        size="lg"
      >
        <Sparkles className="w-5 h-5" />
        AI Insights
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Powered Cashflow Analysis
            </DialogTitle>
            <DialogDescription>
              Get intelligent insights, forecasts, and optimization suggestions
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="analyze"
                onClick={() => !insights.analyze && getAIInsight("analyze")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze
              </TabsTrigger>
              <TabsTrigger
                value="forecast"
                onClick={() => !insights.forecast && getAIInsight("forecast")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Forecast
              </TabsTrigger>
              <TabsTrigger
                value="suggest"
                onClick={() => !insights.suggest && getAIInsight("suggest")}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Optimize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="mt-4">
              {loading && activeTab === "analyze" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing your cashflow...
                  </p>
                </div>
              ) : insights.analyze ? (
                <Card className="p-6">
                  <div className="prose prose-sm max-w-none">
                    {formatInsight(insights.analyze)}
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click "Analyze" to get AI-powered insights
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forecast" className="mt-4">
              {loading && activeTab === "forecast" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Forecasting next 6 months...
                  </p>
                </div>
              ) : insights.forecast ? (
                <Card className="p-6">
                  <div className="prose prose-sm max-w-none">
                    {formatInsight(insights.forecast)}
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to generate 6-month forecast
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggest" className="mt-4">
              {loading && activeTab === "suggest" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Generating optimization suggestions...
                  </p>
                </div>
              ) : insights.suggest ? (
                <Card className="p-6">
                  <div className="prose prose-sm max-w-none">
                    {formatInsight(insights.suggest)}
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Get smart suggestions for optimization
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-xs text-muted-foreground text-center">
            Powered by Lovable AI • Analysis based on your cashflow data
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
