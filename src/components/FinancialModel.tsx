import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function FinancialModel({ ideaId }: { ideaId: string }) {
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModel();
  }, [ideaId]);

  const loadModel = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_models')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('scenario_type', 'base')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setModel(data);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading financial model...</div>;

  if (!model || !model.monthly_data) {
    return (
      <Card className="p-12 text-center shadow-card">
        <p className="text-muted-foreground">No financial model yet. Coming soon!</p>
      </Card>
    );
  }

  const monthlyData = Array.isArray(model.monthly_data) ? model.monthly_data : [];
  const totalRevenue = monthlyData.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0);
  const totalCosts = monthlyData.reduce((sum: number, m: any) => sum + (m.costs || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Total Revenue (24mo)</span>
          </div>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Costs (24mo)</span>
          </div>
          <p className="text-2xl font-bold">${totalCosts.toLocaleString()}</p>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Net Profit</span>
          </div>
          <p className="text-2xl font-bold">${(totalRevenue - totalCosts).toLocaleString()}</p>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="url(#revGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">Revenue vs Costs</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} />
            <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
