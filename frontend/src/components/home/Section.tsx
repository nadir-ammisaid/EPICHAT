"use client";
import Image from "next/image";

type HomeSection = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
};

export default function HomeSection({
  id,
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false,
}: HomeSection) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-6 py-16 scroll-mt-28">
      <div className="rounded-[2.5rem] bg-[#EAF3FF] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.10)] md:p-12">
        <div className={["grid items-center gap-10 md:grid-cols-2", reverse ? "md:[&>*:first-child]:order-2" : "",].join(" ")}>
          <div className="text-slate-900">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-700 md:text-lg">
              {description}
            </p>
          </div>
          <div className="rounded-4xl bg-linear-to-b from-[#5FA8FF] to-[#2F6BFF] p-6 shadow-[0_16px_40px_rgba(47,107,255,0.25)]">
            <div className="overflow-hidden rounded-2xl bg-white/10">
              <div className="relative w-full aspect-video">
                <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={false}
                />
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}