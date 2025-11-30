import { Button } from "@/components/ui/button";
import { Plus, ChevronsDown, ChevronsUp, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuickActionsToolbarProps {
  onAddRevenue?: () => void;
  onAddCost?: () => void;
  onAddHeadcount?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onReset?: () => void;
  templateName?: string;
  scenarioType?: string;
}

export default function QuickActionsToolbar({
  onAddRevenue,
  onAddCost,
  onAddHeadcount,
  onExpandAll,
  onCollapseAll,
  onReset,
  templateName,
  scenarioType,
}: QuickActionsToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-card/50">
      <div className="flex items-center gap-2">
        {templateName && (
          <Badge variant="secondary" className="text-sm">
            {templateName}
          </Badge>
        )}
        {scenarioType && (
          <Badge variant="outline" className="text-sm">
            {scenarioType}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRevenue}
          className="gap-2 text-success hover:text-success hover:bg-success/10"
        >
          <Plus className="w-4 h-4" />
          Revenue Item
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddCost}
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Plus className="w-4 h-4" />
          Cost Item
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddHeadcount}
          className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
        >
          <Plus className="w-4 h-4" />
          Headcount Role
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <Button variant="ghost" size="sm" onClick={onExpandAll} className="gap-2">
          <ChevronsDown className="w-4 h-4" />
          Expand All
        </Button>
        <Button variant="ghost" size="sm" onClick={onCollapseAll} className="gap-2">
          <ChevronsUp className="w-4 h-4" />
          Collapse All
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
