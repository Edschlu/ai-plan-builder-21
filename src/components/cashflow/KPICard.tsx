import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  trend = "neutral",
  description,
}: KPICardProps) {
  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  };

  const trendBg = {
    up: "bg-green-50",
    down: "bg-red-50",
    neutral: "bg-muted/30",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${trendBg[trend]}`}>
            <Icon className={`w-5 h-5 ${trendColor[trend]}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${trendColor[trend]}`}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </Card>
  );
}
