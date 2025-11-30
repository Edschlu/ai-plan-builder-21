import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface RowContextMenuProps {
  children: React.ReactNode;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
}

export function RowContextMenu({
  children,
  onDuplicate,
  onDelete,
  onAddAbove,
  onAddBelow,
}: RowContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onAddAbove}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Add Row Above
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddBelow}>
          <Plus className="mr-2 h-4 w-4" />
          Add Row Below
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Row
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Row
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
