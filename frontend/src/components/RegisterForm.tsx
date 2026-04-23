"use client";

import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useRegisterForm } from "@/lib/hooks/useRegisterForm";
import { useTranslation } from "react-i18next";
import { Label } from "./ui";

export default function RegisterForm() {
  const { error, isLoading, handleSubmit } = useRegisterForm();
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <h1 className="text-4xl font-bold">{t("pages.register.title")}</h1>
      <h2 className="h5">{t("pages.register.subtitle")}</h2>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col items-center justify-center gap-4"
      >
        <Label htmlFor="email" aria-label="email" />
        <Input
          type="email"
          id="email"
          name="email"
          placeholder={t("pages.register.emailPlaceholder")}
          size="md"
          fullWidth
          required
        />
        <Label htmlFor="username" aria-label="username" />
        <Input
          type="text"
          id="username"
          name="username"
          placeholder={t("pages.register.usernamePlaceholder")}
          size="md"
          fullWidth
          required
          minLength={3}
          maxLength={32}
        />
        <Label htmlFor="password" aria-label="password" />
        <Input
          type="password"
          id="password"
          name="password"
          placeholder={t("pages.register.passwordPlaceholder")}
          size="md"
          fullWidth
          required
          minLength={8}
        />
        <Label htmlFor="confirmPassword" aria-label="confirmPassword" />
        <Input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder={t("pages.register.confirmPasswordPlaceholder")}
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
          {isLoading ? t("pages.register.loading") : t("pages.register.cta")}
        </Button>
      </form>

      <p>
        {t("pages.register.hasAccount")}{" "}
        <Link
          href="/login"
          className="text-brand underline-offset-2 hover:underline"
        >
          {t("pages.register.goToLogin")}
        </Link>
      </p>
    </div>
  );
}
