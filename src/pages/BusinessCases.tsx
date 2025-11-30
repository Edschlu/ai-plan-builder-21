import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CaseType = "strategic" | "daily";

export default function BusinessCases() {
  const [strategicCases, setStrategicCases] = useState<any[]>([]);
  const [dailyCases, setDailyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CaseType | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load strategic cases (ideas)
      const { data: strategic, error: strategicError } = await supabase
        .from('ideas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (strategicError) throw strategicError;
      setStrategicCases(strategic || []);

      // Load daily cases
      const { data: daily, error: dailyError } = await supabase
        .from('business_cases_daily')
        .select('*')
        .order('updated_at', { ascending: false });

      if (dailyError) throw dailyError;
      setDailyCases(daily || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createCase = async (name: string, description: string, type: CaseType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (type === "strategic") {
        const { data, error } = await supabase
          .from('ideas')
          .insert({ user_id: user.id, name, description })
          .select()
          .single();

        if (error) throw error;
        toast.success("Strategic case created");
        navigate(`/idea/${data.id}`);
      } else {
        const { error } = await supabase
          .from('business_cases_daily')
          .insert({ user_id: user.id, name, description });

        if (error) throw error;
        toast.success("Daily case created");
        loadCases();
      }

      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    if (selectedType) {
      createCase(name, description, selectedType);
    }
  };

  const CaseCard = ({ case: caseItem, type }: { case: any; type: CaseType }) => (
    <Card className="p-6 hover:shadow-card transition-all cursor-pointer" onClick={() => {
      if (type === "strategic") {
        navigate(`/idea/${caseItem.id}`);
      }
    }}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold">{caseItem.name}</h3>
        <Badge variant="secondary" className="ml-2">
          {caseItem.status || "draft"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {caseItem.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Updated {new Date(caseItem.updated_at).toLocaleDateString()}
        </span>
        <Button size="sm" variant="ghost">
          Open →
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Business Cases</h1>
            <p className="text-muted-foreground">
              Manage your strategic and daily business cases
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary">
                <Plus className="w-4 h-4" />
                New Business Case
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Business Case</DialogTitle>
              </DialogHeader>

              {!selectedType ? (
                <div className="space-y-4 py-4">
                  <Button
                    variant="outline"
                    className="w-full h-24 flex-col gap-2"
                    onClick={() => setSelectedType("strategic")}
                  >
                    <Briefcase className="w-8 h-8" />
                    <div>
                      <div className="font-semibold">Strategic Case</div>
                      <div className="text-xs text-muted-foreground">Full business planning</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex-col gap-2"
                    onClick={() => setSelectedType("daily")}
                  >
                    <Calendar className="w-8 h-8" />
                    <div>
                      <div className="font-semibold">Daily Case</div>
                      <div className="text-xs text-muted-foreground">Lightweight tracking</div>
                    </div>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Business case name" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Brief description" rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedType(null)} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">Create</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading cases...</div>
        ) : (
          <div className="space-y-12">
            {/* Strategic Cases */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Strategic Business Cases</h2>
                <Badge variant="secondary">{strategicCases.length}</Badge>
              </div>
              {strategicCases.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No strategic cases yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {strategicCases.map((caseItem) => (
                    <CaseCard key={caseItem.id} case={caseItem} type="strategic" />
                  ))}
                </div>
              )}
            </section>

            {/* Daily Cases */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-semibold">Daily Business Cases</h2>
                <Badge variant="secondary">{dailyCases.length}</Badge>
              </div>
              {dailyCases.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No daily cases yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dailyCases.map((caseItem) => (
                    <CaseCard key={caseItem.id} case={caseItem} type="daily" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
