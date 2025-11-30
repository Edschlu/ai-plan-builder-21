import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateCashflow, type Transaction } from "@/lib/cashflow-engine";
import { toast } from "sonner";

export default function CashflowDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startingCash, setStartingCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cashflowData, setCashflowData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load company settings
      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setStartingCash(parseFloat(String(settings.starting_cash || 0)));
      }

      // Load transactions
      const { data: txData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

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

      // Calculate cashflow
      const result = calculateCashflow(formattedTx, parseFloat(String(settings?.starting_cash || 0)), 24);
      setCashflowData(result);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !cashflowData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Activity className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Cash In",
      value: `$${cashflowData.totalCashIn.toLocaleString()}`,
      icon: DollarSign,
      color: "text-success"
    },
    {
      label: "Total Cash Out",
      value: `$${cashflowData.totalCashOut.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-destructive"
    },
    {
      label: "Avg Burn Rate",
      value: `$${cashflowData.averageBurnRate.toLocaleString()}/mo`,
      icon: Activity,
      color: "text-warning"
    },
    {
      label: "Runway",
      value: `${cashflowData.runway} months`,
      icon: Calendar,
      color: cashflowData.runway < 6 ? "text-destructive" : "text-success"
    }
  ];

  const COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cashflow Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time view of your financial position
          </p>
        </div>

        {/* Alerts */}
        {cashflowData.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {cashflowData.alerts.map((alert: any, idx: number) => (
              <Card
                key={idx}
                className={`p-4 ${
                  alert.type === 'danger' ? 'bg-destructive/10 border-destructive' :
                  alert.type === 'warning' ? 'bg-warning/10 border-warning' :
                  'bg-accent/10 border-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className={`w-5 h-5 ${
                    alert.type === 'danger' ? 'text-destructive' :
                    alert.type === 'warning' ? 'text-warning' :
                    'text-accent'
                  }`} />
                  <p className="font-medium">{alert.message}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-6 shadow-card hover:shadow-md transition-all animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-primary/10 flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold mb-4">Net Cashflow</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashflowData.monthlyData.slice(0, 12)}>
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
                <Bar dataKey="netCashflow" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold mb-4">Cash In vs Cash Out</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashflowData.monthlyData.slice(0, 12)}>
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
                <Line type="monotone" dataKey="cashIn" stroke="hsl(var(--success))" strokeWidth={2} name="Cash In" />
                <Line type="monotone" dataKey="cashOut" stroke="hsl(var(--destructive))" strokeWidth={2} name="Cash Out" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 shadow-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold mb-4">Cumulative Cash Position</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashflowData.monthlyData}>
                <defs>
                  <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="cumulativeCash" stroke="hsl(var(--primary))" fill="url(#cashGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 shadow-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold mb-4">Monthly Forecast</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {cashflowData.monthlyData.slice(0, 6).map((month: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="font-medium">{month.month}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Net</p>
                      <p className={`font-semibold ${month.netCashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ${month.netCashflow.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-semibold">${month.cumulativeCash.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
