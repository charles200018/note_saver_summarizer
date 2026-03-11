import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

const faqs = [
  {
    q: "How do I create a new note?",
    a: "Click on 'Notes' in the sidebar, then click the 'New Note' button. You can write in Markdown format for rich text formatting."
  },
  {
    q: "How does the YouTube summarizer work?",
    a: "Paste any YouTube video URL in the YouTube section. Our AI will extract the transcript and generate a comprehensive summary automatically."
  },
  {
    q: "What are Collections?",
    a: "Collections help you organize your notes and YouTube summaries into groups. Think of them as folders for your content."
  },
  {
    q: "How does Image to Text work?",
    a: "Upload any image containing text, and our AI-powered OCR will extract all readable text from the image."
  },
  {
    q: "Is my data secure?",
    a: "Yes, all your data is encrypted and stored securely. We use industry-standard security practices to protect your information."
  },
  {
    q: "Can I export my notes?",
    a: "Yes, you can copy any note content or export it in various formats. Look for the export options in the note view."
  },
];

export default async function HelpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[#08080c]">
      <Sidebar />
      <main className="ml-64">
        <TopNav title="Help & Support" email={user.email} />
        <div className="p-8">
          {/* Hero Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-3">Help Center</h2>
            <p className="text-[#808080] font-light max-w-2xl">
              Find answers to common questions and learn how to get the most out of Aurelius.
            </p>
          </div>

          <div className="max-w-4xl">
            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-5 mb-12">
              <div className="premium-feature-card p-6 text-center hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center mx-auto mb-4 border border-[#7c3aed]/20">
                  <svg className="w-7 h-7 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-light text-[#e4e4e7] mb-2">Documentation</h3>
                <p className="text-sm text-[#606060] font-light">Detailed guides and tutorials</p>
              </div>

              <div className="premium-feature-card p-6 text-center hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-[#059669]/10 flex items-center justify-center mx-auto mb-4 border border-[#059669]/20">
                  <svg className="w-7 h-7 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-light text-[#e4e4e7] mb-2">Contact Support</h3>
                <p className="text-sm text-[#606060] font-light">Get help from our team</p>
              </div>

              <div className="premium-feature-card p-6 text-center hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-[#9333ea]/10 flex items-center justify-center mx-auto mb-4 border border-[#9333ea]/20">
                  <svg className="w-7 h-7 text-[#9333ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-light text-[#e4e4e7] mb-2">Feature Requests</h3>
                <p className="text-sm text-[#606060] font-light">Suggest new features</p>
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h3 className="text-xl font-light text-[#e4e4e7] mb-6 tracking-wide">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="premium-feature-card p-6">
                    <h4 className="text-[#e4e4e7] font-medium mb-3 flex items-start gap-3">
                      <span className="text-[#7c3aed]">Q:</span>
                      {faq.q}
                    </h4>
                    <p className="text-[#808080] font-light pl-6 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-12 premium-feature-card p-8 text-center">
              <h3 className="text-xl font-light text-[#e4e4e7] mb-3">Still need help?</h3>
              <p className="text-[#606060] font-light mb-6">Our support team is here to assist you</p>
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9a7b1a] text-[#08080c] font-semibold tracking-wide uppercase text-sm hover:shadow-lg hover:shadow-[#7c3aed]/30 transition-all duration-300">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
