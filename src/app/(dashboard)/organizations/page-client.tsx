"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, RefreshCw, LogOut as LeaveIcon, Users } from "lucide-react";
import {
  useGetOrganizationsQuery, useCreateOrganizationMutation,
  useUpdateOrganizationMutation, useDeleteOrganizationMutation,
  useLeaveOrganizationMutation,
} from "@/store/api-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveOrg } from "@/store/auth-slice";
import { selectActiveOrgId } from "@/store/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListPageSizeSelect,
  ListPaginationFooter,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MembersDialog } from "@/features/organizations/components/members-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import { formatDate24 } from "@/lib/date-time";
import type { OrganizationWithRole, CreateOrganizationRequest } from "@/types/models";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

interface OrgFormState { name: string; description: string; }
const emptyForm: OrgFormState = { name: "", description: "" };

interface OrganizationsPageClientProps {
  initialPage: number;
  initialPerPage: number;
}

export default function OrganizationsPageClient({
  initialPage,
  initialPerPage,
}: OrganizationsPageClientProps) {
  const dispatch = useAppDispatch();
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });

  const { data, isLoading, refetch } = useGetOrganizationsQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const [createOrg, { isLoading: creating }] = useCreateOrganizationMutation();
  const [updateOrg, { isLoading: updating }] = useUpdateOrganizationMutation();
  const [deleteOrg] = useDeleteOrganizationMutation();
  const [leaveOrg] = useLeaveOrganizationMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrganizationWithRole | null>(null);
  const [form, setForm] = useState<OrgFormState>(emptyForm);
  const [membersTarget, setMembersTarget] = useState<OrganizationWithRole | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const orgs = data?.items ?? [];
  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } = getOffsetLimitPaginationMeta({
    count: data?.count,
    perPage: data?.per_page,
    totalPages: data?.total_pages,
    page: data?.page,
    offset: pagination.offset,
    requestedLimit: pagination.limit,
    fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
  });

  function openCreate() { setEditTarget(null); setForm(emptyForm); setDialogOpen(true); }

  function openEdit(org: OrganizationWithRole) {
    setEditTarget(org);
    setForm({ name: org.name, description: org.description ?? "" });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editTarget) {
        const updated = await updateOrg({ id: editTarget.id, name: form.name || null, description: form.description || null }).unwrap();
        if (editTarget.id === activeOrgId) dispatch(setActiveOrg(updated));
        toast.success("Organization updated.");
      } else {
        const payload: CreateOrganizationRequest = { name: form.name, description: form.description || null };
        const created = await createOrg(payload).unwrap();
        if (!activeOrgId) dispatch(setActiveOrg(created));
        toast.success("Organization created.");
      }
      setDialogOpen(false);
    } catch { toast.error("Operation failed. Please try again."); }
  }

  async function handleDelete(org: OrganizationWithRole) {
    if (!await confirm({
      description: `Delete "${org.name}"? This cannot be undone.`,
      destructive: true,
    })) return;
    try { await deleteOrg(org.id).unwrap(); toast.success("Organization deleted."); }
    catch { toast.error("Delete failed."); }
  }

  async function handleLeave(org: OrganizationWithRole) {
    if (!await confirm({
      title: "Leave organization?",
      description: `Leave "${org.name}"?`,
      confirmLabel: "Leave",
    })) return;
    try { await leaveOrg(org.id).unwrap(); toast.success(`Left "${org.name}".`); }
    catch { toast.error("Failed to leave organization."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
          <RefreshCw className="size-4" />
        </Button>
        <Button onClick={openCreate}>
          <PlusCircle className="mr-2 size-4" />
          New Organization
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <ListResultsSummary shownCount={orgs.length} totalCount={totalCount} noun="organizations" />
        <ListPageSizeSelect
          id="organizations-page-size"
          value={pagination.perPage}
          options={LIST_PAGE_SIZE_OPTIONS}
          onChange={pagination.setLimitAndReset}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No organizations found. Click &quot;New Organization&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : orgs.map((org) => (
                <TableRow key={org.id} className={org.id === activeOrgId ? "bg-muted/30" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {org.name}
                      {org.id === activeOrgId && (
                        <Badge variant="outline" className="text-xs">active</Badge>
                      )}
                    </div>
                    {org.description && (
                      <div className="text-xs text-muted-foreground">{org.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[org.role]}>{org.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate24(org.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMembersTarget(org)}
                      aria-label="Manage members"
                    >
                      <Users className="size-4" />
                    </Button>
                    {(org.role === "owner" || org.role === "admin") && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(org)}>
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {org.role === "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(org)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    {org.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-orange-500 hover:text-orange-600"
                        onClick={() => handleLeave(org)}
                      >
                        <LeaveIcon className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Organization" : "New Organization"}</DialogTitle>
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
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={creating || updating}>
                {editTarget ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {membersTarget && (
        <MembersDialog
          org={membersTarget}
          open={!!membersTarget}
          onOpenChange={(v) => { if (!v) setMembersTarget(null); }}
        />
      )}
      <ConfirmDialog />
    </div>
  );
}

