"use client";

import LoginForm from "@/components/LoginForm";
import Image from "next/image";
import RedirectIfAuthed from "@/components/dashboard/RedirectIfAuthed";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation("common");

  return (
    <main>
      <RedirectIfAuthed />
      <div className="bg-background relative h-screen w-full md:grid md:grid-cols-2">
        <div className="absolute inset-0 flex items-center justify-center md:relative md:order-1 md:flex md:items-center md:justify-center">
          <div className="bg-background w-full max-w-[95%] rounded-lg px-4 py-14 md:px-0">
            <LoginForm />
          </div>
        </div>

        <div className="relative h-full w-full md:order-2">
          <div className="from-background absolute inset-y-0 left-0 z-10 hidden w-32 bg-linear-to-r to-transparent md:block" />
          <Image
            src="/login.png"
            alt={t("pages.login.illustrationAlt")}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={true}
          />
        </div>
      </div>
    </main>
  );
}
