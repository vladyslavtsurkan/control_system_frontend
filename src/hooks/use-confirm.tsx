"use client";

import { useState, useCallback, useRef } from "react";
import {
  ConfirmDialog as ConfirmDialogView,
  type ConfirmOptions,
} from "@/components/ui/confirm-dialog";

export type { ConfirmOptions } from "@/components/ui/confirm-dialog";

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
      <ConfirmDialogView
        open={open}
        options={options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return { confirm, ConfirmDialog };
}
