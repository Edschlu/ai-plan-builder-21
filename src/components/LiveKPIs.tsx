import { Card } from "./ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveKPIsProps {
  currentMonthRevenue: number;
  currentMonthCosts: number;
  netCashflow: number;
  cumulativeCash: number;
  runway: number;
  breakEvenMonth: number | null;
}

export default function LiveKPIs({
  currentMonthRevenue,
  currentMonthCosts,
  netCashflow,
  cumulativeCash,
  runway,
  breakEvenMonth
}: LiveKPIsProps) {
  const isPositiveCash = cumulativeCash > 0;
  const isLowRunway = runway < 6;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Revenue</div>
              <div className="text-lg font-bold">${currentMonthRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Costs</div>
              <div className="text-lg font-bold">${currentMonthCosts.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              netCashflow > 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              <DollarSign className={cn(
                "w-5 h-5",
                netCashflow > 0 ? "text-success" : "text-destructive"
              )} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net Cashflow</div>
              <div className={cn(
                "text-lg font-bold",
                netCashflow > 0 ? "text-success" : "text-destructive"
              )}>
                ${netCashflow.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isPositiveCash ? "bg-primary/10" : "bg-warning/10"
            )}>
              <DollarSign className={cn(
                "w-5 h-5",
                isPositiveCash ? "text-primary" : "text-warning"
              )} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash Position</div>
              <div className={cn(
                "text-lg font-bold",
                isPositiveCash ? "text-primary" : "text-warning"
              )}>
                ${cumulativeCash.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isLowRunway ? "bg-destructive/10" : "bg-success/10"
            )}>
              <Calendar className={cn(
                "w-5 h-5",
                isLowRunway ? "text-destructive" : "text-success"
              )} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Runway</div>
              <div className={cn(
                "text-lg font-bold",
                isLowRunway ? "text-destructive" : "text-success"
              )}>
                {runway} mo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Break-even</div>
              <div className="text-lg font-bold">
                {breakEvenMonth ? `M${breakEvenMonth}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}