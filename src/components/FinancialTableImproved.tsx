import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
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
import EditableCell from "./table/EditableCell";
import RowMenu from "./table/RowMenu";
import MonthSummaryBar from "./table/MonthSummaryBar";
import QuickActionsToolbar from "./table/QuickActionsToolbar";

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

export default function FinancialTableImproved({ templateId }: { templateId: string }) {
  const navigate = useNavigate();
  const template: TemplateConfig = templates[templateId];
  
  const [categories, setCategories] = useState<Category[]>(
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
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

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
    setCategories(categories.map(c =>
      c.id === categoryId ? { ...c, is_collapsed: !c.is_collapsed } : c
    ));
  };

  const applyScenario = (newScenario: 'base' | 'optimistic' | 'pessimistic') => {
    setScenario(newScenario);
    let multiplier = 1;
    if (newScenario === 'optimistic') multiplier = 1.3;
    else if (newScenario === 'pessimistic') multiplier = 0.7;

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

  const expandAll = () => {
    setCategories(categories.map(c => ({ ...c, is_collapsed: false })));
  };

  const collapseAll = () => {
    setCategories(categories.map(c => ({ ...c, is_collapsed: true })));
  };

  const resetToBase = () => {
    applyScenario('base');
    toast.success("Reset to base case");
  };

  return (
    <div className="space-y-0 bg-background">
      <LiveKPIs
        currentMonthRevenue={currentMonthData.revenue}
        currentMonthCosts={currentMonthData.costs}
        netCashflow={currentMonthData.net}
        cumulativeCash={currentMonthData.cash}
        runway={runway}
        breakEvenMonth={breakEvenMonth >= 0 ? breakEvenMonth + 1 : null}
      />

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-0">
            {/* Demo Mode Banner */}
            <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
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
                    onClick={() => toast.info("In demo mode. Sign in to save!")}
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

            {/* Main Table Card */}
            <Card className="shadow-card border-0 overflow-hidden">
              {/* Quick Actions Toolbar */}
              <QuickActionsToolbar
                templateName={`${template.icon} ${template.name}`}
                scenarioType={scenario === 'base' ? 'Base Case' : scenario === 'optimistic' ? 'Best Case' : 'Worst Case'}
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
                onReset={resetToBase}
              />

              {/* Monthly Summary Bar */}
              <MonthSummaryBar
                selectedMonth={currentMonth}
                revenue={currentMonthData.revenue}
                costs={currentMonthData.costs}
                netCashflow={currentMonthData.net}
                cumulativeCash={currentMonthData.cash}
              />

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  {/* Sticky Header */}
                  <thead className="sticky top-[60px] z-10 bg-muted/80 backdrop-blur-sm">
                    <tr>
                      <th className="sticky left-0 z-20 px-4 py-4 text-left text-sm font-semibold bg-muted/80 backdrop-blur-sm border-b min-w-[240px]">
                        Item
                      </th>
                      {Array.from({ length: 24 }, (_, i) => (
                        <th 
                          key={i} 
                          className={cn(
                            "px-2 py-4 text-center text-xs font-medium border-b min-w-[100px] cursor-pointer transition-colors",
                            "hover:bg-primary/10",
                            currentMonth === i && "bg-primary/15 font-semibold",
                            hoveredColumn === i && "bg-accent/10"
                          )}
                          onClick={() => setCurrentMonth(i)}
                          onMouseEnter={() => setHoveredColumn(i)}
                          onMouseLeave={() => setHoveredColumn(null)}
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            M{i + 1}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12]}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-4 text-right text-sm font-semibold border-b min-w-[120px] bg-muted/80 backdrop-blur-sm">
                        Total
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {categories.map((category, catIndex) => {
                      const categoryRows = rows.filter(r => r.category_id === category.id);
                      const isCollapsed = category.is_collapsed;
                      
                      return (
                        <tbody key={category.id}>
                          {/* Category Header */}
                          <tr 
                            className={cn(
                              "cursor-pointer transition-colors group",
                              "hover:bg-muted/40"
                            )}
                            onClick={() => toggleCategory(category.id)}
                          >
                            <td 
                              className={cn(
                                "sticky left-0 z-10 px-4 py-3 font-semibold border-b bg-card",
                                "border-l-4"
                              )}
                              style={{ borderLeftColor: category.color }}
                            >
                              <div className="flex items-center gap-2">
                                {isCollapsed ? 
                                  <ChevronRight className="w-4 h-4" /> : 
                                  <ChevronDown className="w-4 h-4" />
                                }
                                <span className="text-sm">{category.name}</span>
                                <Badge 
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {categoryRows.length}
                                </Badge>
                              </div>
                            </td>
                            <td colSpan={24} className="border-b bg-muted/20"></td>
                            <td className="px-4 py-3 border-b bg-card">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info("Add item functionality");
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                          
                          {/* Category Rows */}
                          {!isCollapsed && categoryRows.map((row, rowIndex) => {
                            const rowTotal = row.monthly_values.reduce((sum, val) => sum + val, 0);
                            const isEven = rowIndex % 2 === 0;
                            
                            return (
                              <tr 
                                key={row.id} 
                                className={cn(
                                  "group transition-colors",
                                  isEven ? "bg-muted/5" : "bg-background"
                                )}
                              >
                                <td 
                                  className={cn(
                                    "sticky left-0 z-10 px-4 py-0 border-b",
                                    isEven ? "bg-muted/5" : "bg-background"
                                  )}
                                >
                                  <div className="flex items-center gap-2 py-3">
                                    <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-move" />
                                    <span className="text-sm flex-1">{row.name}</span>
                                    <RowMenu
                                      onRename={() => toast.info("Rename")}
                                      onDuplicate={() => toast.info("Duplicate")}
                                      onDelete={() => toast.info("Delete")}
                                      onMove={() => toast.info("Move")}
                                    />
                                  </div>
                                </td>
                                {row.monthly_values.map((value, monthIndex) => (
                                  <td 
                                    key={monthIndex} 
                                    className={cn(
                                      "border-b p-0",
                                      hoveredColumn === monthIndex && "ring-1 ring-inset ring-accent/20"
                                    )}
                                  >
                                    <EditableCell
                                      value={value}
                                      onChange={(newValue) => updateCellValue(row.id, monthIndex, newValue)}
                                      isRevenue={row.row_type === 'revenue'}
                                      isCost={row.row_type === 'cost' || row.row_type === 'tax'}
                                      isHeadcount={row.row_type === 'headcount'}
                                      isHighlighted={currentMonth === monthIndex}
                                    />
                                  </td>
                                ))}
                                <td 
                                  className={cn(
                                    "px-4 py-3 text-right text-sm font-semibold border-b font-mono",
                                    isEven ? "bg-muted/5" : "bg-background"
                                  )}
                                >
                                  ${rowTotal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      );
                    })}
                    
                    {/* Summary Rows */}
                    <tbody>
                      <tr className="bg-primary/5 font-semibold">
                        <td className="sticky left-0 z-10 px-4 py-4 border-b bg-primary/5">
                          Net Cashflow
                        </td>
                        {cashflowData.map((data, i) => (
                          <td 
                            key={i} 
                            className={cn(
                              "px-3 py-4 text-center text-sm border-b font-mono",
                              data.net >= 0 ? "text-success" : "text-destructive",
                              currentMonth === i && "bg-primary/15"
                            )}
                          >
                            ${data.net.toLocaleString()}
                          </td>
                        ))}
                        <td className="px-4 py-4 text-right border-b font-mono">
                          ${(totalRevenue - totalCosts).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-primary/10 font-semibold">
                        <td className="sticky left-0 z-10 px-4 py-4 border-b bg-primary/10">
                          Cumulative Cash
                        </td>
                        {cashflowData.map((data, i) => (
                          <td 
                            key={i} 
                            className={cn(
                              "px-3 py-4 text-center text-sm border-b font-mono",
                              data.cash >= 0 ? "text-success" : "text-destructive",
                              currentMonth === i && "bg-primary/15"
                            )}
                          >
                            ${data.cash.toLocaleString()}
                          </td>
                        ))}
                        <td className="px-4 py-4 text-right border-b font-mono">
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
