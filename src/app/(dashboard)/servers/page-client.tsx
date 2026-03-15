"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, RefreshCw, KeyRound } from "lucide-react";
import { useGetServersQuery, useDeleteServerMutation } from "@/store/api-slice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ListPageSizeSelect,
  ListPaginationFooter,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServerFormDialog } from "@/features/servers/components/server-form-dialog";
import { ApiKeyDialog } from "@/features/servers/components/api-key-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import { formatDate24 } from "@/lib/date-time";
import type { OpcServer } from "@/types/models";

interface ServersPageClientProps {
  initialPage: number;
  initialPerPage: number;
}

export default function ServersPageClient({
  initialPage,
  initialPerPage,
}: ServersPageClientProps) {
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });
  const { data, isLoading, refetch } = useGetServersQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const [deleteServer] = useDeleteServerMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OpcServer | null>(null);
  const [apiKeyServer, setApiKeyServer] = useState<OpcServer | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const servers = data?.items ?? [];
  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } = getOffsetLimitPaginationMeta({
    count: data?.count,
    perPage: data?.per_page,
    totalPages: data?.total_pages,
    page: data?.page,
    offset: pagination.offset,
    requestedLimit: pagination.limit,
    fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
  });

  function openCreate() { setEditTarget(null); setDialogOpen(true); }
  function openEdit(server: OpcServer) { setEditTarget(server); setDialogOpen(true); }

  async function handleDelete(id: string, name: string) {
    if (!await confirm({
      description: `Delete server "${name}"?`,
      destructive: true,
    })) return;
    try {
      await deleteServer(id).unwrap();
      toast.success("Server deleted.");
    } catch { toast.error("Delete failed."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh"><RefreshCw className="size-4" /></Button>
        <Button onClick={openCreate}><PlusCircle className="mr-2 size-4" />Add Server</Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <ListResultsSummary shownCount={servers.length} totalCount={totalCount} noun="servers" />
        <ListPageSizeSelect
          id="servers-page-size"
          value={pagination.perPage}
          options={LIST_PAGE_SIZE_OPTIONS}
          onChange={pagination.setLimitAndReset}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Security Policy</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No servers found. Click &quot;Add Server&quot; to get started.</TableCell></TableRow>
              ) : servers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div>{s.name}</div>
                    {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.url}</TableCell>
                  <TableCell><Badge variant="outline">{s.authentication_method}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.security_policy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate24(s.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setApiKeyServer(s)} aria-label="Manage API key"><KeyRound className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(s.id, s.name)}><Trash2 className="size-4" /></Button>
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

      <ServerFormDialog key={editTarget?.id ?? "new"} open={dialogOpen} onOpenChange={setDialogOpen} editTarget={editTarget} />
      {apiKeyServer && <ApiKeyDialog server={apiKeyServer} open={!!apiKeyServer} onOpenChange={(open) => { if (!open) setApiKeyServer(null); }} />}
      <ConfirmDialog />
    </div>
  );
}

