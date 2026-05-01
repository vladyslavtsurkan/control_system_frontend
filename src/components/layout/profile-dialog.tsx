"use client";

import { useState, type SyntheticEvent } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { User } from "@/features/auth/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current user — read-only fields (email, id) are shown but not editable. */
  user: User | null;
  /** Whether the save request is in-flight. */
  saving: boolean;
  onSave: (data: { first_name: string; last_name: string }) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Profile edit dialog.
 *
 * Form state lives here so typing doesn't re-render the sidebar.
 * The parent remounts this component via `key` each time the dialog opens,
 * which lazily resets the form to the latest user data without a `useEffect`.
 */
export function ProfileDialog({
  open,
  onOpenChange,
  user,
  saving,
  onSave,
}: ProfileDialogProps) {
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
  });

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave(form);
  }

  function handleCopyId() {
    navigator.clipboard.writeText(user?.id ?? "");
    toast.success(tProfile("userIdCopied"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tProfile("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only email */}
          <div className="space-y-2">
            <Label htmlFor="profile-email">{tProfile("email")}</Label>
            <Input
              id="profile-email"
              value={user?.email ?? ""}
              disabled
              className="opacity-60"
            />
          </div>

          {/* Read-only user ID with copy button */}
          <div className="space-y-2">
            <Label htmlFor="profile-uuid">{tProfile("userId")}</Label>
            <p className="text-xs text-muted-foreground">
              {tProfile("userIdHelp")}
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="profile-uuid"
                value={user?.id ?? ""}
                disabled
                className="font-mono text-xs opacity-80"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleCopyId}
                aria-label={tProfile("copyUserId")}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Editable name fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="profile-first">{tProfile("firstName")}</Label>
              <Input
                id="profile-first"
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
                placeholder={tProfile("firstNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last">{tProfile("lastName")}</Label>
              <Input
                id="profile-last"
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
                placeholder={tProfile("lastNamePlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {tCommon("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

