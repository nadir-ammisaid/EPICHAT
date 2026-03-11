"use client";

export default function Footer() {
  return (
    <footer className="bg-[#2F5BEA] text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 text-center md:grid-cols-4">
          <div>
            <div className="mb-4 text-xl font-extrabold tracking-tight">
              EPICHAT
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              <li>Une plateforme de discussion</li>
              <li>moderne pour collaborer, </li>
              <li>échanger et organiser </li>
              <li>vos équipes simplement.</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white/90 uppercase">
              Navigation
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <a href="#pourquoi" className="transition hover:text-white">
                  Pourquoi EpiChat
                </a>
              </li>
              <li>
                <a
                  href="#fonctionnalites"
                  className="transition hover:text-white"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#securite" className="transition hover:text-white">
                  Sécurité & accès
                </a>
              </li>
              <li>
                <a href="#pourqui" className="transition hover:text-white">
                  Pour qui ?
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white/90 uppercase">
              Projet
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>Epitech</li>
              <li>Projet RTC</li>
              <li>Année 2026</li>
              <li>Promo 2028</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white/90 uppercase">
              Réalisé par
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>Nadir AMMI SAID</li>
              <li>Younes HADDAD</li>
              <li>Warith DIMIA</li>
              <li>Michaël GIRARDET</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-[#2448C8] py-4">
        <p className="text-center text-xs text-white/70">
          © {new Date().getFullYear()} EpiChat - Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
