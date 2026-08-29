"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/NavBar";

// Hides the nav bar on the login page, since there's nothing to
// navigate to before signing in.
export function NavBarGate() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <NavBar />;
}
