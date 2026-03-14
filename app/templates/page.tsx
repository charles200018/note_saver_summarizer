import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

const templates = [
  { 
    name: "Meeting Notes", 
    description: "Structured template for capturing meeting minutes and action items",
    icon: "users",
    color: "#7c3aed"
  },
  { 
    name: "Project Plan", 
    description: "Outline your project goals, milestones, and deliverables",
    icon: "clipboard",
    color: "#059669"
  },
  { 
    name: "Daily Journal", 
    description: "Reflect on your day with guided prompts",
    icon: "book",
    color: "#9333ea"
  },
  { 
    name: "Research Notes", 
    description: "Capture and organize research findings systematically",
    icon: "search",
    color: "#1e40af"
  },
  { 
    name: "Book Summary", 
    description: "Template for summarizing key takeaways from books",
    icon: "library",
    color: "#b87333"
  },
  { 
    name: "Weekly Review", 
    description: "Review achievements and plan for the upcoming week",
    icon: "calendar",
    color: "#059669"
  },
];

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[#08080c]">
      <Sidebar />
      <main className="lg:ml-64">
        <TopNav title="Templates" email={user.email} />
        <div className="p-8">
          {/* Hero Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-3">Note Templates</h2>
            <p className="text-[#808080] font-light max-w-2xl">
              Start with professionally designed templates to structure your notes. Customize them to fit your workflow.
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
            {templates.map((template, idx) => (
              <div
                key={idx}
                className="group premium-feature-card p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300"
              >
                <div 
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center border border-[#2a2a38]"
                  style={{ backgroundColor: template.color + "15" }}
                >
                  <svg className="w-6 h-6" style={{ color: template.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {template.icon === "users" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                    {template.icon === "clipboard" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
                    {template.icon === "book" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                    {template.icon === "search" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                    {template.icon === "library" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />}
                    {template.icon === "calendar" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  </svg>
                </div>
                <h3 className="text-lg font-light text-[#e4e4e7] mb-2 tracking-wide group-hover:text-[#7c3aed] transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-[#606060] font-light leading-relaxed">
                  {template.description}
                </p>
                <div className="mt-4 pt-4 border-t border-[#1a1a24]">
                  <span className="text-xs text-[#7c3aed] tracking-wide uppercase font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Use Template →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Custom Template */}
          <div className="mt-12 max-w-5xl">
            <div className="premium-feature-card p-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-light text-[#e4e4e7] mb-2 tracking-wide">Create Custom Template</h3>
                <p className="text-sm text-[#606060] font-light">Design your own template to match your unique workflow</p>
              </div>
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9a7b1a] text-[#08080c] font-semibold tracking-wide uppercase text-sm hover:shadow-lg hover:shadow-[#7c3aed]/30 transition-all duration-300">
                Create Template
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
