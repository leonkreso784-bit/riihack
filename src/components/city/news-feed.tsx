import type { NewsItem } from "@/lib/types";

const time = (at: string) => new Date(at).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });

// News of the city, newest first.
export function NewsFeed({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Grad je miran. Vijesti stižu čim netko promijeni cijenu ili potpiše ugovor.</p>;
  }
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ul className="divide-y">
      {sorted.map((n, i) => (
        <li key={`${n.at}-${i}`} className="flex gap-3 py-3">
          <time dateTime={n.at} className="w-12 shrink-0 pt-0.5 text-xs font-bold text-muted-foreground tabular-nums">
            {time(n.at)}
          </time>
          {/* wrap-anywhere: a hotel name of 40 letters without spaces must not widen the page (review STUDENT-07) */}
          <p className="min-w-0 flex-1 text-sm wrap-anywhere">{n.text}</p>
        </li>
      ))}
    </ul>
  );
}
