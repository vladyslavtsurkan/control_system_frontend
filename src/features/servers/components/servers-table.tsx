"use client";

import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate24 } from "@/lib/date-time";
import type { OpcServer } from "@/features/servers/types";

interface ServersTableProps {
  servers: OpcServer[];
  isLoading: boolean;
  onEdit: (server: OpcServer) => void;
  onManageApiKey: (server: OpcServer) => void;
  onDelete: (server: OpcServer) => void;
  canManage: boolean;
}

export function ServersTable({
  servers,
  isLoading,
  onEdit,
  onManageApiKey,
  onDelete,
  canManage,
}: ServersTableProps) {
  const t = useTranslations("servers");

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("url")}</TableHead>
            <TableHead>{t("auth")}</TableHead>
            <TableHead>{t("securityPolicy")}</TableHead>
            <TableHead>{t("created")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {canManage ? t("noServersCanManage") : t("noServers")}
              </TableCell>
            </TableRow>
          ) : (
            servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell className="font-medium">
                  <div>{server.name}</div>
                  {server.description && (
                    <div className="text-xs text-muted-foreground">
                      {server.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {server.url}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {server.authentication_method}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {server.security_policy}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate24(server.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageApiKey(server)}
                      aria-label={t("manageApiKey")}
                    >
                      <KeyRound className="size-4" />
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(server)}
                      aria-label={t("editServerAria")}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => onDelete(server)}
                      aria-label={t("deleteServerAria")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
