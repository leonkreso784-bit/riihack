import Image from "next/image";
import { cn } from "@/lib/utils";

// Simpolis mark: Rino's chosen V1 logo, exactly as delivered (public/brand/logo.png), cropped to a square.
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={256}
      height={256}
      priority
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
