"use client";

import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("servers");
  const tCommon = useTranslations("common");
  const AUTH_METHODS: { value: AuthMethod; label: string }[] = [
    { value: "anonymous", label: t("authMethod.anonymous") },
    { value: "username", label: t("authMethod.username") },
  ];
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

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
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
        toast.success(t("serverUpdated"));
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
        toast.success(t("serverCreated"));
      }
      onOpenChange(false);
    } catch {
      toast.error(tCommon("operationFailed"));
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
            {editTarget ? t("editServerTitle") : t("addServerTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">{t("name")}</Label>
            <Input
              id="server-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Production Line A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-desc">{t("description")}</Label>
            <Input
              id="server-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder={tCommon("optional")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endpoint-url">{t("endpointUrl")}</Label>
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
              <Label>{t("securityPolicy")}</Label>
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
                  <SelectValue placeholder={t("securityPolicy")}>
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
              <Label>{t("authentication")}</Label>
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
                  <SelectValue placeholder={t("authentication")}>
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
                <Label htmlFor="opc-username">{t("username")}</Label>
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
                  {editTarget ? t("passwordKeep") : t("password")}
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
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" disabled={creating || updating}>
              {editTarget ? tCommon("saveChanges") : t("createServer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
