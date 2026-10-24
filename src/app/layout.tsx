import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { t } from "@/lib/strings";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: t.appName, template: `%s | ${t.appName}` },
  description: t.tagline,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5f8fd" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
