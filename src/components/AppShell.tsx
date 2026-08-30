"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

// The login page renders standalone; every authenticated route gets the
// sidebar shell.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
