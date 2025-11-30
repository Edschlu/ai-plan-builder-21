import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateCashflow, applyScenario, type Transaction } from "@/lib/cashflow-engine";
import { toast } from "sonner";

export default function CashflowScenarios() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scenarios, setScenarios] = useState<any>({
    base: { revenueGrowthRate: 0, costGrowthRate: 0 },
    optimistic: { revenueGrowthRate: 20, costGrowthRate: -10 },
    pessimistic: { revenueGrowthRate: -15, costGrowthRate: 10 },
  });
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      const formattedTx: Transaction[] = (txData || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        name: tx.name,
        amount: parseFloat(tx.amount),
        date: new Date(tx.date),
        is_recurring: tx.is_recurring,
        recurrence_frequency: tx.recurrence_frequency,
        recurrence_end_date: tx.recurrence_end_date ? new Date(tx.recurrence_end_date) : undefined,
        payment_delay_days: tx.payment_delay_days || 0,
        category_id: tx.category_id,
      }));

      setTransactions(formattedTx);

      // Calculate all scenarios
      const startingCash = parseFloat(String(settings?.starting_cash || 0));
      const baseResult = calculateCashflow(formattedTx, startingCash, 24);
      const optResult = calculateCashflow(
        applyScenario(formattedTx, scenarios.optimistic),
        startingCash,
        24
      );
      const pessResult = calculateCashflow(
        applyScenario(formattedTx, scenarios.pessimistic),
        startingCash,
        24
      );

      setResults({
        base: baseResult,
        optimistic: optResult,
        pessimistic: pessResult,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateScenario = (type: string, field: string, value: number) => {
    setScenarios({
      ...scenarios,
      [type]: { ...scenarios[type], [field]: value }
    });
  };

  const recalculate = () => {
    loadData();
    toast.success("Scenarios recalculated");
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scenario Planning</h1>
          <p className="text-muted-foreground">
            Compare different forecasts based on varying assumptions
          </p>
        </div>

        <Tabs defaultValue="base" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pessimistic" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Pessimistic
            </TabsTrigger>
            <TabsTrigger value="base" className="flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Base
            </TabsTrigger>
            <TabsTrigger value="optimistic" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Optimistic
            </TabsTrigger>
          </TabsList>

          {['base', 'optimistic', 'pessimistic'].map((scenarioType) => {
            const result = results[scenarioType];
            if (!result) return null;

            return (
              <TabsContent key={scenarioType} value={scenarioType} className="space-y-6">
                <Card className="p-6 shadow-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 capitalize">{scenarioType} Case</h2>
                      <p className="text-muted-foreground">
                        {scenarioType === 'base' ? 'Current assumptions' :
                         scenarioType === 'optimistic' ? 'Best case scenario' :
                         'Conservative scenario'}
                      </p>
                    </div>
                    <Badge 
                      variant={scenarioType === 'optimistic' ? 'default' : scenarioType === 'pessimistic' ? 'secondary' : 'outline'}
                    >
                      {scenarioType === 'optimistic' ? 'Best Case' :
                       scenarioType === 'pessimistic' ? 'Worst Case' :
                       'Expected'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Total Cash In</p>
                      <p className="text-2xl font-bold">${result.totalCashIn.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Avg Burn Rate</p>
                      <p className="text-2xl font-bold">${result.averageBurnRate.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Runway</p>
                      <p className="text-2xl font-bold">{result.runway} months</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Final Balance</p>
                      <p className="text-2xl font-bold">
                        ${result.monthlyData[result.monthlyData.length - 1]?.cumulativeCash.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={result.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cashIn" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2} 
                        name="Cash In" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cashOut" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2} 
                        name="Cash Out" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeCash" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        name="Balance" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 shadow-card">
                  <h3 className="text-lg font-semibold mb-4">Scenario Assumptions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Revenue Growth Rate (%)</Label>
                      <Input
                        type="number"
                        value={scenarios[scenarioType].revenueGrowthRate}
                        onChange={(e) => updateScenario(scenarioType, 'revenueGrowthRate', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost Growth Rate (%)</Label>
                      <Input
                        type="number"
                        value={scenarios[scenarioType].costGrowthRate}
                        onChange={(e) => updateScenario(scenarioType, 'costGrowthRate', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <Button onClick={recalculate} className="mt-4 gap-2">
                    <Save className="w-4 h-4" />
                    Recalculate
                  </Button>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
