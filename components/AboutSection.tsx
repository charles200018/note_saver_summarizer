"use client";

import { motion } from "framer-motion";

type AboutSectionProps = {
  serifClassName: string;
};

export function AboutSection({ serifClassName }: AboutSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="relative mx-auto max-w-5xl px-6 py-20 sm:px-10"
    >
      <div className="rounded-3xl border border-[#c9a46c]/28 bg-gradient-to-b from-[#21140f]/80 to-[#120a07]/75 px-8 py-14 text-center shadow-[0_28px_60px_rgba(0,0,0,0.42)] sm:px-12">
        <p className="text-xs uppercase tracking-[0.35em] text-[#b79666]">About</p>
        <h2 className={`${serifClassName} mt-5 text-3xl text-[#f5e6d3] sm:text-4xl`}>Crafted for Premium Thinking</h2>
        <div className="mx-auto mt-6 h-px w-28 bg-gradient-to-r from-transparent via-[#c9a46c] to-transparent" />
        <p className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-[#dbc6a5]/90 sm:text-lg">
          Aurelius blends AI precision with editorial elegance. We transform complex video content into structured,
          high-value summaries so your ideas stay rich, focused, and ready for action.
        </p>
      </div>
    </motion.section>
  );
}
