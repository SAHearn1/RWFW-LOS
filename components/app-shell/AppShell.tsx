"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { AppRole } from "@/lib/auth/roles";
import type { NavItem } from "@/lib/nav/items";

type AppShellProps = {
  role: AppRole;
  navItems: readonly NavItem[];
  userLabel: string;
  children: React.ReactNode;
};

function NavLinks({ navItems, pathname, onNavigate }: { navItems: readonly NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1" aria-label="Primary" data-tour="primary-nav">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            data-tour={item.href === "/app/profile" ? "profile-link" : undefined}
            className={[
              "block rounded px-3 py-2 text-sm",
              active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ role, navItems, userLabel, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
          >
            Menu
          </button>
          <div>
            <p className="text-sm font-semibold">RootWork LOS</p>
            <p className="text-xs text-slate-600">Role: {role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-600 sm:inline">{userLabel}</span>
          <details className="relative" data-tour="help-menu">
            <summary className="cursor-pointer list-none rounded border border-slate-300 px-3 py-2 text-sm">Help</summary>
            <div className="absolute right-0 mt-2 w-52 rounded border border-slate-200 bg-white p-2 shadow">
              <button
                type="button"
                className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("rootwork:restart-tour"));
                }}
              >
                Restart tour
              </button>
            </div>
          </details>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[240px_1fr]">
        <aside className="hidden rounded-xl border border-slate-200 bg-white p-4 md:block">
          <NavLinks navItems={navItems} pathname={pathname} />
        </aside>

        {mobileOpen ? (
          <aside className="rounded-xl border border-slate-200 bg-white p-4 md:hidden">
            <NavLinks navItems={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        ) : null}

        <main className="rounded-xl border border-slate-200 bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
