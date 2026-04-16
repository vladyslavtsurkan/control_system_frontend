"use client";

import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
import {
  getApiErrorMessage,
  mapZodIssuesToFieldErrors,
} from "@/features/auth/components/auth-form-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ResetStep = "request" | "reset";

export default function ForgotPasswordPageClient() {
  const router = useRouter();
  const t = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleRequestCode(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(getApiErrorMessage(data, t("couldNotSendResetCode")));
        return;
      }

      toast.success(t("resetCodeSent"));
      setStep("reset");
    } catch {
      toast.error(tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = resetPasswordSchema.safeParse({ email, code, password });
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(getApiErrorMessage(data, t("couldNotResetPassword")));
        return;
      }

      toast.success(t("passwordUpdated"));
      router.push("/login");
    } catch {
      toast.error(tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>
          {step === "request" ? t("subtitleRequest") : t("subtitleReset")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("sendingCode") : t("sendResetCode")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("backTo")}{" "}
              <Link href="/login" className="hover:text-foreground">
                {t("signIn")}
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("email")}</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-code">{t("resetCode")}</Label>
              <Input
                id="reset-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("resetCodePlaceholder")}
              />
              {fieldErrors.code && (
                <p className="text-xs text-red-500">{fieldErrors.code}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="........"
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("updatingPassword") : t("resetPassword")}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFieldErrors({});
                  setStep("request");
                }}
              >
                {t("sendNewCode")}
              </button>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground"
              >
                {t("backToSignIn")}
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
