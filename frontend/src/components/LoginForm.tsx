"use client";

import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useLoginForm } from "@/lib/hooks/useLoginForm";
import { useTranslation } from "react-i18next";
import { Label } from "./ui";

export default function LoginForm() {
  const { error, isLoading, handleSubmit } = useLoginForm();
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <h1 className="text-4xl font-bold">{t("pages.login.title")}</h1>
      <h2 className="h5">{t("pages.login.subtitle")}</h2>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col items-center justify-center gap-4"
      >
        <Label htmlFor="email" aria-label="email" />
        <Input
          type="email"
          id="email"
          name="email"
          placeholder={t("pages.login.emailPlaceholder")}
          size="md"
          fullWidth
          required
        />
        <Label htmlFor="password" aria-label="password" />
        <Input
          type="password"
          id="password"
          name="password"
          placeholder={t("pages.login.passwordPlaceholder")}
          size="md"
          fullWidth
          required
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="max-w-78"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? t("pages.login.loading") : t("pages.login.cta")}
        </Button>
      </form>

      <p>
        {t("pages.login.noAccount")}{" "}
        <Link
          href="/register"
          className="text-brand underline-offset-2 hover:underline"
        >
          {t("pages.login.goToRegister")}
        </Link>
      </p>
    </div>
  );
}
