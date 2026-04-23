"use client";

import { useTranslation } from "react-i18next";

const navItems = [
  { key: "sections.why.title", href: "#pourquoi" },
  { key: "sections.features.title", href: "#fonctionnalites" },
  { key: "sections.security.title", href: "#securite" },
  { key: "sections.forWho.title", href: "#pourqui" },
];

export default function Footer() {
  const { t } = useTranslation(["common", "home"]);

  const descriptionLines = t("footer.descriptionLines", {
    ns: "common",
    returnObjects: true,
  }) as string[];

  const projectItems = t("footer.projectItems", {
    ns: "common",
    returnObjects: true,
  }) as string[];

  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand text-background">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 text-center md:grid-cols-4">
          <div>
            <div className="mb-4 text-xl font-extrabold tracking-tight">
              {t("footer.title", { ns: "common" })}
            </div>
            <ul className="space-y-3 text-sm text-background">
              {descriptionLines.map((line) => (
                <li className="hover:text-background hover:cursor-pointer" key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-background uppercase">
              {t("footer.navigationTitle", { ns: "common" })}
            </h3>
            <ul className="space-y-3 text-sm text-background">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition hover:text-background">
                    {t(item.key, { ns: "home" })}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-background uppercase">
              {t("footer.projectTitle", { ns: "common" })}
            </h4>
            <ul className="space-y-3 text-sm text-background">
              {projectItems.map((item) => (
                <li key={item} className="hover:text-background hover:cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-background uppercase">
              {t("footer.madeByTitle", { ns: "common" })}
            </h4>
            <ul className="space-y-3 text-sm text-background">
              <li>Nadir AMMI SAID</li>
              <li>Younes HADDAD</li>
              <li>Warith DIMIA</li>
              <li>Michaël GIRARDET</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-brand-fonce py-4">
        <p className="text-center text-xs text-background">
          {t("footer.copyright", {
            ns: "common",
            year,
          })}
        </p>
      </div>
    </footer>
  );
}
