import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { t } from "@/lib/strings";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: t.appName, template: `%s | ${t.appName}` },
  description: t.tagline,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Minimal shell; R0 replaces it with the Simpolis theme (Plus Jakarta Sans, tokens).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
