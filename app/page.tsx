import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AboutSection } from "@/components/AboutSection";
import { FeatureSection } from "@/components/FeatureSection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ProductGrid } from "@/components/ProductGrid";
import { createClient } from "@/lib/supabase/server";
import { Cinzel, Inter } from "next/font/google";
import { redirect } from "next/navigation";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className={`${cinzel.variable} ${inter.variable} min-h-screen bg-[#0b0604] font-[family-name:var(--font-inter)] text-[#f5e6d3]`}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(231,207,161,0.08),transparent_42%),radial-gradient(circle_at_80%_15%,rgba(201,164,108,0.12),transparent_40%),linear-gradient(to_bottom,#0b0604,#120905_38%,#090504)]" />

        <HeroSection serifClassName="font-[family-name:var(--font-cinzel)]" />
        <div className="mx-auto max-w-7xl px-6 pb-8 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-sm rounded-2xl border border-[#c9a46c]/25 bg-[#120b08]/75 p-5 backdrop-blur">
            <p className="mb-3 text-center text-xs uppercase tracking-[0.24em] text-[#c9a46c]">Members Entrance</p>
            <GoogleSignInButton />
          </div>
        </div>
        <ProductGrid serifClassName="font-[family-name:var(--font-cinzel)]" />
        <AboutSection serifClassName="font-[family-name:var(--font-cinzel)]" />
        <FeatureSection serifClassName="font-[family-name:var(--font-cinzel)]" />
        <Footer serifClassName="font-[family-name:var(--font-cinzel)]" />
      </div>
    </main>
  );
}
