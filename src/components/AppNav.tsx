"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Files, Settings2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Submit MoM", icon: FileText },
  { href: "/submissions", label: "Submitted PDFs", icon: Files },
  { href: "/admin", label: "Admin Config", icon: Settings2 },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logos/icm-logo.png"
            alt="ICM Insan Cendekia Madani"
            className="h-9 w-auto object-contain"
          />
          <div className="hidden border-l border-slate-200 pl-3 leading-tight sm:block">
            <div className="text-sm font-bold tracking-tight text-slate-900">
              Exam MoM Generator
            </div>
            <div className="text-xs text-slate-500">
              Minutes of Meeting &amp; PDF Archive
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#1e3a5f] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
