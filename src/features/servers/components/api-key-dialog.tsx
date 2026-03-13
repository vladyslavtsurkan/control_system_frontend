"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Copy, RotateCcw, KeyRound, Eye, EyeOff } from "lucide-react";
import {
  useGetApiKeysQuery,
  useCreateOrRotateApiKeyMutation,
  useRevokeApiKeyMutation,
} from "@/store/api-slice";
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
import type { OpcServer, ApiKeyCreateResponse } from "@/types/models";

interface ApiKeyDialogProps {
  server: OpcServer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ server, open, onOpenChange }: ApiKeyDialogProps) {
  const { data: allKeys, isLoading: keysLoading } = useGetApiKeysQuery();
  const [createOrRotate, { isLoading: rotating }] = useCreateOrRotateApiKeyMutation();
  const [revokeApiKey, { isLoading: revoking }] = useRevokeApiKeyMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  const [revealedSecret, setRevealedSecret] = useState<ApiKeyCreateResponse | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);

  const keyInfo = allKeys?.find((k) => k.opc_server_id === server.id) ?? null;

  async function handleCreateOrRotate() {
    const isRotating = !!keyInfo;
    if (isRotating && !await confirm({
      title: "Rotate API key?",
      description: `Rotate the API key for "${server.name}"? The current key will stop working immediately.`,
      confirmLabel: "Rotate",
      destructive: true,
    })) return;
    try {
      const result = await createOrRotate(server.id).unwrap();
      setRevealedSecret(result);
      setSecretVisible(false);
      toast.success(isRotating ? "API key rotated." : "API key created.");
    } catch {
      toast.error("Operation failed. Please try again.");
    }
  }

  async function handleRevoke() {
    if (!await confirm({
      title: "Revoke API key?",
      description: `Revoke the API key for "${server.name}"? This cannot be undone.`,
      confirmLabel: "Revoke",
      destructive: true,
    })) return;
    try {
      await revokeApiKey(server.id).unwrap();
      setRevealedSecret(null);
      toast.success("API key revoked.");
    } catch {
      toast.error("Revoke failed.");
    }
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(() => toast.success("Copied to clipboard."));
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
          <DialogTitle>API Key — {server.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {keysLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : keyInfo ? (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current Key
                </span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">Prefix</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {keyInfo.key_prefix}…
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">Created</span>
                  <span className="text-xs">{new Date(keyInfo.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">Last used</span>
                  <span className="text-xs">
                    {keyInfo.last_used_at
                      ? new Date(keyInfo.last_used_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No API key exists for this server yet.
            </div>
          )}

          {revealedSecret && (
            <div className="rounded-lg border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-2">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                ⚠ Copy this secret key now — it will not be shown again.
              </p>
              <div className="flex items-start gap-2">
                <code className="flex-1 rounded bg-background border px-2 py-1.5 text-xs font-mono break-all">
                  {secretVisible ? revealedSecret.secret_key : "•".repeat(40)}
                </code>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setSecretVisible((v) => !v)}
                    aria-label={secretVisible ? "Hide key" : "Show key"}
                  >
                    {secretVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => copyToClipboard(revealedSecret.secret_key)}
                    aria-label="Copy key"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Prefix: <code className="font-mono">{revealedSecret.key_prefix}</code>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {keyInfo && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:border-red-300 sm:mr-auto"
              onClick={handleRevoke}
              disabled={revoking}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Revoke
            </Button>
          )}
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
          <Button onClick={handleCreateOrRotate} disabled={rotating || revoking}>
            {keyInfo ? (
              <><RotateCcw className="mr-1.5 size-3.5" />Rotate Key</>
            ) : (
              <><KeyRound className="mr-1.5 size-3.5" />Create Key</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog />
    </>
  );
}
