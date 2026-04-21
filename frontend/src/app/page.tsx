"use client";

import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import HomeSection from "@/components/home/Section";
import Footer from "@/components/home/Footer";
import RedirectIfAuthed from "@/components/dashboard/RedirectIfAuthed";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t, i18n } = useTranslation("home");

  if (!i18n.isInitialized) {
    return null; 
  }

  return (
    <>
      <RedirectIfAuthed />
      <Header />
      <main>
        <Hero />
        <HomeSection
          id={t("sections.why.id")}
          title={t("sections.why.title")}
          description={t("sections.why.description")}
          imageSrc="/sections/why.png"
          imageAlt={t("sections.why.imageAlt")}
        />
        <HomeSection
          id={t("sections.features.id")}
          title={t("sections.features.title")}
          description={t("sections.features.description")}
          imageSrc="/sections/features.png"
          imageAlt={t("sections.features.imageAlt")}
          reverse
        />
        <HomeSection
          id={t("sections.security.id")}
          title={t("sections.security.title")}
          description={t("sections.security.description")}
          imageSrc="/sections/security.png"
          imageAlt={t("sections.security.imageAlt")}
        />
        <HomeSection
          id={t("sections.forWho.id")}
          title={t("sections.forWho.title")}
          description={t("sections.forWho.description")}
          imageSrc="/sections/forwho.png"
          imageAlt={t("sections.forWho.imageAlt")}
          reverse
        />
      </main>
      <Footer />
    </>
  );
}