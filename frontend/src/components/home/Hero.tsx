"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation("home");

  const title = t("hero.title");
  const subtitle = t("hero.subtitle");

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative hidden min-h-svh w-full md:block">
        <video
          className="absolute inset-0 h-full w-full object-cover object-right"
          src="/hero_v2.mp4"
          poster="/hero.webp"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-white/20" />

        <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl items-center px-6 lg:px-8">
          <div className="flex max-w-2xl flex-col space-y-6 md:mt-20 bg-white/1 backdrop-blur-xs rounded-2xl px-8 py-8">
            <h1 className="text-4xl leading-[0.9] font-black tracking-tighter text-slate-900 uppercase drop-shadow-sm md:text-6xl lg:text-7xl">
              {title}
            </h1>

            <p className="max-w-md text-lg leading-relaxed font-medium text-slate-700/90 drop-shadow-sm md:text-xl">
              {subtitle}
            </p>

            {/* CTA  */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register" className="bg-brand hover:bg-brand-hover w-full cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-white transition duration-300 ease-in-out inline-flex items-center justify-center sm:w-fit">
                {t("hero.join")}
              </Link>

              <Link href="/login" className="bg-background text-foreground border-border w-full cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-medium transition duration-300 ease-in-out hover:bg-white/80 inline-flex items-center justify-center sm:w-fit">
                {t("hero.myAccount")}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <div className="relative w-full">
          <video
            role="presentation"
            className="w-full"
            src="/hero_v2.mp4"
            poster="/hero.webp"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
          <div className="to-background pointer-events-none absolute right-0 bottom-0 left-0 h-28 bg-linear-to-b from-transparent" />
        </div>

        <div className="bg-[#F3F7FB] px-6 pt-6 pb-10">
          <h1 className="text-center text-xl! leading-[1.05] font-black tracking-[-0.03em] text-slate-900 uppercase">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-slate-700">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
