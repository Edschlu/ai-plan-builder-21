import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Edit2, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function DataInput() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    type: 'revenue',
    name: '',
    amount: '',
    date: '',
    category_id: '',
    is_recurring: false,
    recurrence_frequency: 'monthly',
    payment_delay_days: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      setCategories(catData || []);

      // Load transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      setTransactions(txData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
      });

      if (error) throw error;

      toast.success("Transaction added");
      setNewTransaction({
        type: 'revenue',
        name: '',
        amount: '',
        date: '',
        category_id: '',
        is_recurring: false,
        recurrence_frequency: 'monthly',
        payment_delay_days: 0,
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Transaction deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Data Input</h1>
            <p className="text-muted-foreground">
              Manage your revenue and expenses
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Transactions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with columns: name, amount, date, type, category
                  </p>
                  <Input type="file" accept=".csv" />
                  <Button className="w-full">Upload & Import</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-primary">
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newTransaction.type}
                        onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Transaction name"
                        value={newTransaction.name}
                        onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <Switch
                      checked={newTransaction.is_recurring}
                      onCheckedChange={(checked) => setNewTransaction({ ...newTransaction, is_recurring: checked })}
                    />
                    <div className="flex-1">
                      <Label>Recurring Transaction</Label>
                      <p className="text-xs text-muted-foreground">Enable for monthly subscriptions, salaries, etc.</p>
                    </div>
                  </div>

                  {newTransaction.is_recurring && (
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={newTransaction.recurrence_frequency}
                        onValueChange={(value) => setNewTransaction({ ...newTransaction, recurrence_frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Payment Delay (days)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newTransaction.payment_delay_days}
                      onChange={(e) => setNewTransaction({ ...newTransaction, payment_delay_days: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">For invoices with 30/60/90 day payment terms</p>
                  </div>

                  <Button onClick={handleAdd} className="w-full bg-gradient-primary">
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{tx.name}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'revenue' ? 'default' : 'secondary'}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={tx.type === 'revenue' ? 'text-success' : 'text-destructive'}>
                    ${parseFloat(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {tx.is_recurring && (
                      <Badge variant="outline">{tx.recurrence_frequency}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
