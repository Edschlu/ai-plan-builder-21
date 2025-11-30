import { KPICard } from "./KPICard";
import { CashflowCharts } from "./CashflowCharts";
import { Wallet, TrendingDown, Clock, DollarSign } from "lucide-react";

interface CashflowDashboardProps {
  categories: any[];
  rows: any[];
}

export function CashflowDashboard({ categories, rows }: CashflowDashboardProps) {
  // Calculate KPIs
  const calculateMonthlyData = () => {
    const monthlyData: {
      month: number;
      revenue: number;
      costs: number;
      net: number;
      cash: number;
    }[] = [];

    let cumulativeCash = 0;

    for (let month = 0; month < 24; month++) {
      let revenue = 0;
      let costs = 0;

      categories.forEach((cat) => {
        const categoryRows = rows.filter((r) => r.category_id === cat.id);
        const subtotal = categoryRows.reduce(
          (sum, row) => sum + (Number(row.monthly_values[month]) || 0),
          0
        );

        if (cat.type === "revenue") {
          revenue += subtotal;
        } else {
          costs += subtotal;
        }
      });

      const net = revenue - costs;
      cumulativeCash += net;

      monthlyData.push({
        month: month + 1,
        revenue,
        costs,
        net,
        cash: cumulativeCash,
      });
    }

    return monthlyData;
  };

  const monthlyData = calculateMonthlyData();
  const currentMonth = monthlyData[0] || { cash: 0, net: 0, revenue: 0, costs: 0 };
  const lastMonth = monthlyData[1] || { cash: 0, net: 0, revenue: 0, costs: 0 };

  // Current cash position
  const cashPosition = currentMonth.cash;

  // Average burn rate (last 3 months)
  const recentMonths = monthlyData.slice(0, 3);
  const burnRate =
    recentMonths.reduce((sum, m) => sum + Math.abs(Math.min(0, m.net)), 0) / 3;

  // Runway calculation (months until cash runs out)
  const runway = burnRate > 0 ? Math.floor(cashPosition / burnRate) : Infinity;

  // Net cashflow (current month)
  const netCashflow = currentMonth.net;

  // Calculate changes
  const cashChange =
    lastMonth.cash !== 0
      ? ((currentMonth.cash - lastMonth.cash) / Math.abs(lastMonth.cash)) * 100
      : 0;
  const burnChange =
    lastMonth.net !== 0
      ? ((Math.abs(Math.min(0, currentMonth.net)) -
          Math.abs(Math.min(0, lastMonth.net))) /
          Math.abs(Math.min(0, lastMonth.net))) *
        100
      : 0;
  const netChange =
    lastMonth.net !== 0
      ? ((currentMonth.net - lastMonth.net) / Math.abs(lastMonth.net)) * 100
      : 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cash Position"
          value={formatCurrency(cashPosition)}
          change={cashChange}
          icon={Wallet}
          trend={cashPosition >= 0 ? "up" : "down"}
          description="Current account balance"
        />
        <KPICard
          title="Monthly Burn Rate"
          value={formatCurrency(burnRate)}
          change={burnChange}
          icon={TrendingDown}
          trend={burnChange < 0 ? "up" : "down"}
          description="Average last 3 months"
        />
        <KPICard
          title="Runway"
          value={runway === Infinity ? "∞" : `${runway} months`}
          icon={Clock}
          trend={runway > 6 ? "up" : runway > 3 ? "neutral" : "down"}
          description="Time until funds depleted"
        />
        <KPICard
          title="Net Cashflow"
          value={formatCurrency(netCashflow)}
          change={netChange}
          icon={DollarSign}
          trend={netCashflow >= 0 ? "up" : "down"}
          description="Current month balance"
        />
      </div>

      {/* Charts */}
      <CashflowCharts monthlyData={monthlyData} />
    </div>
  );
}
