import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSummaryBarProps {
  selectedMonth: number;
  revenue: number;
  costs: number;
  netCashflow: number;
  cumulativeCash: number;
}

export default function MonthSummaryBar({
  selectedMonth,
  revenue,
  costs,
  netCashflow,
  cumulativeCash,
}: MonthSummaryBarProps) {
  return (
    <Card className="sticky top-0 z-20 border-0 rounded-none shadow-sm bg-card/95 backdrop-blur-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium">Month {selectedMonth + 1}</span>
            <span className="mx-2">·</span>
            <span>Live Summary</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-sm font-semibold text-success">
                  ${revenue.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Costs</div>
                <div className="text-sm font-semibold text-destructive">
                  ${costs.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Net Cashflow</div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    netCashflow >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  ${netCashflow.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Cash Position</div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    cumulativeCash >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  ${cumulativeCash.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
