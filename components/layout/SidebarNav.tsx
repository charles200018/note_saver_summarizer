"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type SidebarNavProps = {
  items: NavItem[];
  icons: Record<string, React.ReactNode>;
  title: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ items, icons, title }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div>
      <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8f7049]">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300",
                active
                  ? "border-[#c9a46c]/35 bg-[linear-gradient(90deg,rgba(45,28,18,0.95),rgba(24,15,10,0.8))] text-[#f5e6d3] shadow-[inset_0_1px_0_rgba(231,207,161,0.06)]"
                  : "border-transparent text-[#c8b6a0] hover:border-[#c9a46c]/20 hover:bg-[#1c120d]/75 hover:text-[#f5e6d3]",
              ].join(" ")}
            >
              <span className={active ? "text-[#e7cfa1]" : "text-[#8f7049] transition-colors duration-300 group-hover:text-[#e7cfa1]"}>
                {icons[item.icon]}
              </span>
              <span className="flex-1 tracking-[0.04em]">{item.label}</span>
              {active ? <span className="h-2 w-2 rounded-full bg-[#c9a46c] shadow-[0_0_12px_rgba(201,164,108,0.45)]" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
