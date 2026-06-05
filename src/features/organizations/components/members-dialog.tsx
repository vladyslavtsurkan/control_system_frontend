"use client";

import { memo, useState, useTransition, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  useGetOrganizationMembersQuery,
} from "@/store/api";
import {
  addOrganizationMember,
  removeOrganizationMember,
  changeOrganizationMemberRole,
} from "@/features/organizations/actions/org-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserMinus, UserPlus } from "lucide-react";
import type {
  OrganizationWithRole,
  UserRoleInOrg,
} from "@/features/organizations/types";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};
const ROLES: UserRoleInOrg[] = ["owner", "admin", "member"];

function isUserRoleInOrg(value: unknown): value is UserRoleInOrg {
  return typeof value === "string" && ROLES.includes(value as UserRoleInOrg);
}

// ─── Member list (memoized so the "add member" input state doesn't re-render it) ─

interface MemberListProps {
  members: any[];
  isLoading: boolean;
  orgRole: UserRoleInOrg;
  onRemove: (userId: string, email: string) => void;
  onRoleChange: (userId: string, role: UserRoleInOrg, email: string) => void;
}

const MemberList = memo(function MemberList({
  members,
  isLoading,
  orgRole,
  onRemove,
  onRoleChange,
}: MemberListProps) {
  const t = useTranslations("organizations");
  const isOwner = orgRole === "owner";
  const isAdminOrOwner = orgRole === "owner" || orgRole === "admin";

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (members.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("noMembers")}
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("nameEmail")}</TableHead>
          <TableHead>{t("role")}</TableHead>
          {isAdminOrOwner && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <div className="font-medium text-sm">
                {[m.first_name, m.last_name].filter(Boolean).join(" ") ||
                  m.email}
              </div>
              {(m.first_name || m.last_name) && (
                <div className="text-xs text-muted-foreground">{m.email}</div>
              )}
            </TableCell>
            <TableCell>
              {isOwner && m.role !== "owner" ? (
                <Select
                  value={m.role}
                  onValueChange={(v) => {
                    if (isUserRoleInOrg(v)) {
                      void onRoleChange(m.id, v, m.email);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue>{t(`roles.${m.role}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`roles.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={ROLE_VARIANT[m.role]}>
                  {t(`roles.${m.role}`)}
                </Badge>
              )}
            </TableCell>
            {isAdminOrOwner && (
              <TableCell className="text-right">
                {m.role !== "owner" && (isOwner || m.role === "member") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onRemove(m.id, m.email)}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface MembersDialogProps {
  org: OrganizationWithRole;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MembersDialog({ org, open, onOpenChange }: MembersDialogProps) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const { data, isLoading, refetch } = useGetOrganizationMembersQuery(org.id, {
    skip: !open,
  });
  const members = data?.items ?? [];

  const [isPending, startTransition] = useTransition();
  const [addUserId, setAddUserId] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();

  const isAdminOrOwner = org.role === "owner" || org.role === "admin";

  async function handleAdd(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = addUserId.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const res = await addOrganizationMember(org.id, trimmed);
        if (res.success) {
          setAddUserId("");
          toast.success(t("memberAdded"));
          refetch();
        } else {
          toast.error(res.error || t("memberAddFailed"));
        }
      } catch {
        toast.error(t("memberAddFailed"));
      }
    });
  }

  async function handleRemove(userId: string, email: string) {
    if (
      !(await confirm({
        description: t("removeConfirm", { email, org: org.name }),
        confirmLabel: t("remove"),
        destructive: true,
      }))
    )
      return;
    startTransition(async () => {
      try {
        const res = await removeOrganizationMember(org.id, userId);
        if (res.success) {
          toast.success(t("memberRemoved", { email }));
          refetch();
        } else {
          toast.error(res.error || t("memberRemoveFailed"));
        }
      } catch {
        toast.error(t("memberRemoveFailed"));
      }
    });
  }

  async function handleRoleChange(
    userId: string,
    role: UserRoleInOrg,
    memberEmail: string,
  ) {
    if (role === "owner") {
      const confirmed = await confirm({
        title: t("transferOwnership"),
        description: t("transferOwnershipDescription", {
          name: org.name,
          email: memberEmail,
        }),
        confirmLabel: t("transfer"),
        destructive: true,
      });
      if (!confirmed) return;
    }
    startTransition(async () => {
      try {
        const res = await changeOrganizationMemberRole(org.id, userId, role);
        if (res.success) {
          toast.success(t("roleUpdated"));
          refetch();
        } else {
          toast.error(res.error || t("roleUpdateFailed"));
        }
      } catch {
        toast.error(t("roleUpdateFailed"));
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("membersTitle", { name: org.name })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {isAdminOrOwner && (
              <form onSubmit={handleAdd} className="flex gap-2">
                <Input
                  className="flex-1 font-mono text-xs"
                  placeholder={t("addMemberPlaceholder")}
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !addUserId.trim()}
                >
                  <UserPlus className="mr-1.5 size-3.5" />
                  {t("add")}
                </Button>
              </form>
            )}
            <MemberList
              members={members}
              isLoading={isLoading}
              orgRole={org.role}
              onRemove={handleRemove}
              onRoleChange={handleRoleChange}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("close")}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </>
  );
}
