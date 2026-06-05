"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createOrganization, updateOrganization } from "@/features/organizations/actions/org-actions";
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

export function OrganizationFormDialog({
  open,
  onOpenChange,
  editTarget,
  activeOrgId,
}: OrganizationFormDialogProps) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrgFormState>({
    defaultValues: editTarget
      ? { name: editTarget.name, description: editTarget.description ?? "" }
      : { name: "", description: "" },
  });

  const onSubmit = async (data: OrgFormState) => {
    startTransition(async () => {
      try {
        if (editTarget) {
          const res = await updateOrganization(editTarget.id, {
            name: data.name || null,
            description: data.description || null,
          });
          if (res.success) {
            if (editTarget.id === activeOrgId) {
              dispatch(setActiveOrg(res.data));
            }
            toast.success(t("orgUpdated"));
            onOpenChange(false);
          } else {
            if (res.fieldErrors) {
              Object.entries(res.fieldErrors).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                  setError(field as Path<OrgFormState>, { type: "server", message: messages[0] });
                }
              });
            } else {
              toast.error(res.error || tCommon("operationFailed"));
            }
          }
        } else {
          const payload: CreateOrganizationRequest = {
            name: data.name,
            description: data.description || null,
          };
          const res = await createOrganization(payload);
          if (res.success) {
            if (!activeOrgId) {
              dispatch(setActiveOrg(res.data));
            }
            toast.success(t("orgCreated"));
            onOpenChange(false);
          } else {
            if (res.fieldErrors) {
              Object.entries(res.fieldErrors).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                  setError(field as Path<OrgFormState>, { type: "server", message: messages[0] });
                }
              });
            } else {
              toast.error(res.error || tCommon("operationFailed"));
            }
          }
        }
      } catch {
        toast.error(tCommon("operationFailed"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editTarget ? t("editOrganization") : t("newOrganization")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">{t("name")}</Label>
            <Input
              id="org-name"
              {...register("name")}
              placeholder={t("namePlaceholder")}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc">{t("description")}</Label>
            <Input
              id="org-desc"
              {...register("description")}
              placeholder={t("descriptionPlaceholder")}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {editTarget ? tCommon("saveChanges") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
