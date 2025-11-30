import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp } from "lucide-react";
import { CashflowTable } from "@/components/cashflow/CashflowTable";

interface CashflowProject {
  id: string;
  name: string;
  description: string | null;
  template_type: string | null;
  created_at: string;
}

const templates = [
  { value: "saas", label: "SaaS Startup", description: "Recurring revenue, churn, CAC" },
  { value: "ecommerce", label: "E-Commerce", description: "COGS, inventory, shipping" },
  { value: "agency", label: "Agency", description: "Project revenue, freelancers" },
  { value: "hardware", label: "Hardware Startup", description: "Manufacturing, R&D" },
  { value: "empty", label: "Empty Template", description: "Start from scratch" },
];

export default function Cashflow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<CashflowProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    template_type: "saas",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(projectId);
      }
    } else if (projects.length > 0 && !selectedProject) {
      // Auto-select first project
      setSelectedProject(projects[0].id);
      navigate(`/cashflow?project=${projects[0].id}`, { replace: true });
    }
  }, [searchParams, projects]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("cashflow_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { data: project, error } = await supabase
        .from("cashflow_projects")
        .insert({
          user_id: user.id,
          name: newProject.name,
          description: newProject.description,
          template_type: newProject.template_type,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Project created!");
      setProjects([project, ...projects]);
      setSelectedProject(project.id);
      navigate(`/cashflow?project=${project.id}`);
      setDialogOpen(false);
      setNewProject({ name: "", description: "", template_type: "saas" });

      // Initialize template data
      await initializeTemplate(project.id, newProject.template_type);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const initializeTemplate = async (projectId: string, templateType: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Define category structure
    const categories = [
      { name: "Revenue Streams", type: "revenue", color: "#10b981" },
      { name: "Operating Costs", type: "operating_costs", color: "#ef4444" },
      { name: "Personnel", type: "personnel", color: "#3b82f6" },
      { name: "Marketing & Sales", type: "marketing", color: "#f59e0b" },
      { name: "Equipment & Assets", type: "equipment", color: "#8b5cf6" },
    ];

    try {
      // Insert categories
      const { data: insertedCategories, error: catError } = await supabase
        .from("cashflow_categories")
        .insert(
          categories.map((cat, idx) => ({
            project_id: projectId,
            user_id: user.id,
            ...cat,
            sort_order: idx,
          }))
        )
        .select();

      if (catError) throw catError;

      // Insert template-specific rows
      const rows = getTemplateRows(templateType, insertedCategories!);
      const { error: rowError } = await supabase
        .from("cashflow_rows")
        .insert(rows);

      if (rowError) throw rowError;
    } catch (error: any) {
      console.error("Error initializing template:", error);
      toast.error("Error setting up template");
    }
  };

  const getTemplateRows = (templateType: string, categories: any[]) => {
    const findCategory = (type: string) =>
      categories.find((c) => c.type === type)?.id;

    const userId = categories[0]?.user_id || "";

    // Generate growth values (base + 5% monthly growth)
    const generateGrowth = (base: number, months: number = 24) =>
      Array.from({ length: months }, (_, i) => Math.round(base * Math.pow(1.05, i)));

    const commonRows: any[] = [];

    if (templateType === "saas") {
      return [
        {
          project_id: categories[0].project_id,
          user_id: userId,
          category_id: findCategory("revenue"),
          name: "Monthly Recurring Revenue (MRR)",
          monthly_values: generateGrowth(10000),
          sort_order: 0,
        },
        {
          project_id: categories[0].project_id,
          user_id: userId,
          category_id: findCategory("revenue"),
          name: "Annual Contracts",
          monthly_values: [50000, 0, 0, 75000, 0, 0, 100000, 0, 0, 125000, 0, 0, ...Array(12).fill(0)],
          sort_order: 1,
        },
        {
          project_id: categories[0].project_id,
          user_id: userId,
          category_id: findCategory("operating_costs"),
          name: "Server & Infrastructure",
          monthly_values: generateGrowth(2000),
          sort_order: 0,
        },
        {
          project_id: categories[0].project_id,
          user_id: userId,
          category_id: findCategory("operating_costs"),
          name: "SaaS Tools & Licenses",
          monthly_values: Array(24).fill(800),
          sort_order: 1,
        },
        {
          project_id: categories[0].project_id,
          user_id: userId,
          category_id: findCategory("personnel"),
          name: "Engineering Team",
          monthly_values: Array(24).fill(25000),
          sort_order: 0,
        },
        {
          project_id: categories[0].project_id,
          user_id: userId,
          category_id: findCategory("marketing"),
          name: "Paid Advertising",
          monthly_values: generateGrowth(5000),
          sort_order: 0,
        },
      ];
    }

    // Add more template types here (ecommerce, agency, etc.)
    return commonRows;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cashflow Management</h1>
            <p className="text-muted-foreground">
              AI-powered financial planning for startups
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Cashflow Project</DialogTitle>
                <DialogDescription>
                  Start with a template or build from scratch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Q1 2024 Forecast"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief overview of this project..."
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={newProject.template_type}
                    onValueChange={(value) =>
                      setNewProject({ ...newProject, template_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first cashflow project to get started
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : selectedProject ? (
          <CashflowTable projectId={selectedProject} />
        ) : null}
      </div>
    </div>
  );
}
