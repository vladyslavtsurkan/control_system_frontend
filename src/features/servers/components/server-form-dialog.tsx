"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateServerMutation, useUpdateServerMutation } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type {
  OpcServer,
  AuthMethod,
  SecurityPolicy,
  CreateOpcServerRequest,
} from "@/features/servers/types";

const AUTH_METHODS: { value: AuthMethod; label: string }[] = [
  { value: "anonymous", label: "Anonymous" },
  { value: "username", label: "Username / Password" },
];

const SECURITY_POLICIES: { value: SecurityPolicy; label: string }[] = [
  { value: "None", label: "None (no encryption)" },
  { value: "Basic256Sha256", label: "Basic256Sha256 (recommended)" },
  { value: "Aes256_Sha256_RsaPss", label: "Aes256_Sha256_RsaPss" },
  { value: "Aes128_Sha256_RsaOaep", label: "Aes128_Sha256_RsaOaep" },
  { value: "Basic256", label: "Basic256 (legacy)" },
  { value: "Basic128Rsa15", label: "Basic128Rsa15 (legacy)" },
];

interface ServerFormState {
  name: string;
  description: string;
  url: string;
  security_policy: SecurityPolicy;
  authentication_method: AuthMethod;
  username: string;
  password: string;
}

const emptyForm: ServerFormState = {
  name: "",
  description: "",
  url: "",
  security_policy: "None",
  authentication_method: "anonymous",
  username: "",
  password: "",
};

interface ServerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: OpcServer | null;
}

export function ServerFormDialog({
  open,
  onOpenChange,
  editTarget,
}: ServerFormDialogProps) {
  const [createServer, { isLoading: creating }] = useCreateServerMutation();
  const [updateServer, { isLoading: updating }] = useUpdateServerMutation();
  const [form, setForm] = useState<ServerFormState>(() =>
    editTarget
      ? {
          name: editTarget.name,
          description: editTarget.description ?? "",
          url: editTarget.url,
          security_policy: editTarget.security_policy,
          authentication_method: editTarget.authentication_method,
          username: editTarget.username ?? "",
          password: "",
        }
      : emptyForm,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editTarget) {
        await updateServer({
          id: editTarget.id,
          name: form.name || undefined,
          description: form.description || null,
          url: form.url || undefined,
          security_policy: form.security_policy,
          authentication_method: form.authentication_method,
          username: form.username || null,
          password: form.password || null,
        }).unwrap();
        toast.success("Server updated.");
      } else {
        const payload: CreateOpcServerRequest = {
          name: form.name,
          description: form.description || null,
          url: form.url,
          security_policy: form.security_policy,
          authentication_method: form.authentication_method,
          username: form.username || null,
          password: form.password || null,
        };
        await createServer(payload).unwrap();
        toast.success("Server created.");
      }
      onOpenChange(false);
    } catch {
      toast.error("Operation failed. Please try again.");
    }
  }

  const showCredentials = form.authentication_method === "username";
  const selectedSecurityPolicyLabel =
    SECURITY_POLICIES.find((p) => p.value === form.security_policy)?.label ??
    "";
  const selectedAuthMethodLabel =
    AUTH_METHODS.find((m) => m.value === form.authentication_method)?.label ??
    "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTarget ? "Edit OPC UA Server" : "Add OPC UA Server"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Name</Label>
            <Input
              id="server-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Production Line A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-desc">Description</Label>
            <Input
              id="server-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endpoint-url">Endpoint URL</Label>
            <Input
              id="endpoint-url"
              required
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="opc.tcp://192.168.1.100:4840"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Security Policy</Label>
              <Select
                value={form.security_policy}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    security_policy: v as SecurityPolicy,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select security policy...">
                    {selectedSecurityPolicyLabel || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_POLICIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Authentication</Label>
              <Select
                value={form.authentication_method}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    authentication_method: v as AuthMethod,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication...">
                    {selectedAuthMethodLabel || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AUTH_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {showCredentials && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="opc-username">Username</Label>
                <Input
                  id="opc-username"
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="opcuser"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opc-password">
                  Password{editTarget ? " (leave blank to keep)" : ""}
                </Label>
                <Input
                  id="opc-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={creating || updating}>
              {editTarget ? "Save Changes" : "Create Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
