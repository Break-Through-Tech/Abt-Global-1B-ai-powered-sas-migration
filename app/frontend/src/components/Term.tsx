import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { GLOSSARY_BY_ID } from "../glossary";

/**
 * A word with a definition available in place: hover or focus to preview, click or tap to pin,
 * Escape to close. The panel is position: fixed so table scroll containers cannot clip it.
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY_BY_ID[id];
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean }>({ left: 0, top: 0, above: false });
  const ref = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(320, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left, window.innerWidth - width - 16));
    const above = r.bottom + 180 > window.innerHeight && r.top > 200;
    setPos({ left, top: above ? r.top - 8 : r.bottom + 8, above });
  };

  const show = () => { place(); setOpen(true); };
  const hide = () => { if (!pinned) setOpen(false); };

  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); setPinned(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onDown = (e: MouseEvent) => { if (!ref.current?.parentElement?.contains(e.target as Node)) close(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!entry) return <>{children}</>;

  return (
    <span className="relative inline">
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={() => { setPinned(false); setOpen(false); }}
        onClick={() => { if (pinned) { setPinned(false); setOpen(false); } else { show(); setPinned(true); } }}
        className="cursor-help border-b border-dotted border-current font-[inherit] text-inherit"
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="fixed z-50 block w-[min(320px,calc(100vw-32px))] border border-line bg-white p-3 text-left text-[14px] leading-relaxed font-normal tracking-normal text-body normal-case shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
          style={{ left: pos.left, top: pos.top, transform: pos.above ? "translateY(-100%)" : undefined }}
        >
          <span className="mb-1 block font-bold text-ink">{entry.term}</span>
          {entry.definition}
          <a href={`#/help#${entry.id}`} onMouseDown={(e) => e.preventDefault()} className="mt-2 block text-[13px] font-bold text-abt-red hover:underline">
            More in the glossary
          </a>
        </span>
      )}
    </span>
  );
}
