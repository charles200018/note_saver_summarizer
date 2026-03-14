"use client";

import { motion } from "framer-motion";

type FooterProps = {
  serifClassName: string;
};

const socials = [
  { label: "Instagram", href: "#" },
  { label: "X", href: "#" },
  { label: "YouTube", href: "#" },
];

export function Footer({ serifClassName }: FooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6 }}
      className="border-t border-[#c9a46c]/25 bg-[#0b0604]/90 px-6 py-12 sm:px-10 lg:px-16"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className={`${serifClassName} text-2xl text-[#e7cfa1]`}>Aurelius</p>
          <p className="text-xs uppercase tracking-[0.28em] text-[#b79666]">Premium Notes</p>
        </div>

        <div className="flex items-center gap-3">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              className="rounded-full border border-[#c9a46c]/45 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#f5e6d3] transition hover:border-[#e7cfa1] hover:bg-[#1a100b]"
            >
              {social.label}
            </a>
          ))}
        </div>

        <p className="text-xs tracking-[0.16em] text-[#ad8f64]">© {new Date().getFullYear()} Aurelius. All rights reserved.</p>
      </div>
    </motion.footer>
  );
}
