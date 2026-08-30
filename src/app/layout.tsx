import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";

/*
 * DESIGN.md specifies Saans at variable weights (652 heading / 456 body / 300
 * light). Saans is a commercial licence and is not available on Google Fonts,
 * so Inter — a variable grotesque with the same neutral voice — stands in and
 * carries those exact weights. Swap the family here if Saans is licensed.
 */
const saans = Inter({
  variable: "--font-saans",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Your Money",
  description: "Track your credit cards, expenses and investments in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${saans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
