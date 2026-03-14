"use client";

import { motion } from "framer-motion";

type FeatureSectionProps = {
  serifClassName: string;
};

const features = [
  {
    title: "Origin",
    heading: "From long-form videos to distilled insight",
    text: "We parse subtitles and structure narrative meaning into elegant, readable layers so your team gets context without the noise.",
  },
  {
    title: "Quality",
    heading: "Balanced summaries with a premium finish",
    text: "TLDR, key points, and detailed synthesis are shaped for clarity, speed, and executive-level consumption.",
  },
];

function BeanIcon() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a46c]/45 bg-[#21150f]/60 text-[#e7cfa1] shadow-[0_0_18px_rgba(201,164,108,0.2)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 5c5.5-1 10 3 9 8.5S11 22 6 20c-4-1.5-4.5-8.5 2-15z" />
        <path d="M12.8 6.8c-2.3 1.8-3.7 4.9-3.1 8.1" />
      </svg>
    </span>
  );
}

export function FeatureSection({ serifClassName }: FeatureSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
      <div className="space-y-14">
        {features.map((feature, index) => {
          const reversed = index % 2 === 1;
          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, x: reversed ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65 }}
              className={`grid items-center gap-8 rounded-3xl border border-[#c9a46c]/20 bg-[#130c08]/55 p-7 shadow-[0_18px_38px_rgba(0,0,0,0.36)] md:grid-cols-2 md:p-10 ${reversed ? "" : ""}`}
            >
              <div className={reversed ? "md:order-2" : ""}>
                <div className="mb-4 inline-flex items-center gap-3">
                  <BeanIcon />
                  <span className="text-xs uppercase tracking-[0.28em] text-[#b79666]">{feature.title}</span>
                </div>
                <h3 className={`${serifClassName} text-2xl text-[#f5e6d3] sm:text-3xl`}>{feature.heading}</h3>
                <p className="mt-4 text-base leading-relaxed text-[#d5bf9a]/85">{feature.text}</p>
              </div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                className={reversed ? "md:order-1" : ""}
              >
                <div className="relative mx-auto h-52 w-full max-w-sm rounded-3xl border border-[#c9a46c]/35 bg-gradient-to-b from-[#28170f] to-[#120a07] p-5">
                  <div className="h-full rounded-2xl border border-[#e7cfa1]/22 bg-[radial-gradient(circle_at_top_right,_rgba(201,164,108,0.18),_rgba(18,10,7,0.9)_65%)]" />
                  <div className="absolute left-6 top-6 h-7 w-7 rounded-full bg-[#c9a46c]/45 blur-sm" />
                  <div className="absolute bottom-7 right-7 h-9 w-9 rounded-full bg-[#e7cfa1]/20 blur-sm" />
                </div>
              </motion.div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
