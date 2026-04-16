"use client";

import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  useAddOrganizationMemberMutation,
  useRemoveOrganizationMemberMutation,
  useChangeOrganizationMemberRoleMutation,
  useGetOrganizationMembersQuery,
} from "@/store/api";
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

interface MembersDialogProps {
  org: OrganizationWithRole;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MembersDialog({ org, open, onOpenChange }: MembersDialogProps) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const { data, isLoading } = useGetOrganizationMembersQuery(org.id, {
    skip: !open,
  });
  const [addMember, { isLoading: adding }] = useAddOrganizationMemberMutation();
  const [removeMember] = useRemoveOrganizationMemberMutation();
  const [changeRole] = useChangeOrganizationMemberRoleMutation();
  const [addUserId, setAddUserId] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();

  const members = data?.items ?? [];
  const isOwner = org.role === "owner";
  const isAdminOrOwner = org.role === "owner" || org.role === "admin";

  async function handleAdd(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = addUserId.trim();
    if (!trimmed) return;
    try {
      await addMember({ orgId: org.id, userId: trimmed }).unwrap();
      setAddUserId("");
      toast.success(t("memberAdded"));
    } catch {
      toast.error(t("memberAddFailed"));
    }
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
    try {
      await removeMember({ orgId: org.id, userId }).unwrap();
      toast.success(t("memberRemoved", { email }));
    } catch {
      toast.error(t("memberRemoveFailed"));
    }
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
    try {
      await changeRole({ orgId: org.id, userId, role }).unwrap();
      toast.success(t("roleUpdated"));
    } catch {
      toast.error(t("roleUpdateFailed"));
    }
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
                  disabled={adding || !addUserId.trim()}
                >
                  <UserPlus className="mr-1.5 size-3.5" />
                  {t("add")}
                </Button>
              </form>
            )}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noMembers")}
              </p>
            ) : (
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
                          {[m.first_name, m.last_name]
                            .filter(Boolean)
                            .join(" ") || m.email}
                        </div>
                        {(m.first_name || m.last_name) && (
                          <div className="text-xs text-muted-foreground">
                            {m.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isOwner && m.role !== "owner" ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) => {
                              if (isUserRoleInOrg(v)) {
                                void handleRoleChange(m.id, v, m.email);
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
                          {m.role !== "owner" &&
                            (isOwner || m.role === "member") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRemove(m.id, m.email)}
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
            )}
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
