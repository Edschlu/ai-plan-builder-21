import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CashflowCell } from "./CashflowCell";
import { RowContextMenu } from "./RowContextMenu";

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
  const [selectedCell, setSelectedCell] = useState<{
    rowId: string;
    monthIndex: number;
  } | null>(null);
  const [dragState, setDragState] = useState<{
    active: boolean;
    startRowId: string;
    startMonth: number;
    startValue: number;
    endMonth: number;
  } | null>(null);

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

  // Drag-to-fill handlers
  const handleDragStart = (rowId: string, monthIndex: number, value: number) => {
    setDragState({
      active: true,
      startRowId: rowId,
      startMonth: monthIndex,
      startValue: value,
      endMonth: monthIndex,
    });
  };

  const handleDragEnter = (monthIndex: number) => {
    if (dragState?.active) {
      setDragState({ ...dragState, endMonth: monthIndex });
    }
  };

  const handleDragEnd = useCallback(() => {
    if (!dragState?.active) return;

    const { startRowId, startMonth, endMonth, startValue } = dragState;
    const row = rows.find((r) => r.id === startRowId);
    if (!row) return;

    const minMonth = Math.min(startMonth, endMonth);
    const maxMonth = Math.max(startMonth, endMonth);

    // Fill cells with the starting value
    const newValues = [...row.monthly_values];
    for (let i = minMonth; i <= maxMonth; i++) {
      newValues[i] = startValue;
    }

    setRows(
      rows.map((r) =>
        r.id === startRowId ? { ...r, monthly_values: newValues } : r
      )
    );

    // Save to database
    supabase
      .from("cashflow_rows")
      .update({ monthly_values: newValues })
      .eq("id", startRowId)
      .then(({ error }) => {
        if (error) {
          toast.error("Failed to fill cells");
          loadData();
        }
      });

    setDragState(null);
  }, [dragState, rows]);

  // Keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowId: string,
    monthIndex: number
  ) => {
    const allRows = rows.flatMap((row) =>
      Array.from({ length: 24 }, (_, i) => ({ rowId: row.id, month: i }))
    );
    const currentIndex = allRows.findIndex(
      (cell) => cell.rowId === rowId && cell.month === monthIndex
    );

    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < allRows.length) {
        setSelectedCell({ rowId: allRows[nextIndex].rowId, monthIndex: allRows[nextIndex].month });
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (monthIndex < 23) {
        setSelectedCell({ rowId, monthIndex: monthIndex + 1 });
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (monthIndex > 0) {
        setSelectedCell({ rowId, monthIndex: monthIndex - 1 });
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const rowIds = rows.map((r) => r.id);
      const currentRowIndex = rowIds.indexOf(rowId);
      if (currentRowIndex < rowIds.length - 1) {
        setSelectedCell({ rowId: rowIds[currentRowIndex + 1], monthIndex });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const rowIds = rows.map((r) => r.id);
      const currentRowIndex = rowIds.indexOf(rowId);
      if (currentRowIndex > 0) {
        setSelectedCell({ rowId: rowIds[currentRowIndex - 1], monthIndex });
      }
    }
  };

  // Row manipulation functions
  const addRow = async (categoryId: string, afterRowId?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const categoryRows = rows.filter((r) => r.category_id === categoryId);
      const sortOrder = afterRowId
        ? (rows.find((r) => r.id === afterRowId)?.sort_order || 0) + 1
        : categoryRows.length;

      const { data, error } = await supabase
        .from("cashflow_rows")
        .insert({
          project_id: projectId,
          user_id: user.id,
          category_id: categoryId,
          name: "New Item",
          monthly_values: Array(24).fill(0),
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newRow: CashflowRow = {
        id: data.id,
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        monthly_values: Array(24).fill(0),
        sort_order: data.sort_order,
      };

      setRows([...rows, newRow]);
      toast.success("Row added");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const duplicateRow = async (rowId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const sourceRow = rows.find((r) => r.id === rowId);
      if (!sourceRow) return;

      const { data, error } = await supabase
        .from("cashflow_rows")
        .insert({
          project_id: projectId,
          user_id: user.id,
          category_id: sourceRow.category_id,
          name: `${sourceRow.name} (Copy)`,
          monthly_values: sourceRow.monthly_values,
          sort_order: sourceRow.sort_order + 1,
        })
        .select()
        .single();

      if (error) throw error;

      const newRow: CashflowRow = {
        id: data.id,
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        monthly_values: (data.monthly_values as any[]).map((v) => Number(v) || 0),
        sort_order: data.sort_order,
      };

      setRows([...rows, newRow]);
      toast.success("Row duplicated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteRow = async (rowId: string) => {
    try {
      const { error } = await supabase
        .from("cashflow_rows")
        .delete()
        .eq("id", rowId);

      if (error) throw error;

      setRows(rows.filter((r) => r.id !== rowId));
      toast.success("Row deleted");
    } catch (error: any) {
      toast.error(error.message);
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
                    <RowContextMenu
                      key={row.id}
                      onDuplicate={() => duplicateRow(row.id)}
                      onDelete={() => deleteRow(row.id)}
                      onAddAbove={() => addRow(category.id, row.id)}
                      onAddBelow={() => addRow(category.id, row.id)}
                    >
                      <tr className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-2 border-b text-sm sticky left-0 bg-background">
                          {row.name}
                        </td>
                        {Array.from({ length: 24 }, (_, i) => (
                          <td key={i} className="px-3 py-2 border-b">
                            <CashflowCell
                              value={(row.monthly_values[i] as number) || 0}
                              rowId={row.id}
                              monthIndex={i}
                              rowName={row.name}
                              onUpdate={updateCellValue}
                              onKeyDown={handleKeyDown}
                              onDragStart={handleDragStart}
                              onDragEnter={handleDragEnter}
                              onDragEnd={handleDragEnd}
                              isSelected={
                                selectedCell?.rowId === row.id &&
                                selectedCell?.monthIndex === i
                              }
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2 border-b text-center text-sm font-medium">
                          {formatCurrency(
                            row.monthly_values.reduce((sum, val) => sum + (Number(val) || 0), 0)
                          )}
                        </td>
                      </tr>
                    </RowContextMenu>
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
