"use client";

import { Search, X } from "lucide-react";
import type { Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared site-wide search input — used by Projects, Repos and Articles
 * sections so all three filters look and behave identically:
 *   • rounded-2xl glass card, brand focus ring, 46px touch target
 *   • dir="auto" — follows the typed text (LTR repo names / RTL Persian)
 *   • native WebKit ✕ hidden; our own circular clear button instead
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
  inputRef,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}) {
  return (
    <div className={cn("relative max-w-xl mx-auto", className)}>
      <Search
        className="absolute start-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        dir="auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full ps-12 pe-12 py-3.5 rounded-2xl border border-border bg-card/80 backdrop-blur text-sm outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-muted-foreground/70 min-h-[46px] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className="absolute end-3 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
