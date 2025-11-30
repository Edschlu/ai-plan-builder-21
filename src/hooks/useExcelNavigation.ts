import { useEffect, useCallback, useRef } from "react";

export interface CellPosition {
  rowId: string;
  columnIndex: number;
}

interface UseExcelNavigationProps {
  totalColumns: number;
  rowIds: string[];
  onNavigate: (position: CellPosition) => void;
  onEnterEditMode?: () => void;
  onExitEditMode?: () => void;
  isEditMode: boolean;
}

export function useExcelNavigation({
  totalColumns,
  rowIds,
  onNavigate,
  onEnterEditMode,
  onExitEditMode,
  isEditMode,
}: UseExcelNavigationProps) {
  const currentPositionRef = useRef<CellPosition | null>(null);

  const setCurrentPosition = useCallback((position: CellPosition | null) => {
    currentPositionRef.current = position;
  }, []);

  const navigateToCell = useCallback(
    (rowId: string, columnIndex: number) => {
      if (columnIndex < 0 || columnIndex >= totalColumns) return;
      
      const rowIndex = rowIds.indexOf(rowId);
      if (rowIndex === -1) return;

      const newPosition: CellPosition = { rowId, columnIndex };
      currentPositionRef.current = newPosition;
      onNavigate(newPosition);
    },
    [totalColumns, rowIds, onNavigate]
  );

  const moveUp = useCallback(() => {
    if (!currentPositionRef.current) return;
    const currentRowIndex = rowIds.indexOf(currentPositionRef.current.rowId);
    if (currentRowIndex > 0) {
      navigateToCell(rowIds[currentRowIndex - 1], currentPositionRef.current.columnIndex);
    }
  }, [rowIds, navigateToCell]);

  const moveDown = useCallback(() => {
    if (!currentPositionRef.current) return;
    const currentRowIndex = rowIds.indexOf(currentPositionRef.current.rowId);
    if (currentRowIndex < rowIds.length - 1) {
      navigateToCell(rowIds[currentRowIndex + 1], currentPositionRef.current.columnIndex);
    }
  }, [rowIds, navigateToCell]);

  const moveLeft = useCallback(() => {
    if (!currentPositionRef.current) return;
    if (currentPositionRef.current.columnIndex > 0) {
      navigateToCell(
        currentPositionRef.current.rowId,
        currentPositionRef.current.columnIndex - 1
      );
    }
  }, [navigateToCell]);

  const moveRight = useCallback(() => {
    if (!currentPositionRef.current) return;
    if (currentPositionRef.current.columnIndex < totalColumns - 1) {
      navigateToCell(
        currentPositionRef.current.rowId,
        currentPositionRef.current.columnIndex + 1
      );
    }
  }, [totalColumns, navigateToCell]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (isEditMode && e.key !== "Escape" && e.key !== "Enter") {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey } = e;
      const isMod = ctrlKey || metaKey;

      switch (key) {
        case "ArrowUp":
          e.preventDefault();
          if (isEditMode) {
            onExitEditMode?.();
          }
          moveUp();
          break;

        case "ArrowDown":
          e.preventDefault();
          if (isEditMode) {
            onExitEditMode?.();
          }
          moveDown();
          break;

        case "ArrowLeft":
          if (!isEditMode) {
            e.preventDefault();
            moveLeft();
          }
          break;

        case "ArrowRight":
          if (!isEditMode) {
            e.preventDefault();
            moveRight();
          }
          break;

        case "Tab":
          e.preventDefault();
          if (isEditMode) {
            onExitEditMode?.();
          }
          if (shiftKey) {
            moveLeft();
          } else {
            moveRight();
          }
          break;

        case "Enter":
          e.preventDefault();
          if (isEditMode) {
            onExitEditMode?.();
            moveDown();
          } else {
            onEnterEditMode?.();
          }
          break;

        case "Escape":
          if (isEditMode) {
            e.preventDefault();
            onExitEditMode?.();
          }
          break;

        case "F2":
          e.preventDefault();
          if (!isEditMode) {
            onEnterEditMode?.();
          }
          break;

        case "Delete":
        case "Backspace":
          if (!isEditMode) {
            e.preventDefault();
            // Signal to clear cell value
            onEnterEditMode?.();
          }
          break;

        default:
          // Start typing immediately (overwrite mode)
          if (
            !isEditMode &&
            !isMod &&
            key.length === 1 &&
            /^[a-zA-Z0-9=\-+/*.,]$/.test(key)
          ) {
            e.preventDefault();
            onEnterEditMode?.();
          }
          break;
      }
    },
    [
      isEditMode,
      moveUp,
      moveDown,
      moveLeft,
      moveRight,
      onEnterEditMode,
      onExitEditMode,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    currentPosition: currentPositionRef.current,
    setCurrentPosition,
    navigateToCell,
  };
}
