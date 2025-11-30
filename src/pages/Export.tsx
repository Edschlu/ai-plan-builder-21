import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateCashflow, exportToCsv, type Transaction } from "@/lib/cashflow-engine";
import { toast } from "sonner";

export default function Export() {
  const [cashflowData, setCashflowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const downloadCsv = () => {
    if (!cashflowData) return;

    const csv = exportToCsv(cashflowData.monthlyData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-forecast-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const downloadExcel = () => {
    toast.info("Excel export coming soon!");
  };

  const downloadPdf = () => {
    toast.info("PDF export coming soon!");
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Export</h1>
            <p className="text-muted-foreground">
              Download your cashflow forecast and analysis
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 shadow-card hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Export to CSV</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download your 24-month cashflow forecast as a CSV file. Perfect for importing into Excel or Google Sheets.
                  </p>
                  <Button onClick={downloadCsv} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Export to Excel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a fully formatted Excel workbook with all data, formulas, and charts. Includes all scenarios.
                  </p>
                  <Button onClick={downloadExcel} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Excel (Coming Soon)
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Export to PDF</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a professional PDF report with dashboard, charts, and forecast tables. Perfect for sharing with investors.
                  </p>
                  <Button onClick={downloadPdf} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF (Coming Soon)
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card bg-muted/30">
              <h3 className="text-lg font-semibold mb-4">Current Forecast Summary</h3>
              {cashflowData && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cash In (24mo)</p>
                    <p className="text-xl font-bold">${cashflowData.totalCashIn.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cash Out (24mo)</p>
                    <p className="text-xl font-bold">${cashflowData.totalCashOut.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Burn Rate</p>
                    <p className="text-xl font-bold">${cashflowData.averageBurnRate.toLocaleString()}/mo</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Runway</p>
                    <p className="text-xl font-bold">{cashflowData.runway} months</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
