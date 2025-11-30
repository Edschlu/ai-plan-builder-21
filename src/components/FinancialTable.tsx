import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

export default function FinancialTable({ ideaId }: { ideaId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>({
    revenue_growth_rate: 0,
    cost_inflation_rate: 0,
    starting_cash: 50000
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (rowsResult.data) {
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
      if (assumptionsResult.data) setAssumptions(assumptionsResult.data);
      
      if (!categoriesResult.data || categoriesResult.data.length === 0) {
        await generateInitialData();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialData = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: idea } = await supabase.from('ideas').select('*').eq('id', ideaId).single();
      if (!idea) return;

      // Generate initial structure with AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-financial-table', {
        body: { 
          name: idea.name,
          description: idea.description,
          businessModel: idea.business_model
        }
      });

      if (aiError) throw aiError;

      // Insert categories
      const { data: newCategories } = await supabase
        .from('plan_categories')
        .insert(
          aiData.categories.map((cat: any, idx: number) => ({
            idea_id: ideaId,
            user_id: user.id,
            name: cat.name,
            type: cat.type,
            color: cat.color,
            sort_order: idx
          }))
        )
        .select();

      // Insert rows
      if (newCategories) {
        const rowsToInsert = aiData.rows.map((row: any, idx: number) => {
          const category = newCategories.find(c => c.type === row.category_type);
          return {
            idea_id: ideaId,
            user_id: user.id,
            category_id: category?.id,
            name: row.name,
            row_type: row.type,
            monthly_values: row.values || Array(24).fill(0),
            is_recurring: row.is_recurring || false,
            payment_delay_days: row.payment_delay_days || 0,
            sort_order: idx
          };
        });

        await supabase.from('plan_rows').insert(rowsToInsert);
      }

      // Insert assumptions
      await supabase.from('forecast_assumptions').insert({
        idea_id: ideaId,
        user_id: user.id,
        revenue_growth_rate: aiData.assumptions?.revenue_growth_rate || 10,
        cost_inflation_rate: aiData.assumptions?.cost_inflation_rate || 3,
        starting_cash: aiData.assumptions?.starting_cash || 50000,
        scenario_type: 'base'
      });

      toast.success("Financial table generated!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate data");
    } finally {
      setGenerating(false);
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

  const calculateCashflow = () => {
    const monthlyData = Array(24).fill(0).map((_, monthIndex) => {
      const revenue = rows
        .filter(r => r.row_type === 'revenue')
        .reduce((sum, r) => sum + (r.monthly_values[monthIndex] || 0), 0);
      
      const costs = rows
        .filter(r => ['cost', 'headcount', 'investment', 'tax'].includes(r.row_type))
        .reduce((sum, r) => sum + (r.monthly_values[monthIndex] || 0), 0);

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

  if (loading) return <div className="text-center py-12">Loading financial table...</div>;

  if (generating) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold mb-2">Generating Financial Table</h3>
        <p className="text-muted-foreground">
          AI is creating your initial financial structure with categories and forecasts...
        </p>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Button onClick={generateInitialData} className="gap-2 bg-gradient-primary">
          <Sparkles className="w-4 h-4" />
          Generate Financial Table
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecast Controls */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">Forecast Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Starting Cash</label>
            <Input 
              type="number" 
              value={assumptions.starting_cash}
              onChange={(e) => setAssumptions({ ...assumptions, starting_cash: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Revenue Growth: {assumptions.revenue_growth_rate}%
            </label>
            <Slider 
              value={[assumptions.revenue_growth_rate]} 
              onValueChange={([value]) => setAssumptions({ ...assumptions, revenue_growth_rate: value })}
              min={-20}
              max={50}
              step={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Cost Inflation: {assumptions.cost_inflation_rate}%
            </label>
            <Slider 
              value={[assumptions.cost_inflation_rate]} 
              onValueChange={([value]) => setAssumptions({ ...assumptions, cost_inflation_rate: value })}
              min={-10}
              max={20}
              step={1}
            />
          </div>
        </div>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Costs</span>
          </div>
          <p className="text-2xl font-bold">${totalCosts.toLocaleString()}</p>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Net Profit</span>
          </div>
          <p className={cn("text-2xl font-bold", totalRevenue - totalCosts > 0 ? "text-success" : "text-destructive")}>
            ${(totalRevenue - totalCosts).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Final Cash</span>
          </div>
          <p className={cn("text-2xl font-bold", finalCash > 0 ? "text-success" : "text-destructive")}>
            ${finalCash.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b min-w-[200px]">Item</th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className="px-2 py-3 text-center text-xs font-medium border-b min-w-[80px]">
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
                  <div key={category.id}>
                    <tr className="bg-muted/30 hover:bg-muted/50 cursor-pointer" onClick={() => toggleCategory(category.id)}>
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
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); addRow(category.id); }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                    {!category.is_collapsed && categoryRows.map((row) => {
                      const rowTotal = row.monthly_values.reduce((sum, val) => sum + val, 0);
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
                            <td key={monthIndex} className="border-b">
                              <Input 
                                type="number"
                                value={value}
                                onChange={(e) => updateCellValue(row.id, monthIndex, Number(e.target.value))}
                                className={cn(
                                  "h-8 w-full border-0 text-center text-xs px-1 py-1 font-mono",
                                  row.row_type === 'revenue' ? "bg-success/5" : "bg-destructive/5"
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
                  </div>
                );
              })}
              
              {/* Cashflow Summary Rows */}
              <tr className="bg-primary/5 font-semibold">
                <td className="px-4 py-3 border-b">Net Cashflow</td>
                {cashflowData.map((data, i) => (
                  <td key={i} className={cn("px-2 py-3 text-center text-xs border-b font-mono", data.net > 0 ? "text-success" : "text-destructive")}>
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
                  <td key={i} className={cn("px-2 py-3 text-center text-xs border-b font-mono", data.cash > 0 ? "text-success" : "text-destructive")}>
                    ${data.cash.toLocaleString()}
                  </td>
                ))}
                <td className="px-4 py-3 text-right border-b font-mono">
                  ${finalCash.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}