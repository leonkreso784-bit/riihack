import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppFrame } from "@/components/app-frame";
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
        <AppFrame>{children}</AppFrame>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
