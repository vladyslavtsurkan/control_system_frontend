"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAddOrganizationMemberMutation, useRemoveOrganizationMemberMutation, useChangeOrganizationMemberRoleMutation, useGetOrganizationMembersQuery } from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserMinus, UserPlus } from "lucide-react";
import type { OrganizationWithRole, UserRoleInOrg } from "@/features/organizations/types";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default", admin: "secondary", member: "outline",
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
  const { data, isLoading } = useGetOrganizationMembersQuery(org.id, { skip: !open });
  const [addMember, { isLoading: adding }] = useAddOrganizationMemberMutation();
  const [removeMember] = useRemoveOrganizationMemberMutation();
  const [changeRole] = useChangeOrganizationMemberRoleMutation();
  const [addUserId, setAddUserId] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();

  const members = data?.items ?? [];
  const isOwner = org.role === "owner";
  const isAdminOrOwner = org.role === "owner" || org.role === "admin";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addUserId.trim();
    if (!trimmed) return;
    try { await addMember({ orgId: org.id, userId: trimmed }).unwrap(); setAddUserId(""); toast.success("Member added."); }
    catch { toast.error("Failed to add member. Check that the user ID is correct."); }
  }

  async function handleRemove(userId: string, email: string) {
    if (!await confirm({
      description: `Remove "${email}" from ${org.name}?`,
      confirmLabel: "Remove",
      destructive: true,
    })) return;
    try { await removeMember({ orgId: org.id, userId }).unwrap(); toast.success(`Removed ${email}.`); }
    catch { toast.error("Failed to remove member."); }
  }

  async function handleRoleChange(userId: string, role: UserRoleInOrg) {
    try { await changeRole({ orgId: org.id, userId, role }).unwrap(); toast.success("Role updated."); }
    catch { toast.error("Failed to change role."); }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Members — {org.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {isAdminOrOwner && (
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input className="flex-1 font-mono text-xs" placeholder="Paste user UUID to add…" value={addUserId} onChange={(e) => setAddUserId(e.target.value)} />
              <Button type="submit" size="sm" disabled={adding || !addUserId.trim()}><UserPlus className="mr-1.5 size-3.5" />Add</Button>
            </form>
          )}
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
          ) : members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No members found.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name / Email</TableHead><TableHead>Role</TableHead>{isAdminOrOwner && <TableHead className="w-10" />}</TableRow></TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email}</div>
                      {(m.first_name || m.last_name) && <div className="text-xs text-muted-foreground">{m.email}</div>}
                    </TableCell>
                    <TableCell>
                      {isOwner && m.role !== "owner" ? (
                        <Select
                          value={m.role}
                          onValueChange={(v) => {
                            if (isUserRoleInOrg(v)) {
                              void handleRoleChange(m.id, v);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue>{m.role}</SelectValue></SelectTrigger>
                          <SelectContent>{ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                        </Select>
                      ) : (<Badge variant={ROLE_VARIANT[m.role]}>{m.role}</Badge>)}
                    </TableCell>
                    {isAdminOrOwner && (
                      <TableCell className="text-right">
                        {m.role !== "owner" && (isOwner || m.role === "member") && (
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleRemove(m.id, m.email)}><UserMinus className="size-4" /></Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog />
    </>
  );
}
