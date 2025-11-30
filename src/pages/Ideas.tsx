import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb, TrendingUp, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const presets = [
  { value: 'saas', label: 'SaaS', desc: 'Software as a Service' },
  { value: 'marketplace', label: 'Marketplace', desc: 'Two-sided platform' },
  { value: 'app', label: 'App', desc: 'Mobile or web app' },
  { value: 'hardware', label: 'Hardware', desc: 'Physical product' },
  { value: 'services', label: 'Services', desc: 'Professional services' },
  { value: 'ecommerce', label: 'E-commerce', desc: 'Online retail' },
  { value: 'subscription', label: 'Subscription', desc: 'Recurring revenue' },
];

export default function Ideas() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newIdea, setNewIdea] = useState({
    name: '',
    description: '',
    preset: 'saas'
  });

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newIdea.name || !newIdea.description) {
      toast.error("Please provide both name and description");
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate business model using AI
      const { data: modelData, error: modelError } = await supabase.functions.invoke('generate-business-model', {
        body: { 
          name: newIdea.name,
          description: newIdea.description,
          preset: newIdea.preset
        }
      });

      if (modelError) throw modelError;

      // Create idea with generated model
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          name: newIdea.name,
          description: newIdea.description,
          preset: newIdea.preset,
          business_model: modelData,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Idea created! Generating full business plan...");
      setNewIdea({ name: '', description: '', preset: 'saas' });
      
      // Navigate to the new idea
      navigate(`/idea/${data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create idea");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Idea deleted");
      loadIdeas();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Ideas</h1>
            <p className="text-muted-foreground">
              Test startup concepts instantly with AI-powered modeling
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary">
                <Plus className="w-4 h-4" />
                New Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Idea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Idea Name</Label>
                  <Input
                    placeholder="AI Email Assistant"
                    value={newIdea.name}
                    onChange={(e) => setNewIdea({ ...newIdea, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Business Model Preset</Label>
                  <Select
                    value={newIdea.preset}
                    onValueChange={(value) => setNewIdea({ ...newIdea, preset: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map(preset => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label} - {preset.desc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (1-3 sentences)</Label>
                  <Textarea
                    placeholder="An AI-powered email assistant that drafts professional responses in seconds, learns your writing style, and handles routine correspondence automatically."
                    value={newIdea.description}
                    onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleCreate} 
                  disabled={generating}
                  className="w-full gap-2 bg-gradient-primary"
                >
                  {generating ? (
                    <>Generating Business Model...</>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      Generate Business Model
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading your ideas...</div>
        ) : ideas.length === 0 ? (
          <Card className="p-12 text-center shadow-card">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No ideas yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by creating your first idea and let AI build the business model
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Card
                key={idea.id}
                className="p-6 shadow-card hover:shadow-md transition-all cursor-pointer animate-fade-in"
                onClick={() => navigate(`/idea/${idea.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="secondary">{idea.preset}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(idea.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mb-2">{idea.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {idea.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{idea.status}</Badge>
                  <span>•</span>
                  <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
