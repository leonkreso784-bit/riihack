import { GameNav } from "@/components/bottom-nav";

// Student game shell: sidebar from 768 px, bottom bar on phones (pb keeps content above it).
export default function GameLayout({ children }: LayoutProps<"/igra">) {
  return (
    <div className="flex gap-6 pb-20 md:pb-0">
      <GameNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
