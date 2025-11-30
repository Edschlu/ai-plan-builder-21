import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CashflowCellProps {
  value: number;
  rowId: string;
  monthIndex: number;
  rowName: string;
  onUpdate: (rowId: string, monthIndex: number, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowId: string, monthIndex: number) => void;
  onDragStart: (rowId: string, monthIndex: number, value: number) => void;
  onDragEnter: (monthIndex: number) => void;
  onDragEnd: () => void;
  isSelected?: boolean;
}

export function CashflowCell({
  value,
  rowId,
  monthIndex,
  rowName,
  onUpdate,
  onKeyDown,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isSelected,
}: CashflowCellProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isSelected]);

  const formatCurrency = (val: number): string => {
    if (!isFocused && val !== 0) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return String(val);
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={`relative ${isSelected ? "ring-2 ring-primary" : ""}`}
            onMouseDown={(e) => {
              if (e.button === 0) {
                // Left click
                onDragStart(rowId, monthIndex, value);
              }
            }}
            onMouseEnter={() => onDragEnter(monthIndex)}
            onMouseUp={onDragEnd}
          >
            <Input
              ref={inputRef}
              type="text"
              value={isFocused ? value : formatCurrency(value)}
              onChange={(e) => onUpdate(rowId, monthIndex, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, rowId, monthIndex)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="h-8 text-center text-sm border-none bg-transparent hover:bg-muted/50 focus:bg-white focus:border-primary transition-colors"
              data-row-id={rowId}
              data-month={monthIndex}
            />
            {/* Drag handle indicator */}
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary/50 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            <strong>{rowName}</strong> - Month {monthIndex + 1}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(value)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
