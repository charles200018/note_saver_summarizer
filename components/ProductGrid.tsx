"use client";

import { motion } from "framer-motion";

type Product = {
  name: string;
  note: string;
  tone: string;
};

type ProductGridProps = {
  serifClassName: string;
};

const products: Product[] = [
  {
    name: "Black & Gold",
    note: "Deep focus summaries for technical talks and research-heavy videos.",
    tone: "from-[#1b130e] via-[#15100c] to-[#0f0a07]",
  },
  {
    name: "Bronze Reserve",
    note: "Balanced insight extraction for strategy, learning, and daily workflows.",
    tone: "from-[#2a1812] via-[#1b110c] to-[#120b08]",
  },
  {
    name: "Royal Blue",
    note: "Precision mode for long-form explainers with layered key-point capture.",
    tone: "from-[#171722] via-[#10101a] to-[#0a0a12]",
  },
];

export default function ProductGrid({ serifClassName }: ProductGridProps) {
  return (
    <section id="products" className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
      <div className="mb-10 flex items-center justify-between gap-6">
        <h2 className={`${serifClassName} text-3xl text-[#f5e6d3] sm:text-4xl`}>Signature Blends</h2>
        <span className="hidden text-xs uppercase tracking-[0.25em] text-[#b79666] sm:inline">Limited Collection</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product, index) => (
          <motion.article
            key={product.name}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: index * 0.12 }}
            whileHover={{ y: -8 }}
            className={`group relative overflow-hidden rounded-2xl border border-[#c9a46c]/30 bg-gradient-to-b ${product.tone} p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)]`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e7cfa1]/60 to-transparent" />
            <div className="mb-5 flex h-52 items-center justify-center rounded-xl border border-[#c9a46c]/30 bg-[#0d0907]/70">
              <motion.div
                whileHover={{ rotate: -2, scale: 1.03 }}
                className="relative h-40 w-28 rounded-2xl border border-[#c9a46c]/50 bg-gradient-to-b from-[#26180f] to-[#0f0906]"
              >
                <div className="absolute right-2 top-2 h-10 w-3 rounded bg-gradient-to-b from-[#f0dcb6] to-[#b88f58]" />
                <div className="absolute inset-x-3 top-10 h-12 rounded border border-[#e7cfa1]/30 bg-[#140d09]/90" />
                <div className="absolute left-1/2 top-[62%] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a46c]/60" />
              </motion.div>
            </div>
            <h3 className={`${serifClassName} text-2xl text-[#efd7b2]`}>{product.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#d2bd9a]/85">{product.note}</p>
            <button className="mt-6 inline-flex items-center rounded-sm border border-[#c9a46c]/50 px-5 py-2 text-xs uppercase tracking-[0.2em] text-[#f5e6d3] transition group-hover:border-[#e7cfa1] group-hover:shadow-[0_0_20px_rgba(201,164,108,0.28)]">
              Learn More
            </button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
