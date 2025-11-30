import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { calculateCashflow, type Transaction } from "@/lib/cashflow-engine";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function Cashflow() {
  const [cashflowData, setCashflowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      const formattedTx: Transaction[] = (txData || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        name: tx.name,
        amount: parseFloat(tx.amount),
        date: new Date(tx.date),
        is_recurring: tx.is_recurring,
        recurrence_frequency: tx.recurrence_frequency,
        recurrence_end_date: tx.recurrence_end_date ? new Date(tx.recurrence_end_date) : undefined,
        payment_delay_days: tx.payment_delay_days || 0,
        category_id: tx.category_id,
      }));

      const result = calculateCashflow(formattedTx, parseFloat(String(settings?.starting_cash || 0)), 24);
      setCashflowData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !cashflowData) return null;

  const filteredData = searchTerm
    ? cashflowData.monthlyData.filter((m: any) =>
        m.month.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cashflowData.monthlyData;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cashflow Forecast</h1>
          <p className="text-muted-foreground">
            Detailed month-by-month cashflow breakdown
          </p>
        </div>

        <Card className="mb-6 p-4">
          <Input
            placeholder="Search by month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </Card>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Month</TableHead>
                  <TableHead className="text-right">Cash In</TableHead>
                  <TableHead className="text-right">Cash Out</TableHead>
                  <TableHead className="text-right">Net Cashflow</TableHead>
                  <TableHead className="text-right">Cumulative Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((month: any, index: number) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right text-success font-semibold">
                      ${month.cashIn.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      ${month.cashOut.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {month.netCashflow >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className={month.netCashflow >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                          ${Math.abs(month.netCashflow).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${month.cumulativeCash.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          month.cumulativeCash > 0 ? 'default' :
                          month.cumulativeCash === 0 ? 'secondary' :
                          'destructive'
                        }
                      >
                        {month.cumulativeCash > 0 ? 'Positive' :
                         month.cumulativeCash === 0 ? 'Break Even' :
                         'Negative'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="mt-6 p-6 bg-muted/30">
          <h3 className="font-semibold mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Positive Months</p>
              <p className="text-lg font-bold text-success">
                {cashflowData.monthlyData.filter((m: any) => m.netCashflow > 0).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Negative Months</p>
              <p className="text-lg font-bold text-destructive">
                {cashflowData.monthlyData.filter((m: any) => m.netCashflow < 0).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Highest Inflow</p>
              <p className="text-lg font-bold">
                ${Math.max(...cashflowData.monthlyData.map((m: any) => m.cashIn)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Highest Outflow</p>
              <p className="text-lg font-bold">
                ${Math.max(...cashflowData.monthlyData.map((m: any) => m.cashOut)).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
