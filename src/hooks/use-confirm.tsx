"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmOptions {
  /** Dialog heading. Defaults to "Are you sure?" (destructive) or "Confirm". */
  title?: string;
  /** Body text shown below the title. */
  description: string;
  /** Confirm button label. Defaults to "Delete" (destructive) or "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** When true the confirm button uses the destructive (red) variant. */
  destructive?: boolean;
}

// ─── Stable module-level component ───────────────────────────────────────────
// Defined OUTSIDE useConfirm so React sees the same component type on every
// render. Defining it inside the hook creates a new type on every call, which
// triggers the "too many re-renders" infinite loop.

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogComponent({ open, options, onConfirm, onCancel }: ConfirmDialogProps) {
  const title = options.title ?? (options.destructive ? "Are you sure?" : "Confirm");
  const confirmLabel = options.confirmLabel ?? (options.destructive ? "Delete" : "Confirm");
  const cancelLabel = options.cancelLabel ?? "Cancel";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{options.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={options.destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useConfirm — async, promise-based replacement for window.confirm().
 *
 * @example
 *   const { confirm, ConfirmDialog } = useConfirm();
 *   // Place <ConfirmDialog /> once in the component's JSX.
 *   const ok = await confirm({ description: "Delete this item?", destructive: true });
 *   if (!ok) return;
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ description: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string): Promise<boolean> => {
    const normalized: ConfirmOptions =
      typeof opts === "string" ? { description: opts } : opts;
    setOptions(normalized);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
  }, []);

  function ConfirmDialog() {
    return (
      <ConfirmDialogComponent
        open={open}
        options={options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return { confirm, ConfirmDialog };
}
