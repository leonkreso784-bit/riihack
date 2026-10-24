import { GameNav } from "@/components/bottom-nav";

// Student game shell: fixed sidebar from 768 px, bottom tabs on phones (pb keeps content above them).
export default function GameLayout({ children }: LayoutProps<"/igra">) {
  return (
    <div className="min-h-dvh md:pl-60">
      <GameNav />
      <main className="mx-auto max-w-5xl px-4 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>
    </div>
  );
}
