"use client";

import { KeyRound, Pencil, Trash2 } from "lucide-react";
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
import type { OpcServer } from "@/types/models";

interface ServersTableProps {
  servers: OpcServer[];
  isLoading: boolean;
  onEdit: (server: OpcServer) => void;
  onManageApiKey: (server: OpcServer) => void;
  onDelete: (server: OpcServer) => void;
}

export function ServersTable({
  servers,
  isLoading,
  onEdit,
  onManageApiKey,
  onDelete,
}: ServersTableProps) {
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
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No servers found. Click &quot;Add Server&quot; to get started.
              </TableCell>
            </TableRow>
          ) : (
            servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell className="font-medium">
                  <div>{server.name}</div>
                  {server.description && (
                    <div className="text-xs text-muted-foreground">{server.description}</div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{server.url}</TableCell>
                <TableCell>
                  <Badge variant="outline">{server.authentication_method}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{server.security_policy}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate24(server.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onManageApiKey(server)}
                    aria-label="Manage API key"
                  >
                    <KeyRound className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(server)}
                    aria-label="Edit server"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(server)}
                    aria-label="Delete server"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


