import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ExcelCellProps {
  value: number;
  onChange: (value: number) => void;
  isSelected: boolean;
  isFocused: boolean;
  isRevenue?: boolean;
  isCost?: boolean;
  isHeadcount?: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onStartEdit: () => void;
  rowId: string;
  columnIndex: number;
}

export default function ExcelCell({
  value,
  onChange,
  isSelected,
  isFocused,
  isRevenue,
  isCost,
  isHeadcount,
  isHighlighted,
  onClick,
  onDoubleClick,
  onStartEdit,
  rowId,
  columnIndex,
}: ExcelCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const [originalValue, setOriginalValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value.toString());
      setOriginalValue(value.toString());
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Start editing when focused and edit mode triggered
  useEffect(() => {
    if (isFocused && !isEditing) {
      // Listen for character input to start editing
      const handleKeyPress = (e: KeyboardEvent) => {
        if (
          e.key.length === 1 &&
          /^[a-zA-Z0-9=\-+/*.,]$/.test(e.key) &&
          !e.ctrlKey &&
          !e.metaKey
        ) {
          setIsEditing(true);
          setLocalValue(e.key);
        }
      };

      document.addEventListener("keypress", handleKeyPress);
      return () => document.removeEventListener("keypress", handleKeyPress);
    }
  }, [isFocused, isEditing]);

  const commitChange = useCallback(() => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (localValue === "") {
      onChange(0);
    }
    setIsEditing(false);
  }, [localValue, onChange]);

  const cancelEdit = useCallback(() => {
    setLocalValue(originalValue);
    setIsEditing(false);
  }, [originalValue]);

  const handleCellClick = () => {
    onClick();
  };

  const handleCellDoubleClick = () => {
    setIsEditing(true);
    onDoubleClick();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent global handlers from firing

    switch (e.key) {
      case "Enter":
        commitChange();
        break;
      case "Escape":
        cancelEdit();
        break;
      case "Tab":
        e.preventDefault();
        commitChange();
        break;
    }
  };

  const handleInputBlur = () => {
    commitChange();
  };

  const formatDisplayValue = (val: number): string => {
    if (val === 0) return "0";
    return val.toLocaleString("de-DE");
  };

  const bgClass = cn(
    "transition-colors",
    isRevenue && "bg-success/5 hover:bg-success/10",
    isCost && "bg-destructive/5 hover:bg-destructive/10",
    isHeadcount && "bg-primary/5 hover:bg-primary/10",
    !isRevenue && !isCost && !isHeadcount && "hover:bg-muted/30",
    isHighlighted && "bg-accent/10",
    isSelected && !isFocused && "bg-primary/15",
    isFocused && "ring-2 ring-primary ring-inset"
  );

  const textClass = cn(
    "font-mono text-sm",
    isRevenue && "text-success font-semibold",
    isCost && "text-destructive",
    isHeadcount && "text-primary",
    !isRevenue && !isCost && !isHeadcount && "text-foreground"
  );

  return (
    <div
      ref={cellRef}
      className={cn(
        "relative h-full min-h-[42px] cursor-cell select-none",
        bgClass
      )}
      onClick={handleCellClick}
      onDoubleClick={handleCellDoubleClick}
      data-row-id={rowId}
      data-column-index={columnIndex}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className={cn(
            "w-full h-full px-3 py-3 text-center border-0 outline-none bg-white",
            textClass,
            "focus:ring-2 focus:ring-primary"
          )}
          autoComplete="off"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full px-3 py-3 text-center flex items-center justify-center",
            textClass
          )}
        >
          {formatDisplayValue(value)}
        </div>
      )}

      {/* Fill handle (small square in bottom-right corner) */}
      {isFocused && !isEditing && (
        <div
          className="absolute bottom-0 right-0 w-2 h-2 bg-primary cursor-crosshair z-10"
          onMouseDown={(e) => {
            e.stopPropagation();
            // Will implement drag-to-fill in Phase 3
          }}
        />
      )}
    </div>
  );
}
