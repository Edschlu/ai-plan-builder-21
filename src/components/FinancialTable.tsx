import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Plus, 
  Save,
  Camera,
  GripVertical, 
  ChevronDown, 
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { templates, generateMonthlyValues, TemplateConfig } from "@/lib/templates";
import TemplateSelector from "./TemplateSelector";
import PlayModeControls from "./PlayModeControls";
import LiveKPIs from "./LiveKPIs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  is_collapsed: boolean;
  sort_order: number;
}

interface PlanRow {
  id: string;
  category_id: string;
  name: string;
  row_type: string;
  monthly_values: number[];
  is_recurring: boolean;
  payment_delay_days: number;
}

interface ForecastAssumptions {
  revenue_growth_rate: number;
  cost_inflation_rate: number;
  starting_cash: number;
  churn_rate?: number;
  cac?: number;
  template_type?: string;
  scenario_type: 'base' | 'optimistic' | 'pessimistic';
}

export default function FinancialTable({ ideaId }: { ideaId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>({
    revenue_growth_rate: 10,
    cost_inflation_rate: 3,
    starting_cash: 50000,
    scenario_type: 'base'
  });
  const [loading, setLoading] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scenario, setScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base');
  const [toggles, setToggles] = useState({
    marketing: true,
    headcount: true,
    investments: true
  });
  const [snapshotName, setSnapshotName] = useState('');
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);

  useEffect(() => {
    loadData();
  }, [ideaId]);

  const loadData = async () => {
    try {
      const [categoriesResult, rowsResult, assumptionsResult] = await Promise.all([
        supabase.from('plan_categories').select('*').eq('idea_id', ideaId).order('sort_order'),
        supabase.from('plan_rows').select('*').eq('idea_id', ideaId).order('sort_order'),
        supabase.from('forecast_assumptions').select('*').eq('idea_id', ideaId).eq('scenario_type', 'base').maybeSingle()
      ]);

      if (categoriesResult.data && categoriesResult.data.length > 0) {
        setCategories(categoriesResult.data);
      }
      
      if (rowsResult.data && rowsResult.data.length > 0) {
        const formattedRows: PlanRow[] = rowsResult.data.map(row => ({
          id: row.id,
          category_id: row.category_id || '',
          name: row.name,
          row_type: row.row_type,
          monthly_values: Array.isArray(row.monthly_values) ? row.monthly_values.map(v => Number(v) || 0) : Array(24).fill(0),
          is_recurring: row.is_recurring,
          payment_delay_days: row.payment_delay_days
        }));
        setRows(formattedRows);
      }
      
      if (assumptionsResult.data) {
        const data = assumptionsResult.data;
        setAssumptions({
          revenue_growth_rate: data.revenue_growth_rate,
          cost_inflation_rate: data.cost_inflation_rate,
          starting_cash: data.starting_cash,
          churn_rate: (data as any).churn_rate,
          cac: (data as any).cac,
          template_type: data.template_type,
          scenario_type: (data.scenario_type as 'base' | 'optimistic' | 'pessimistic') || 'base'
        });
        if (data.template_type) {
          setSelectedTemplate(data.template_type);
        }
      }
      
      if (!categoriesResult.data || categoriesResult.data.length === 0) {
        setShowTemplateSelector(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const template: TemplateConfig = templates[templateId];
      if (!template) return;

      // Insert categories
      const { data: newCategories } = await supabase
        .from('plan_categories')
        .insert(
          template.categories.map((cat, idx) => ({
            idea_id: ideaId,
            user_id: user.id,
            name: cat.name,
            type: cat.type,
            color: cat.color,
            sort_order: idx
          }))
        )
        .select();

      // Insert rows with monthly values
      if (newCategories) {
        const rowsToInsert = template.rows.map((row, idx) => {
          const category = newCategories.find(c => c.type === row.category_type);
          const monthlyValues = generateMonthlyValues(row.base_value, row.growth_rate, 24);
          
          return {
            idea_id: ideaId,
            user_id: user.id,
            category_id: category?.id,
            name: row.name,
            row_type: row.type,
            monthly_values: monthlyValues,
            is_recurring: row.is_recurring,
            payment_delay_days: row.payment_delay_days,
            sort_order: idx
          };
        });

        await supabase.from('plan_rows').insert(rowsToInsert);
      }

      // Insert or update assumptions
      const assumptionData = {
        idea_id: ideaId,
        user_id: user.id,
        revenue_growth_rate: template.assumptions.revenue_growth_rate,
        cost_inflation_rate: template.assumptions.cost_inflation_rate,
        starting_cash: template.assumptions.starting_cash,
        template_type: templateId,
        scenario_type: 'base'
      };

      await supabase.from('forecast_assumptions').upsert(assumptionData);

      toast.success(`${template.name} template applied!`);
      setSelectedTemplate(templateId);
      setShowTemplateSelector(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to apply template");
    }
  };

  const updateCellValue = async (rowId: string, monthIndex: number, value: number) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const newValues = [...row.monthly_values];
    newValues[monthIndex] = value;

    try {
      await supabase
        .from('plan_rows')
        .update({ monthly_values: newValues })
        .eq('id', rowId);

      setRows(rows.map(r => r.id === rowId ? { ...r, monthly_values: newValues } : r));
    } catch (error: any) {
      toast.error("Failed to update value");
    }
  };

  const toggleCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    try {
      await supabase
        .from('plan_categories')
        .update({ is_collapsed: !category.is_collapsed })
        .eq('id', categoryId);

      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, is_collapsed: !c.is_collapsed } : c
      ));
    } catch (error: any) {
      toast.error("Failed to toggle category");
    }
  };

  const addRow = async (categoryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('plan_rows')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          category_id: categoryId,
          name: "New Item",
          row_type: "custom",
          monthly_values: Array(24).fill(0)
        })
        .select()
        .single();

      if (error) throw error;
      const formattedRow: PlanRow = {
        id: data.id,
        category_id: data.category_id || '',
        name: data.name,
        row_type: data.row_type,
        monthly_values: Array.isArray(data.monthly_values) ? data.monthly_values.map(v => Number(v) || 0) : Array(24).fill(0),
        is_recurring: data.is_recurring,
        payment_delay_days: data.payment_delay_days
      };
      setRows([...rows, formattedRow]);
      toast.success("Row added");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const applyScenario = (newScenario: 'base' | 'optimistic' | 'pessimistic') => {
    setScenario(newScenario);
    
    let multiplier = 1;
    if (newScenario === 'optimistic') {
      multiplier = 1.3; // 30% increase
    } else if (newScenario === 'pessimistic') {
      multiplier = 0.7; // 30% decrease
    }

    // Apply scenario to revenue growth
    setAssumptions(prev => ({
      ...prev,
      revenue_growth_rate: prev.revenue_growth_rate * multiplier,
      cost_inflation_rate: prev.cost_inflation_rate / multiplier
    }));
  };

  const saveSnapshot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const snapshotData = {
        categories,
        rows,
        assumptions,
        scenario
      };

      const { error } = await supabase.from('plan_snapshots').insert({
        idea_id: ideaId,
        user_id: user.id,
        name: snapshotName || `Snapshot ${new Date().toLocaleDateString()}`,
        snapshot_data: snapshotData as any
      });

      if (error) throw error;

      toast.success("Snapshot saved!");
      setShowSnapshotDialog(false);
      setSnapshotName('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateCashflow = () => {
    const monthlyData = Array(24).fill(0).map((_, monthIndex) => {
      let revenue = 0;
      let costs = 0;

      rows.forEach(row => {
        const value = row.monthly_values[monthIndex] || 0;
        
        // Apply toggles
        if (row.name.toLowerCase().includes('marketing') && !toggles.marketing) return;
        if (row.row_type === 'headcount' && !toggles.headcount) return;
        if (row.row_type === 'investment' && !toggles.investments) return;

        if (row.row_type === 'revenue') {
          revenue += value;
        } else if (['cost', 'headcount', 'investment', 'tax'].includes(row.row_type)) {
          costs += value;
        }
      });

      return { 
        month: `M${monthIndex + 1}`, 
        revenue, 
        costs, 
        net: revenue - costs 
      };
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
  
  // Calculate runway (months until cash runs out)
  const negativeMonths = cashflowData.filter(m => m.cash < 0);
  const runway = negativeMonths.length > 0 ? negativeMonths[0].month.replace('M', '') : 24;
  
  // Calculate break-even month
  const breakEvenMonth = cashflowData.findIndex(m => m.cash > assumptions.starting_cash);

  // Current month KPIs
  const currentMonthData = cashflowData[currentMonth] || cashflowData[0];

  if (loading) return <div className="text-center py-12">Loading financial table...</div>;

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        onConfirm={() => {
          if (selectedTemplate) {
            applyTemplate(selectedTemplate);
          }
        }}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Button 
          onClick={() => setShowTemplateSelector(true)} 
          className="gap-2 bg-gradient-primary"
        >
          Choose a Template
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {/* Live KPIs Bar */}
      <LiveKPIs
        currentMonthRevenue={currentMonthData.revenue}
        currentMonthCosts={currentMonthData.costs}
        netCashflow={currentMonthData.net}
        cumulativeCash={currentMonthData.cash}
        runway={Number(runway)}
        breakEvenMonth={breakEvenMonth >= 0 ? breakEvenMonth + 1 : null}
      />

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedTemplate && (
                  <Badge variant="secondary" className="text-sm">
                    {templates[selectedTemplate].icon} {templates[selectedTemplate].name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  {scenario === 'base' ? 'Base Case' : scenario === 'optimistic' ? 'Best Case' : 'Worst Case'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSnapshotDialog(true)}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Save Snapshot
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  Change Template
                </Button>
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
                      return (
                        <tbody key={category.id}>
                          <tr 
                            className="bg-muted/30 hover:bg-muted/50 cursor-pointer" 
                            onClick={() => toggleCategory(category.id)}
                          >
                            <td className="px-4 py-2 font-semibold border-b">
                              <div className="flex items-center gap-2">
                                {category.is_collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <Badge style={{ backgroundColor: category.color }} className="text-white">
                                  {category.type}
                                </Badge>
                                {category.name}
                              </div>
                            </td>
                            <td colSpan={24} className="border-b"></td>
                            <td className="px-4 py-2 text-right border-b">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  addRow(category.id); 
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                          {!category.is_collapsed && categoryRows.map((row) => {
                            const rowTotal = row.monthly_values.reduce((sum, val) => sum + val, 0);
                            const isRevenue = row.row_type === 'revenue';
                            
                            return (
                              <tr key={row.id} className="hover:bg-muted/20">
                                <td className="px-4 py-2 border-b">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <Input 
                                      value={row.name}
                                      onChange={(e) => {
                                        setRows(rows.map(r => r.id === row.id ? { ...r, name: e.target.value } : r));
                                      }}
                                      className="h-8 border-0 bg-transparent px-2 py-1 text-sm"
                                    />
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
                    
                    {/* Cashflow Summary Rows */}
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

      {/* Snapshot Dialog */}
      <Dialog open={showSnapshotDialog} onOpenChange={setShowSnapshotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Snapshot name (optional)"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
            />
            <Button onClick={saveSnapshot} className="w-full gap-2">
              <Save className="w-4 h-4" />
              Save Snapshot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}