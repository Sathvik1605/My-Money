"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ChartIcon,
  CloseIcon,
  CreditCardIcon,
  GridIcon,
  LogoutIcon,
  MenuIcon,
  TrendIcon,
  WalletIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  /** Modules on the roadmap render disabled so the IA is visible but not misleading. */
  comingSoon?: boolean;
};

// Grouped navigation keeps each money domain scannable as the app grows.
const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Credit Cards",
    items: [
      { href: "/", label: "Bill Overview", icon: GridIcon },
      { href: "/cards", label: "Cards", icon: CreditCardIcon },
    ],
  },
  {
    heading: "Coming Soon",
    items: [
      { href: "/expenses", label: "Expenses", icon: WalletIcon, comingSoon: true },
      { href: "/mutual-funds", label: "Mutual Funds", icon: ChartIcon, comingSoon: true },
      { href: "/stocks", label: "Stocks", icon: TrendIcon, comingSoon: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const renderNav = (inDrawer: boolean) => (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 rounded-full px-1 py-1">
          <span className="squircle grid h-9 w-9 place-items-center bg-[var(--color-primary)] text-[var(--color-on-primary)]">
            <WalletIcon />
          </span>
          <span className="text-base font-semibold">Your Money</span>
        </Link>
        {inDrawer && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="btn-ghost h-11 w-11 border-0 px-0"
            aria-label="Close navigation menu"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-6 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <h2 className="label px-4 pb-2 text-[var(--color-text-faint)]">
              {group.heading}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.comingSoon) {
                  return (
                    <li key={item.href}>
                      <span
                        aria-disabled="true"
                        title="Coming soon"
                        className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-full px-4 text-[14px] font-[600] text-[var(--color-text-faint)]"
                      >
                        <Icon />
                        <span className="flex-1">{item.label}</span>
                        <span className="badge">Soon</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-11 items-center gap-3 rounded-full px-4 text-[14px] font-[600] transition-colors ${
                        isActive
                          ? "bg-[var(--color-canvas-soft)] text-[var(--color-ink)]"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      <Icon />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-[var(--color-hairline)] pt-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="label text-[var(--color-text-muted)]">Theme</span>
          <ThemeToggle />
        </div>
        <button onClick={handleSignOut} className="btn-ghost w-full justify-start">
          <LogoutIcon />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar: the sidebar collapses to a drawer below lg. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)] px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="btn-ghost h-11 w-11 px-0"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <MenuIcon />
        </button>
        <span className="text-sm font-semibold">Your Money</span>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[var(--color-scrim)]"
          />
          <div className="absolute inset-y-0 left-0 w-[var(--sidebar-width)] border-r border-[var(--color-hairline)] bg-[var(--color-canvas)]">
            {renderNav(true)}
          </div>
        </div>
      )}

      <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-[var(--color-hairline)] bg-[var(--color-canvas)] lg:sticky lg:top-0 lg:block lg:h-screen">
        {renderNav(false)}
      </aside>
    </>
  );
}
