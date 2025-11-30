import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function Scenarios() {
  const navigate = useNavigate();
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    const storedModel = localStorage.getItem('financialModel');
    if (!storedModel) {
      navigate('/onboarding');
      return;
    }
    const parsed = JSON.parse(storedModel);
    
    // Generate scenarios if not present
    if (!parsed.scenarios) {
      parsed.scenarios = generateScenarios(parsed);
      setModel(parsed);
    } else {
      setModel(parsed);
    }
  }, [navigate]);

  const generateScenarios = (baseModel: any) => {
    const baseData = baseModel.monthlyData || [];
    
    return {
      base: {
        name: "Base Case",
        description: "Expected performance based on current assumptions",
        data: baseData,
        metrics: calculateMetrics(baseData)
      },
      optimistic: {
        name: "Optimistic",
        description: "Best case scenario with 30% higher growth",
        data: baseData.map((month: any) => ({
          ...month,
          revenue: Math.round(month.revenue * 1.3),
          netCashflow: Math.round(month.revenue * 1.3 - month.costs),
          cumulativeLiquidity: Math.round(month.cumulativeLiquidity * 1.2)
        })),
        metrics: calculateMetrics(baseData, 1.3)
      },
      pessimistic: {
        name: "Pessimistic",
        description: "Conservative scenario with 30% lower growth",
        data: baseData.map((month: any) => ({
          ...month,
          revenue: Math.round(month.revenue * 0.7),
          netCashflow: Math.round(month.revenue * 0.7 - month.costs),
          cumulativeLiquidity: Math.round(month.cumulativeLiquidity * 0.8)
        })),
        metrics: calculateMetrics(baseData, 0.7)
      }
    };
  };

  const calculateMetrics = (data: any[], multiplier = 1) => {
    const totalRevenue = data.reduce((sum, month) => sum + month.revenue, 0) * multiplier;
    const finalLiquidity = data[data.length - 1]?.cumulativeLiquidity * multiplier || 0;
    const avgMonthlyGrowth = multiplier > 1 ? 18 : multiplier < 1 ? 8 : 12;
    
    return {
      totalRevenue: Math.round(totalRevenue),
      finalLiquidity: Math.round(finalLiquidity),
      avgMonthlyGrowth: avgMonthlyGrowth,
      breakEvenMonth: multiplier > 1 ? 10 : multiplier < 1 ? 18 : 14
    };
  };

  if (!model || !model.scenarios) return null;

  const scenarios = model.scenarios;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scenario Planning</h1>
          <p className="text-muted-foreground">
            Compare different projections based on varying assumptions
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

          {Object.entries(scenarios).map(([key, scenario]: [string, any]) => (
            <TabsContent key={key} value={key} className="space-y-6">
              <Card className="p-6 shadow-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{scenario.name}</h2>
                    <p className="text-muted-foreground">{scenario.description}</p>
                  </div>
                  <Badge 
                    variant={key === 'optimistic' ? 'default' : key === 'pessimistic' ? 'secondary' : 'outline'}
                    className="text-sm"
                  >
                    {key === 'optimistic' ? '+30%' : key === 'pessimistic' ? '-30%' : 'Baseline'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue (24mo)</p>
                    <p className="text-2xl font-bold">${scenario.metrics.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Final Liquidity</p>
                    <p className="text-2xl font-bold">${scenario.metrics.finalLiquidity.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Avg Monthly Growth</p>
                    <p className="text-2xl font-bold">{scenario.metrics.avgMonthlyGrowth}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Break-even Month</p>
                    <p className="text-2xl font-bold">M{scenario.metrics.breakEvenMonth}</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={scenario.data}>
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
                      dataKey="revenue" 
                      stroke={key === 'optimistic' ? 'hsl(var(--success))' : key === 'pessimistic' ? 'hsl(var(--warning))' : 'hsl(var(--primary))'} 
                      strokeWidth={2} 
                      name="Revenue" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="costs" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2} 
                      name="Costs" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeLiquidity" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2} 
                      name="Liquidity" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Key Assumptions for {scenario.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Customer Growth Rate</p>
                    <p className="font-semibold">
                      {key === 'optimistic' ? '20%' : key === 'pessimistic' ? '8%' : '15%'} monthly
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Churn Rate</p>
                    <p className="font-semibold">
                      {key === 'optimistic' ? '3%' : key === 'pessimistic' ? '8%' : '5%'} monthly
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">CAC</p>
                    <p className="font-semibold">
                      ${key === 'optimistic' ? '35' : key === 'pessimistic' ? '75' : '50'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">ARPU</p>
                    <p className="font-semibold">
                      ${key === 'optimistic' ? '129' : key === 'pessimistic' ? '79' : '99'}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
