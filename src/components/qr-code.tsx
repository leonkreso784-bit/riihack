import { encode } from "uqr";

// QR code as plain SVG (one path of dark squares), drawn from uqr's matrix; no innerHTML. White box for phone cameras.
export function QrCode({ text, label, className }: { text: string; label: string; className?: string }) {
  const { data, size } = encode(text, { ecc: "M", border: 2 });
  const d = data.flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : ""))).join("");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges" className={className}>
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#151b2b" />
    </svg>
  );
}
