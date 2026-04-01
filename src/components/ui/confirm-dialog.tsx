"use client";

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

export interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const title =
    options.title ?? (options.destructive ? "Are you sure?" : "Confirm");
  const confirmLabel =
    options.confirmLabel ?? (options.destructive ? "Delete" : "Confirm");
  const cancelLabel = options.cancelLabel ?? "Cancel";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
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
