"use client";

import { Popover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

// BUG-072: a small "?" next to a label that opens a short explanation on click or Enter (not hover only, so it works on phones).
export function Hint({ label, text, className }: { label: string; text: string; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Što znači: ${label}`}
        className={cn(
          "relative inline-grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[0.7rem] leading-none font-extrabold text-muted-foreground transition-colors align-middle",
          "before:absolute before:-inset-2.5 before:content-[''] hover:bg-secondary hover:text-secondary-foreground data-[popup-open]:bg-primary data-[popup-open]:text-primary-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className,
        )}
      >
        ?
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} collisionPadding={16} className="z-50">
          <Popover.Popup className="anim-pop max-w-72 rounded-xl border bg-card px-4 py-3 text-sm leading-snug font-normal text-foreground shadow-card outline-none">
            <Popover.Title className="mb-1 font-bold">{label}</Popover.Title>
            <Popover.Description>{text}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
