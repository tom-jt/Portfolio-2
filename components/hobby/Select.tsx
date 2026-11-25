"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option<T extends string> {
  value: T;
  label: string;
}

/**
 * A dropdown in the site's own glass, in place of the browser's grey list.
 * Keyboard works as in a native select: arrows, Home and End, Enter or Space
 * to pick, Esc to close, and typing a letter jumps to it.
 */
function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  align = "left",
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  /** Accessible name, e.g. "Sort by". */
  label: string;
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    list.current?.focus();
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    button.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => pick(active),
      " ": () => pick(active),
      Escape: () => {
        setOpen(false);
        button.current?.focus();
      },
      Tab: () => setOpen(false),
    };
    const run = keys[e.key];
    if (run) {
      if (e.key !== "Tab") {
        e.preventDefault();
        // Keep Esc from also closing the popover or card this sits in:
        // they skip keys that are already handled.
        e.stopPropagation();
      }
      run();
      return;
    }
    if (e.key.length === 1) {
      const ch = e.key.toLowerCase();
      const from = options.findIndex((o, i) => i > active && o.label.toLowerCase().startsWith(ch));
      const hit = from >= 0 ? from : options.findIndex((o) => o.label.toLowerCase().startsWith(ch));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${current?.label}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className="flex h-full w-full cursor-pointer items-center justify-between gap-1.5 text-left"
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn("text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
          className={cn(
            "hb-pop hb-drop absolute top-[calc(100%+8px)] z-40 flex max-h-72 min-w-full flex-col gap-0.5 overflow-y-auto rounded-2xl p-1.5 outline-none",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(i)}
                className={cn(
                  "flex h-9 cursor-pointer items-center justify-between gap-4 rounded-[10px] px-3 text-sm whitespace-nowrap transition-colors",
                  i === active ? "bg-accent text-foreground" : "text-muted-foreground",
                  selected && "text-foreground font-medium",
                )}
              >
                {o.label}
                {selected && <Check size={15} className="text-hb-ink" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
