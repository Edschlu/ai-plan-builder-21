import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Wallet, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CashflowChart from "@/components/CashflowChart";
import { templates, generateMonthlyValues } from "@/lib/templates";

interface DashboardProps {
  templateId: string;
}

export default function Dashboard({ templateId }: DashboardProps) {
  const navigate = useNavigate();
  const template = templates[templateId];
  
  // Generate demo data from template
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    let revenue = 0;
    let costs = 0;
    
    template.rows.forEach(row => {
      const values = generateMonthlyValues(row.base_value, row.growth_rate, 12);
      if (row.type === 'revenue') {
        revenue += values[i];
      } else {
        costs += values[i];
      }
    });
    
    return {
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      inflow: revenue,
      outflow: costs,
      net: revenue - costs,
    };
  });

  // Calculate cumulative cash
  let cumulativeCash = template.assumptions.starting_cash;
  const cashflowData = monthlyData.map(m => {
    cumulativeCash += m.net;
    return { ...m, cash: cumulativeCash };
  });

  const currentCash = cashflowData[cashflowData.length - 1].cash;
  const avgBurn = monthlyData.reduce((sum, m) => sum + Math.abs(m.net), 0) / monthlyData.length;
  const runway = currentCash > 0 ? Math.floor(currentCash / avgBurn) : 0;
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.inflow, 0);
  const totalCosts = monthlyData.reduce((sum, m) => sum + m.outflow, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {template.icon} {template.name}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Demo Mode
              </Badge>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="gap-2"
            >
              Save Your Plan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 shadow-card border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Cash</span>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              ${(currentCash / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentCash > template.assumptions.starting_cash ? '+' : ''}
              {(((currentCash - template.assumptions.starting_cash) / template.assumptions.starting_cash) * 100).toFixed(1)}% from start
            </p>
          </Card>

          <Card className="p-6 shadow-card border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Runway</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              {runway} months
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg burn: ${(avgBurn / 1000).toFixed(0)}K/mo
            </p>
          </Card>

          <Card className="p-6 shadow-card border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              ${(totalRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              12 month forecast
            </p>
          </Card>

          <Card className="p-6 shadow-card border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Costs</span>
              <DollarSign className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive">
              ${(totalCosts / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              12 month forecast
            </p>
          </Card>
        </div>

        {/* Main Cashflow Chart */}
        <CashflowChart data={cashflowData} />

        {/* Next Steps */}
        <Card className="p-6 shadow-card border-0 mt-6">
          <h3 className="text-lg font-semibold mb-3">Ready to dive deeper?</h3>
          <p className="text-muted-foreground mb-4">
            Open the full cashflow table to edit every line item, adjust assumptions, and run scenarios.
          </p>
          <Button onClick={() => navigate(`/demo/table/${templateId}`)} className="gap-2">
            Open Cashflow Table
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
