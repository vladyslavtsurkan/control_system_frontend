"use client";

import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signUpSchema, signUpVerifySchema } from "@/features/auth/schemas";
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

type SignUpStep = "signup" | "verify";

export default function SignUpPageClient() {
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState<SignUpStep>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSignUpSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = signUpSchema.safeParse({
      email,
      password,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    });

    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(getApiErrorMessage(data, t("couldNotCreateAccount")));
        return;
      }

      toast.success(t("verificationCodeSent"));
      setStep("verify");
    } catch {
      toast.error(tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = signUpVerifySchema.safeParse({ email, code });
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(getApiErrorMessage(data, tCommon("operationFailed")));
        return;
      }

      toast.success(t("accountVerified"));
      router.push("/");
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
          {step === "signup" ? t("subtitleSignup") : t("subtitleVerify")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "signup" ? (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first-name">{t("firstName")}</Label>
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={tCommon("optional")}
                />
                {fieldErrors.first_name && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">{t("lastName")}</Label>
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={tCommon("optional")}
                />
                {fieldErrors.last_name && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.last_name}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
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
              {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="hover:text-foreground">
                {t("signIn")}
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-email">{t("email")}</Label>
              <Input
                id="verify-email"
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
              <Label htmlFor="code">{t("verificationCode")}</Label>
              <Input
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("verificationCodePlaceholder")}
              />
              {fieldErrors.code && (
                <p className="text-xs text-red-500">{fieldErrors.code}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("verifying") : t("verifyAndSignIn")}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFieldErrors({});
                  setStep("signup");
                }}
              >
                {t("editDetails")}
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
