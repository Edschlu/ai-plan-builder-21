import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Plus, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  Save,
  LogIn
} from "lucide-react";
import { cn } from "@/lib/utils";
import { templates, generateMonthlyValues, TemplateConfig } from "@/lib/templates";
import PlayModeControls from "./PlayModeControls";
import LiveKPIs from "./LiveKPIs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  is_collapsed: boolean;
}

interface PlanRow {
  id: string;
  category_id: string;
  name: string;
  row_type: string;
  monthly_values: number[];
}

export default function FinancialTableDemo({ templateId }: { templateId: string }) {
  const navigate = useNavigate();
  const template: TemplateConfig = templates[templateId];
  
  // Initialize from template
  const [categories] = useState<Category[]>(
    template.categories.map((cat, idx) => ({
      id: `cat-${idx}`,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      is_collapsed: false
    }))
  );

  const [rows, setRows] = useState<PlanRow[]>(
    template.rows.map((row, idx) => {
      const category = categories.find(c => c.type === row.category_type);
      return {
        id: `row-${idx}`,
        category_id: category?.id || '',
        name: row.name,
        row_type: row.type,
        monthly_values: generateMonthlyValues(row.base_value, row.growth_rate, 24)
      };
    })
  );

  const [assumptions, setAssumptions] = useState({
    revenue_growth_rate: template.assumptions.revenue_growth_rate,
    cost_inflation_rate: template.assumptions.cost_inflation_rate,
    starting_cash: template.assumptions.starting_cash,
    churn_rate: template.assumptions.churn_rate,
    cac: template.assumptions.cac
  });

  const [scenario, setScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base');
  const [toggles, setToggles] = useState({
    marketing: true,
    headcount: true,
    investments: true
  });
  const [currentMonth, setCurrentMonth] = useState(0);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const updateCellValue = (rowId: string, monthIndex: number, value: number) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        const newValues = [...r.monthly_values];
        newValues[monthIndex] = value;
        return { ...r, monthly_values: newValues };
      }
      return r;
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const applyScenario = (newScenario: 'base' | 'optimistic' | 'pessimistic') => {
    setScenario(newScenario);
    
    let multiplier = 1;
    if (newScenario === 'optimistic') {
      multiplier = 1.3;
    } else if (newScenario === 'pessimistic') {
      multiplier = 0.7;
    }

    setAssumptions(prev => ({
      ...prev,
      revenue_growth_rate: template.assumptions.revenue_growth_rate * multiplier,
      cost_inflation_rate: template.assumptions.cost_inflation_rate / multiplier
    }));
  };

  const calculateCashflow = () => {
    const monthlyData = Array(24).fill(0).map((_, monthIndex) => {
      let revenue = 0;
      let costs = 0;

      rows.forEach(row => {
        const value = row.monthly_values[monthIndex] || 0;
        
        if (row.name.toLowerCase().includes('marketing') && !toggles.marketing) return;
        if (row.row_type === 'headcount' && !toggles.headcount) return;
        if (row.row_type === 'investment' && !toggles.investments) return;

        if (row.row_type === 'revenue') {
          revenue += value;
        } else if (['cost', 'headcount', 'investment', 'tax'].includes(row.row_type)) {
          costs += value;
        }
      });

      return { month: `M${monthIndex + 1}`, revenue, costs, net: revenue - costs };
    });

    let cumulativeCash = assumptions.starting_cash;
    const cashflowData = monthlyData.map(m => {
      cumulativeCash += m.net;
      return { ...m, cash: cumulativeCash };
    });

    return cashflowData;
  };

  const cashflowData = calculateCashflow();
  const totalRevenue = cashflowData.reduce((sum, m) => sum + m.revenue, 0);
  const totalCosts = cashflowData.reduce((sum, m) => sum + m.costs, 0);
  const finalCash = cashflowData[cashflowData.length - 1]?.cash || 0;
  
  const negativeMonths = cashflowData.filter(m => m.cash < 0);
  const runway = negativeMonths.length > 0 ? Number(negativeMonths[0].month.replace('M', '')) : 24;
  const breakEvenMonth = cashflowData.findIndex(m => m.cash > assumptions.starting_cash);
  const currentMonthData = cashflowData[currentMonth] || cashflowData[0];

  return (
    <div className="space-y-0">
      <LiveKPIs
        currentMonthRevenue={currentMonthData.revenue}
        currentMonthCosts={currentMonthData.costs}
        netCashflow={currentMonthData.net}
        cumulativeCash={currentMonthData.cash}
        runway={runway}
        breakEvenMonth={breakEvenMonth >= 0 ? breakEvenMonth + 1 : null}
      />

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Demo Mode Banner */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Demo Mode</Badge>
                  <p className="text-sm text-muted-foreground">
                    Your changes are not saved. Sign in to save your work.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast.info("In demo mode. Sign in to save!");
                    }}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="gap-2 bg-gradient-primary"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </div>
              </div>
            </Card>

            {/* Table Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {template.icon} {template.name}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {scenario === 'base' ? 'Base Case' : scenario === 'optimistic' ? 'Best Case' : 'Worst Case'}
                </Badge>
              </div>
            </div>

            {/* Main Table */}
            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold border-b min-w-[200px]">Item</th>
                      {Array.from({ length: 24 }, (_, i) => (
                        <th 
                          key={i} 
                          className={cn(
                            "px-2 py-3 text-center text-xs font-medium border-b min-w-[80px] cursor-pointer hover:bg-muted",
                            currentMonth === i && "bg-primary/10"
                          )}
                          onClick={() => setCurrentMonth(i)}
                        >
                          M{i + 1}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-sm font-semibold border-b min-w-[100px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const categoryRows = rows.filter(r => r.category_id === category.id);
                      const isCollapsed = collapsedCategories.has(category.id);
                      
                      return (
                        <tbody key={category.id}>
                          <tr 
                            className="bg-muted/30 hover:bg-muted/50 cursor-pointer" 
                            onClick={() => toggleCategory(category.id)}
                          >
                            <td className="px-4 py-2 font-semibold border-b">
                              <div className="flex items-center gap-2">
                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <Badge style={{ backgroundColor: category.color }} className="text-white">
                                  {category.type}
                                </Badge>
                                {category.name}
                              </div>
                            </td>
                            <td colSpan={24} className="border-b"></td>
                            <td className="px-4 py-2 text-right border-b">
                              <Button variant="ghost" size="sm" disabled>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                          {!isCollapsed && categoryRows.map((row) => {
                            const rowTotal = row.monthly_values.reduce((sum, val) => sum + val, 0);
                            const isRevenue = row.row_type === 'revenue';
                            
                            return (
                              <tr key={row.id} className="hover:bg-muted/20">
                                <td className="px-4 py-2 border-b">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{row.name}</span>
                                  </div>
                                </td>
                                {row.monthly_values.map((value, monthIndex) => (
                                  <td key={monthIndex} className={cn("border-b", currentMonth === monthIndex && "bg-primary/5")}>
                                    <Input 
                                      type="number"
                                      value={value}
                                      onChange={(e) => updateCellValue(row.id, monthIndex, Number(e.target.value))}
                                      className={cn(
                                        "h-8 w-full border-0 text-center text-xs px-1 py-1 font-mono",
                                        isRevenue ? "bg-success/5 text-success" : "bg-destructive/5 text-destructive"
                                      )}
                                    />
                                  </td>
                                ))}
                                <td className="px-4 py-2 text-right text-sm font-semibold border-b font-mono">
                                  ${rowTotal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      );
                    })}
                    
                    <tbody>
                      <tr className="bg-primary/5 font-semibold">
                        <td className="px-4 py-3 border-b">Net Cashflow</td>
                        {cashflowData.map((data, i) => (
                          <td 
                            key={i} 
                            className={cn(
                              "px-2 py-3 text-center text-xs border-b font-mono",
                              data.net > 0 ? "text-success" : "text-destructive",
                              currentMonth === i && "bg-primary/10"
                            )}
                          >
                            ${data.net.toLocaleString()}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right border-b font-mono">
                          ${(totalRevenue - totalCosts).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-primary/10 font-semibold">
                        <td className="px-4 py-3 border-b">Cumulative Cash</td>
                        {cashflowData.map((data, i) => (
                          <td 
                            key={i} 
                            className={cn(
                              "px-2 py-3 text-center text-xs border-b font-mono",
                              data.cash > 0 ? "text-success" : "text-destructive",
                              currentMonth === i && "bg-primary/10"
                            )}
                          >
                            ${data.cash.toLocaleString()}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right border-b font-mono">
                          ${finalCash.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Play Mode Controls */}
          <div className="lg:col-span-1">
            <PlayModeControls
              scenario={scenario}
              onScenarioChange={applyScenario}
              revenueGrowth={assumptions.revenue_growth_rate}
              onRevenueGrowthChange={(value) => setAssumptions({ ...assumptions, revenue_growth_rate: value })}
              costInflation={assumptions.cost_inflation_rate}
              onCostInflationChange={(value) => setAssumptions({ ...assumptions, cost_inflation_rate: value })}
              churnRate={assumptions.churn_rate}
              onChurnRateChange={(value) => setAssumptions({ ...assumptions, churn_rate: value })}
              cac={assumptions.cac}
              onCacChange={(value) => setAssumptions({ ...assumptions, cac: value })}
              toggles={toggles}
              onToggleChange={(key, value) => setToggles({ ...toggles, [key]: value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}