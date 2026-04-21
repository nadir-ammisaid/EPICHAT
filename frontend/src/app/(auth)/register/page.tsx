'use client'

import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";
import RedirectIfAuthed from "@/components/dashboard/RedirectIfAuthed";
import { useTranslation } from "react-i18next";

export default function RegisterPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <RedirectIfAuthed />
      <div className="relative h-screen w-full md:grid md:grid-cols-2">
        <div className="absolute inset-0 flex items-center justify-center md:relative md:order-1 md:flex md:items-center md:justify-center">
          <div className="bg-background w-full max-w-[95%] rounded-lg px-4 py-14 md:px-0">
            <RegisterForm />
          </div>
        </div>
        <Image
          src="/login.png"
          alt={t("pages.register.illustrationAlt")}
          width={1920}
          height={1080}
          className="h-full w-full object-cover md:order-2"
          priority={true}
        />
      </div>
    </>
  );
}
