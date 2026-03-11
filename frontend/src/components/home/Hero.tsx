"use client";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative hidden min-h-svh w-full md:block">
        <div className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-right bg-no-repeat" />
        <div className="absolute inset-0 bg-white/20" />
        <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl items-center px-4 lg:px-6">
          <div className="max-w-130 text-left lg:-ml-12 lg:max-w-140">
            <h1 className="text-5xl leading-[0.95] font-black tracking-[-0.04em] text-slate-900 uppercase lg:text-6xl">
              Discutez ensemble,
              <br /> en temps réel
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-slate-700">
              Crée tes serveurs, organise tes canaux,
              <br /> discute instantanément avec ton équipe.
              <br />
              Simple, rapide, efficace.
            </p>
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <div className="relative h-[46vh] w-full">
          <div className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-right bg-no-repeat" />
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-28 bg-linear-to-b from-transparent to-[#F3F7FB]" />
        </div>
        <div className="bg-[#F3F7FB] px-6 pt-6 pb-10">
          <h1 className="text-center text-xl! leading-[1.05] font-black tracking-[-0.03em] text-slate-900 uppercase">
            Discutez ensemble,
            <br /> en temps réel
          </h1>
          <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-slate-700">
            Crée tes serveurs, organise tes canaux, discute instantanément avec
            ton équipe. Simple, rapide, efficace.
          </p>
        </div>
      </div>
    </section>
  );
}
