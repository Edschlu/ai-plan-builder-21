import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: number;
  revenue: number;
  costs: number;
  net: number;
  cash: number;
}

interface CashflowChartsProps {
  monthlyData: MonthlyData[];
}

export function CashflowCharts({ monthlyData }: CashflowChartsProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = monthlyData.map((m) => ({
    month: `M${m.month}`,
    Revenue: m.revenue,
    Costs: m.costs,
    Net: m.net,
    Cash: m.cash,
  }));

  return (
    <Card className="p-6">
      <Tabs defaultValue="cash" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cash">Cash Position</TabsTrigger>
          <TabsTrigger value="revenue">Revenue vs Costs</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="cash" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Cash Position Over Time</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track your account balance month by month
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Cash"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Revenue vs Costs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compare monthly revenue and expenses
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="cumulative" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Cumulative Cashflow</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize your overall financial trajectory
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Cash"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCash)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
