import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  isRevenue?: boolean;
  isCost?: boolean;
  isHeadcount?: boolean;
  isHighlighted?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export default function EditableCell({
  value,
  onChange,
  isRevenue,
  isCost,
  isHeadcount,
  isHighlighted,
  onKeyDown,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(localValue) || 0;
    onChange(numValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
      onKeyDown?.(e);
    } else if (e.key === "Escape") {
      setLocalValue(value.toString());
      setIsEditing(false);
    }
    onKeyDown?.(e);
  };

  const increment = (amount: number) => {
    const newValue = value + amount;
    onChange(newValue);
  };

  const bgClass = cn(
    "transition-colors",
    isRevenue && "bg-success/5 hover:bg-success/10",
    isCost && "bg-destructive/5 hover:bg-destructive/10",
    isHeadcount && "bg-primary/5 hover:bg-primary/10",
    !isRevenue && !isCost && !isHeadcount && "hover:bg-muted/30",
    isHighlighted && "bg-accent/10"
  );

  const textClass = cn(
    "font-mono text-sm",
    isRevenue && "text-success",
    isCost && "text-destructive",
    isHeadcount && "text-primary",
    !isRevenue && !isCost && !isHeadcount && "text-foreground"
  );

  return (
    <div
      className={cn("relative group h-full", bgClass)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-full px-3 py-3 text-center border-0 outline-none focus:ring-2 focus:ring-primary/20",
            textClass,
            bgClass
          )}
        />
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "w-full h-full px-3 py-3 text-center cursor-text",
            textClass
          )}
        >
          {value.toLocaleString()}
        </div>
      )}
      
      {/* Increment/decrement arrows on hover */}
      {isHovered && !isEditing && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              increment(100);
            }}
            className="p-0.5 hover:bg-primary/10 rounded"
          >
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              increment(-100);
            }}
            className="p-0.5 hover:bg-primary/10 rounded"
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
