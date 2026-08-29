"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      pathname === href ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">💳 Bill Tracker</span>
          <Link href="/" className={linkClass("/")}>
            Year Grid
          </Link>
          <Link href="/cards" className={linkClass("/cards")}>
            Cards
          </Link>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
