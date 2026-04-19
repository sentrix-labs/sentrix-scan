"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useRef } from "react";
import { Copyable } from "./Copyable";
import { shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AddressProps {
  address: string;
  truncate?: boolean;
  link?: boolean;
  showCopy?: boolean;
  className?: string;
  /** Show label instead of address (e.g. validator name) while keeping address behavior */
  label?: string;
  /** Make text muted (for secondary contexts like table cells) */
  muted?: boolean;
}

// DECISION: hover highlight uses data-address + DOM query pattern (Solana Explorer inspired)
// Attaches listeners on mount, toggles class via querySelectorAll on hover.
export function Address({
  address,
  truncate = true,
  link = true,
  showCopy = true,
  className,
  label,
  muted = false,
}: AddressProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const display = label ?? (truncate ? shortenAddress(address) : address);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onEnter() {
      document
        .querySelectorAll(`[data-address="${address}"]`)
        .forEach((n) => n.classList.add("address-highlight"));
    }
    function onLeave() {
      document
        .querySelectorAll(`[data-address="${address}"]`)
        .forEach((n) => n.classList.remove("address-highlight"));
    }

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [address]);

  const linkClasses = cn(
    "font-mono text-sm hover:underline rounded px-0.5 -mx-0.5 transition-colors",
    muted ? "text-muted-foreground hover:text-primary" : "text-primary",
    className,
  );

  const content = link ? (
    <Link
      ref={ref as never}
      href={`/address/${address}`}
      data-address={address}
      title={address}
      className={linkClasses}
    >
      {display}
    </Link>
  ) : (
    <span
      ref={ref}
      data-address={address}
      title={address}
      className={cn("font-mono text-sm", muted && "text-muted-foreground", className)}
    >
      {display}
    </span>
  );

  if (!showCopy) return content;

  return (
    <span className="inline-flex items-center gap-1 min-w-0">
      {content}
      <Copyable text={address} bare />
    </span>
  );
}
