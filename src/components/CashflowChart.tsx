import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CashflowChartProps {
  data: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
    cash: number;
  }>;
}

export default function CashflowChart({ data }: CashflowChartProps) {
  return (
    <Card className="p-6 shadow-card border-0">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-foreground" />
        <h2 className="text-xl font-semibold">Cashflow Forecast</h2>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          {/* Bars for inflow/outflow */}
          <Bar 
            dataKey="inflow" 
            fill="hsl(var(--success-pastel))" 
            radius={[8, 8, 0, 0]}
            name="Inflow"
          />
          <Bar 
            dataKey="outflow" 
            fill="hsl(var(--destructive-pastel))" 
            radius={[8, 8, 0, 0]}
            name="Outflow"
          />
          
          {/* Line for cumulative cash */}
          <Line
            type="monotone"
            dataKey="cash"
            stroke="hsl(220 65% 28%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(220 65% 28%)', r: 4 }}
            name="Cumulative Cash"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-pastel"></div>
          <span>Inflow (Revenue)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive-pastel"></div>
          <span>Outflow (Costs)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Cumulative Cash Position</span>
        </div>
      </div>
    </Card>
  );
}
