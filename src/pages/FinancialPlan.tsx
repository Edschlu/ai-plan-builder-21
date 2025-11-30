import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function FinancialPlan() {
  const navigate = useNavigate();
  const [model, setModel] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    const storedModel = localStorage.getItem('financialModel');
    if (!storedModel) {
      navigate('/onboarding');
      return;
    }
    setModel(JSON.parse(storedModel));
  }, [navigate]);

  const handleEdit = (key: string, value: any) => {
    setEditing(key);
    setEditValues({ [key]: value });
  };

  const handleSave = (key: string) => {
    const updatedModel = { ...model, [key]: editValues[key] };
    setModel(updatedModel);
    localStorage.setItem('financialModel', JSON.stringify(updatedModel));
    setEditing(null);
    toast.success("Assumption updated successfully");
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValues({});
  };

  if (!model) return null;

  const assumptions = [
    { key: "initialInvestment", label: "Initial Investment", value: model.initialInvestment, prefix: "$", type: "number" },
    { key: "monthlyBurn", label: "Monthly Burn Rate", value: model.monthlyBurn, prefix: "$", type: "number" },
    { key: "averageRevenuePerCustomer", label: "Avg Revenue Per Customer", value: model.averageRevenuePerCustomer || 99, prefix: "$", type: "number" },
    { key: "customerAcquisitionCost", label: "Customer Acquisition Cost", value: model.customerAcquisitionCost || 50, prefix: "$", type: "number" },
    { key: "churnRate", label: "Monthly Churn Rate", value: model.churnRate || 5, suffix: "%", type: "number" },
    { key: "growthRate", label: "Monthly Growth Rate", value: model.growthRate || 15, suffix: "%", type: "number" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Financial Plan</h1>
          <p className="text-muted-foreground">
            Edit your assumptions to see how they impact your projections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Key Assumptions</h2>
            <Card className="p-6 shadow-card space-y-4">
              {assumptions.map((assumption) => (
                <div key={assumption.key} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-1 block">
                      {assumption.label}
                    </Label>
                    {editing === assumption.key ? (
                      <div className="flex items-center gap-2 mt-2">
                        {assumption.prefix && <span className="text-muted-foreground">{assumption.prefix}</span>}
                        <Input
                          type={assumption.type}
                          value={editValues[assumption.key]}
                          onChange={(e) => setEditValues({ [assumption.key]: e.target.value })}
                          className="w-32"
                        />
                        {assumption.suffix && <span className="text-muted-foreground">{assumption.suffix}</span>}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">
                        {assumption.prefix}{assumption.value.toLocaleString()}{assumption.suffix}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editing === assumption.key ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(assumption.key)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(assumption.key, assumption.value)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Monthly Breakdown</h2>
            <Card className="p-6 shadow-card">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {(model.monthlyData || []).slice(0, 12).map((month: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Month {month.month}</span>
                      <span className={`font-semibold ${month.netCashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ${month.netCashflow.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">${month.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Costs</p>
                        <p className="font-medium">${month.costs.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Headcount</p>
                        <p className="font-medium">{month.headcount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liquidity</p>
                        <p className="font-medium">${month.cumulativeLiquidity.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card className="mt-6 p-6 shadow-card">
          <h2 className="text-xl font-semibold mb-4">Personnel Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-right py-3 px-4">Count</th>
                  <th className="text-right py-3 px-4">Avg Salary</th>
                  <th className="text-right py-3 px-4">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {(model.personnelPlan || [
                  { role: "Engineers", count: 3, salary: 120000 },
                  { role: "Product/Design", count: 2, salary: 100000 },
                  { role: "Sales/Marketing", count: 2, salary: 90000 },
                  { role: "Operations", count: 1, salary: 80000 }
                ]).map((person: any, index: number) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4">{person.role}</td>
                    <td className="text-right py-3 px-4">{person.count}</td>
                    <td className="text-right py-3 px-4">${person.salary.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-semibold">
                      ${(person.count * person.salary).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
