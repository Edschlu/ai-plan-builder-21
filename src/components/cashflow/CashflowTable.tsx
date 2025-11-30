import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CashflowCategory {
  id: string;
  name: string;
  type: string;
  color: string;
  sort_order: number;
}

interface CashflowRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  monthly_values: number[];
  sort_order: number;
}

interface CashflowTableProps {
  projectId: string;
}

export function CashflowTable({ projectId }: CashflowTableProps) {
  const [categories, setCategories] = useState<CashflowCategory[]>([]);
  const [rows, setRows] = useState<CashflowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from("cashflow_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (catError) throw catError;

      // Load rows
      const { data: rowsData, error: rowsError } = await supabase
        .from("cashflow_rows")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (rowsError) throw rowsError;

      setCategories(categoriesData || []);
      setRows(
        (rowsData || []).map((row) => ({
          ...row,
          monthly_values: Array.isArray(row.monthly_values)
            ? (row.monthly_values as any[]).map(v => Number(v) || 0)
            : Array(24).fill(0),
        }))
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCellValue = async (
    rowId: string,
    monthIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    const newValues = [...row.monthly_values];
    newValues[monthIndex] = numValue;

    // Optimistic update
    setRows(
      rows.map((r) =>
        r.id === rowId ? { ...r, monthly_values: newValues } : r
      )
    );

    try {
      const { error } = await supabase
        .from("cashflow_rows")
        .update({ monthly_values: newValues })
        .eq("id", rowId);

      if (error) throw error;
    } catch (error: any) {
      toast.error("Failed to update cell");
      loadData(); // Reload on error
    }
  };

  const getMonthName = (index: number): string => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const year = Math.floor(index / 12) + 1;
    const month = months[index % 12];
    return `${month} Y${year}`;
  };

  const calculateSubtotal = (categoryId: string, monthIndex: number): number => {
    return rows
      .filter((r) => r.category_id === categoryId)
      .reduce((sum, row) => sum + (Number(row.monthly_values[monthIndex]) || 0), 0);
  };

  const calculateGrandTotal = (monthIndex: number): number => {
    let revenue = 0;
    let costs = 0;

    categories.forEach((cat) => {
      const subtotal = calculateSubtotal(cat.id, monthIndex);
      if (cat.type === "revenue") {
        revenue += subtotal;
      } else {
        costs += subtotal;
      }
    });

    return revenue - costs;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-muted-foreground">Loading cashflow data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b min-w-[200px] sticky left-0 bg-muted/50">
                Line Item
              </th>
              {Array.from({ length: 24 }, (_, i) => (
                <th
                  key={i}
                  className="px-3 py-3 text-center text-sm font-semibold border-b min-w-[100px]"
                >
                  {getMonthName(i)}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold border-b min-w-[120px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const categoryRows = rows.filter(
                (r) => r.category_id === category.id
              );

              return (
                <React.Fragment key={category.id}>
                  {/* Category Header */}
                  <tr
                    style={{ backgroundColor: `${category.color}15` }}
                    className="font-semibold"
                  >
                    <td
                      className="px-4 py-3 border-b sticky left-0"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <div
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </td>
                    {Array.from({ length: 24 }, (_, i) => (
                      <td key={i} className="px-3 py-3 border-b text-center text-sm">
                        {formatCurrency(calculateSubtotal(category.id, i))}
                      </td>
                    ))}
                    <td className="px-4 py-3 border-b text-center font-semibold">
                      {formatCurrency(
                        Array.from({ length: 24 }, (_, i) => i).reduce(
                          (sum, i) => sum + calculateSubtotal(category.id, i),
                          0
                        )
                      )}
                    </td>
                  </tr>

                  {/* Category Rows */}
                  {categoryRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 border-b text-sm sticky left-0 bg-background">
                        {row.name}
                      </td>
                      {Array.from({ length: 24 }, (_, i) => (
                        <td key={i} className="px-3 py-2 border-b">
                          <Input
                            type="number"
                            value={(row.monthly_values[i] as number) || 0}
                            onChange={(e) =>
                              updateCellValue(row.id, i, e.target.value)
                            }
                            className="h-8 text-center text-sm border-none bg-transparent focus:bg-white focus:border-primary"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 border-b text-center text-sm font-medium">
                        {formatCurrency(
                          row.monthly_values.reduce((sum, val) => sum + (Number(val) || 0), 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Grand Total */}
            <tr className="bg-primary/10 font-bold">
              <td className="px-4 py-3 border-t-2 sticky left-0 bg-primary/10">
                Net Cashflow
              </td>
              {Array.from({ length: 24 }, (_, i) => {
                const total = calculateGrandTotal(i);
                return (
                  <td
                    key={i}
                    className={`px-3 py-3 border-t-2 text-center ${
                      total >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(total)}
                  </td>
                );
              })}
              <td className="px-4 py-3 border-t-2 text-center">
                {formatCurrency(
                  Array.from({ length: 24 }, (_, i) => i).reduce(
                    (sum, i) => sum + calculateGrandTotal(i),
                    0
                  )
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
