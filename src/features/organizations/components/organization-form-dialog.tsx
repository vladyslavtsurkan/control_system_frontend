"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
} from "@/store/api";
import { setActiveOrg } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CreateOrganizationRequest,
  OrganizationWithRole,
} from "@/features/organizations/types";

interface OrganizationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: OrganizationWithRole | null;
  activeOrgId?: string | null;
}

interface OrgFormState {
  name: string;
  description: string;
}

const emptyForm: OrgFormState = { name: "", description: "" };

export function OrganizationFormDialog({
  open,
  onOpenChange,
  editTarget,
  activeOrgId,
}: OrganizationFormDialogProps) {
  const dispatch = useAppDispatch();
  const [createOrg, { isLoading: creating }] = useCreateOrganizationMutation();
  const [updateOrg, { isLoading: updating }] = useUpdateOrganizationMutation();
  const [form, setForm] = useState<OrgFormState>(() =>
    editTarget
      ? { name: editTarget.name, description: editTarget.description ?? "" }
      : emptyForm,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editTarget) {
        const updated = await updateOrg({
          id: editTarget.id,
          name: form.name || null,
          description: form.description || null,
        }).unwrap();
        if (editTarget.id === activeOrgId) {
          dispatch(setActiveOrg(updated));
        }
        toast.success("Organization updated.");
      } else {
        const payload: CreateOrganizationRequest = {
          name: form.name,
          description: form.description || null,
        };
        const created = await createOrg(payload).unwrap();
        if (!activeOrgId) {
          dispatch(setActiveOrg(created));
        }
        toast.success("Organization created.");
      }
      onOpenChange(false);
    } catch {
      toast.error("Operation failed. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editTarget ? "Edit Organization" : "New Organization"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc">Description</Label>
            <Input
              id="org-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={creating || updating}>
              {editTarget ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
