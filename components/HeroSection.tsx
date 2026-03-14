"use client";

import { motion } from "framer-motion";

type HeroSectionProps = {
  serifClassName: string;
};

export function HeroSection({ serifClassName }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-16 sm:px-10 lg:px-16 lg:pt-24 lg:pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-[#c9a46c]/15 blur-3xl" />
        <div className="absolute right-16 top-24 h-40 w-40 rounded-full bg-[#e7cfa1]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-[#c9a46c]">Aurelius Reserve</p>
          <h1 className={`${serifClassName} text-4xl font-semibold leading-tight text-[#f5e6d3] sm:text-5xl lg:text-6xl`}>
            Luxury Notes,
            <br />
            Distilled Like
            <br />
            Jamaican Gold.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[#d6c1a0]/85 sm:text-lg">
            Transform long videos into elegant summaries with an experience crafted like a premium roast: rich,
            smooth, and unforgettable.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#products"
              className="group inline-flex items-center justify-center rounded-sm border border-[#c9a46c]/60 bg-gradient-to-b from-[#2a1a12] to-[#140d09] px-8 py-3 text-sm uppercase tracking-[0.22em] text-[#f5e6d3] transition hover:border-[#e7cfa1] hover:shadow-[0_0_24px_rgba(201,164,108,0.35)]"
            >
              Discover
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </a>
            <span className="text-xs uppercase tracking-[0.25em] text-[#b79666]">Premium Knowledge Curation</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-[380px] w-[300px] sm:h-[460px] sm:w-[360px]"
          >
            <div className="absolute inset-0 rounded-[40%] bg-[radial-gradient(circle,_rgba(201,164,108,0.35)_0%,_rgba(11,6,4,0)_70%)]" />
            <div className="absolute inset-x-10 top-10 h-[74%] rounded-[2rem] border border-[#c9a46c]/45 bg-gradient-to-b from-[#2a1a12] via-[#17100c] to-[#0f0906] shadow-[0_24px_64px_rgba(0,0,0,0.55)]" />
            <div className="absolute right-8 top-6 h-20 w-8 rounded bg-gradient-to-b from-[#f0dcb6] to-[#b88f58]" />
            <div className="absolute inset-x-16 top-20 h-28 rounded-lg border border-[#e7cfa1/40] bg-[#0e0906]/85" />
            <div className="absolute left-1/2 top-[44%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a46c]/55 bg-[#120c08] shadow-[0_0_18px_rgba(201,164,108,0.3)]" />
            <div className="absolute left-1/2 top-[44%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a46c]/60" />
            <div className="absolute bottom-6 left-1/2 h-20 w-44 -translate-x-1/2 rounded-[999px] bg-[radial-gradient(circle,_rgba(0,0,0,0.62)_0%,_rgba(0,0,0,0)_75%)]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
