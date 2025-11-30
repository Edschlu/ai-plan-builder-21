import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, AlertCircle } from "lucide-react";

export default function Dashboard() {
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

  if (!model) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your financial model...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Revenue (24mo)",
      value: `$${(model.totalRevenue || 0).toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-success"
    },
    {
      label: "Monthly Burn Rate",
      value: `$${(model.monthlyBurn || 0).toLocaleString()}`,
      change: "-3.2%",
      trend: "down",
      icon: TrendingDown,
      color: "text-success"
    },
    {
      label: "Runway",
      value: `${model.runway || 0} months`,
      change: "+2 months",
      trend: "up",
      icon: Activity,
      color: "text-primary"
    },
    {
      label: "Team Size",
      value: model.teamSize || 0,
      change: "+5 planned",
      trend: "up",
      icon: Users,
      color: "text-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your 24-month financial projections
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-6 shadow-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-primary/10 flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${metric.trend === 'up' ? 'text-success' : 'text-warning'}`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {metric.change}
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
          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={model.monthlyData || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Cashflow Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={model.monthlyData || []}>
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
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" strokeWidth={2} name="Costs" />
                <Line type="monotone" dataKey="netCashflow" stroke="hsl(var(--primary))" strokeWidth={2} name="Net Cashflow" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Cumulative Liquidity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={model.monthlyData || []}>
                <defs>
                  <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="cumulativeLiquidity" stroke="hsl(var(--primary))" fill="url(#liquidityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Headcount Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={model.monthlyData || []}>
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
                <Bar dataKey="headcount" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Alert Card */}
        {model.runway < 12 && (
          <Card className="p-6 mt-6 bg-warning/10 border-warning">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-2">Runway Alert</h4>
                <p className="text-sm text-muted-foreground">
                  Your current runway is {model.runway} months. Consider raising additional capital or reducing burn rate to extend your runway.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
