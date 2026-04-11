"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Copy, KeyRound, Eye, EyeOff } from "lucide-react";
import {
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
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
import { formatDateTime24 } from "@/lib/date-time";
import { MAX_API_KEYS_PER_OPC_SERVER } from "@/config/constants";
import type { OpcServer, ApiKeyCreateResponse } from "@/features/servers/types";

interface ApiKeyDialogProps {
  server: OpcServer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({
  server,
  open,
  onOpenChange,
}: ApiKeyDialogProps) {
  const { data: allKeys, isLoading: keysLoading } = useGetApiKeysQuery();
  const [createApiKey, { isLoading: creating }] = useCreateApiKeyMutation();
  const [revokeApiKey, { isLoading: revoking }] = useRevokeApiKeyMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  const [revealedSecret, setRevealedSecret] =
    useState<ApiKeyCreateResponse | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);

  const serverKeys =
    allKeys?.filter((k) => k.opc_server_id === server.id) ?? [];
  const atCap = serverKeys.length >= MAX_API_KEYS_PER_OPC_SERVER;

  async function handleCreate() {
    try {
      const result = await createApiKey(server.id).unwrap();
      setRevealedSecret(result);
      setSecretVisible(false);
      toast.success("API key created.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail ??
        "Failed to create API key. Please try again.";
      toast.error(msg);
    }
  }

  async function handleRevoke(keyId: string) {
    if (
      !(await confirm({
        title: "Revoke API key?",
        description: `Revoke key ${keyId} for "${server.name}"? This cannot be undone.`,
        confirmLabel: "Revoke",
        destructive: true,
      }))
    )
      return;
    try {
      await revokeApiKey({ serverId: server.id, keyId }).unwrap();
      toast.success("API key revoked.");
    } catch {
      toast.error("Revoke failed. Please try again.");
    }
  }

  function copyToClipboard(value: string, label: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied to clipboard.`));
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRevealedSecret(null);
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Keys — {server.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Key count / cap indicator */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active keys</span>
              <Badge variant={atCap ? "destructive" : "secondary"}>
                {keysLoading ? "…" : serverKeys.length} /{" "}
                {MAX_API_KEYS_PER_OPC_SERVER}
              </Badge>
            </div>

            {/* Keys list */}
            {keysLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : serverKeys.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No API keys exist for this server yet.
              </div>
            ) : (
              <div className="space-y-2">
                {serverKeys.map((key) => (
                  <div
                    key={key.id}
                    className="rounded-lg border bg-muted/40 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono truncate max-w-[18rem]">
                        {key.key_id}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-red-600 hover:text-red-700 size-7"
                        onClick={() => handleRevoke(key.key_id)}
                        disabled={revoking}
                        aria-label={`Revoke key ${key.key_id}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Created&nbsp;
                        <span className="text-foreground">
                          {formatDateTime24(key.created_at)}
                        </span>
                      </span>
                      <span>
                        Last used&nbsp;
                        <span className="text-foreground">
                          {key.last_used_at
                            ? formatDateTime24(key.last_used_at)
                            : "Never"}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revealed-secret banner */}
            {revealedSecret && (
              <div className="rounded-lg border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-3">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                  ⚠ Copy both values now — the Secret Key will not be shown
                  again.
                </p>

                {/* Key ID row */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Key ID
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background border px-2 py-1.5 text-xs font-mono break-all">
                      {revealedSecret.key_id}
                    </code>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        copyToClipboard(revealedSecret.key_id, "Key ID")
                      }
                      aria-label="Copy Key ID"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Secret Key row */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Secret Key
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background border px-2 py-1.5 text-xs font-mono break-all">
                      {secretVisible
                        ? revealedSecret.secret_key
                        : "•".repeat(40)}
                    </code>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setSecretVisible((v) => !v)}
                        aria-label={secretVisible ? "Hide key" : "Show key"}
                      >
                        {secretVisible ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          copyToClipboard(
                            revealedSecret.secret_key,
                            "Secret Key",
                          )
                        }
                        aria-label="Copy Secret Key"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={creating || revoking || atCap}
              title={
                atCap
                  ? `Maximum of ${MAX_API_KEYS_PER_OPC_SERVER} keys reached`
                  : undefined
              }
            >
              <KeyRound className="mr-1.5 size-3.5" />
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </>
  );
}
