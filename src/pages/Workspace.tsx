import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Workspace() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members(count)
        `)
        .or(`owner_id.eq.${user.id},id.in.(select workspace_id from workspace_members where user_id='${user.id}')`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('workspaces')
        .insert({
          owner_id: user.id,
          name
        });

      if (error) throw error;
      
      toast.success("Workspace created");
      loadWorkspaces();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workspaces</h1>
            <p className="text-muted-foreground">
              Collaborate with your team on ideas and business plans
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary">
                <Plus className="w-4 h-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Workspace name" id="workspace-name" />
                <Button 
                  onClick={() => {
                    const input = document.getElementById('workspace-name') as HTMLInputElement;
                    createWorkspace(input.value);
                  }}
                  className="w-full"
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <Card className="p-12 text-center shadow-card">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground mb-6">
              Create a workspace to collaborate with your team
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="p-6 shadow-card hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">{workspace.name}</h3>
                  <Badge variant="secondary">
                    {workspace.workspace_members?.[0]?.count || 0} members
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Invite Members
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
