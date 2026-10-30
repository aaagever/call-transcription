import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SpeechModel } from "../lib/types";

interface Props {
  value: SpeechModel;
  onChange: (model: SpeechModel) => void;
}

interface Model {
  value: SpeechModel;
  provider: string;
  name: string;
  tag: string;
  best?: boolean;
}

const MODELS: Model[] = [
  { value: "soniox-stt-async-v5", provider: "Soniox", name: "v5", tag: "Best for Hebrew", best: true },
  { value: "universal-3-5-pro", provider: "AssemblyAI", name: "Universal-3.5 Pro", tag: "Strong in English" },
  { value: "universal-2", provider: "AssemblyAI", name: "Universal-2", tag: "Lower cost" },
];

// Three cards side by side from the sm breakpoint up; on phones, a stack of
// cards that fans out downward (see ModelStack).
export function ModelSelector({ value, onChange }: Props) {
  return (
    <>
      <div role="radiogroup" aria-label="Model" className="hidden sm:grid grid-cols-3 gap-2.5">
        {MODELS.map((m) => {
          const selected = m.value === value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(m.value)}
              className={`relative text-left rounded-[14px] px-3.5 pt-3.5 pb-3 border transition-all active:brightness-95 ${
                selected
                  ? "border-transparent bg-[color-mix(in_srgb,var(--accent)_12%,var(--field))] shadow-[0_0_0_1.5px_var(--accent),0_10px_30px_-14px_var(--accent)]"
                  : "bg-field border-line hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]"
              }`}
            >
              <RadioDot selected={selected} />
              <CardText model={m} selected={selected} />
            </button>
          );
        })}
      </div>
      <div className="sm:hidden">
        <ModelStack value={value} onChange={onChange} />
      </div>
    </>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={`absolute top-3 right-3 w-4 h-4 rounded-full border-[1.5px] grid place-items-center ${
        selected ? "border-accent bg-accent" : "border-line"
      }`}
    >
      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
    </span>
  );
}

function CardText({ model, selected }: { model: Model; selected: boolean }) {
  return (
    <>
      <div className="text-[11px] leading-tight font-medium text-muted">{model.provider}</div>
      <div className="text-sm leading-tight font-semibold mt-[3px] tracking-tight text-ink">{model.name}</div>
      <span
        className={`inline-block mt-2.5 text-[11px] leading-tight font-semibold px-2 py-[3px] rounded-full ${
          selected && model.best ? "accent-gradient text-white" : "bg-chip text-muted"
        }`}
      >
        {model.tag}
      </span>
    </>
  );
}

const CARD_H = 84;
const GAP = 12;
// Two card edges peek out under the chosen card while closed.
const PEEK = 12;
const TILT = [-2, 2]; // degrees: the two other cards lean opposite ways

// Phones: the chosen model sits on top of a small deck. Tapping it fans the
// other two cards out downward from behind it, each tilted the opposite way,
// and the growing height pushes the rest of the form down. Picking a card
// moves it to the top and closes the deck.
function ModelStack({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const others = MODELS.filter((m) => m.value !== value);

  // Close on a tap outside, or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const height = open ? CARD_H * 3 + GAP * 2 + 8 : CARD_H + PEEK;

  return (
    <div
      ref={rootRef}
      className="relative transition-[height] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{ height }}
    >
      {MODELS.map((m) => {
        const selected = m.value === value;
        const slot = selected ? 0 : 1 + others.indexOf(m);
        const behind = slot - 1; // 0 or 1 for the two other cards

        // The cards are see-through, like the desktop ones, so while closed a
        // card behind is clipped to the strip that peeks out below the chosen
        // card; opening releases the clip as the card slides out.
        let transform = "none";
        // No clip on the chosen card: it would cut off its outline ring.
        let clipPath = selected ? "none" : "inset(0 0 0 0 round 14px)";
        if (!selected) {
          const peek = (behind + 1) * (PEEK / 2);
          transform = open
            ? `translateY(${slot * (CARD_H + GAP)}px) rotate(${TILT[behind]}deg)`
            : `translateY(${peek}px) scaleX(${0.95 - behind * 0.04})`;
          if (!open) clipPath = `inset(${CARD_H - peek}px 0 0 0 round 0 0 14px 14px)`;
        }

        return (
          <button
            key={m.value}
            type="button"
            role={selected ? undefined : "option"}
            aria-expanded={selected ? open : undefined}
            aria-label={selected ? `Model: ${m.provider} ${m.name}. ${open ? "Close" : "Show other"} models` : undefined}
            aria-hidden={!selected && !open ? true : undefined}
            tabIndex={!selected && !open ? -1 : 0}
            onClick={() => {
              if (selected) {
                setOpen(!open);
              } else {
                onChange(m.value);
                setOpen(false);
              }
            }}
            className={`absolute inset-x-0 top-0 text-left rounded-[14px] px-3.5 pt-3.5 pb-3 border transition-[transform,clip-path,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
              selected
                ? "border-transparent bg-[color-mix(in_srgb,var(--accent)_12%,var(--field))] shadow-[0_0_0_1.5px_var(--accent),0_10px_30px_-14px_var(--accent)]"
                : `bg-field border-line ${open ? "" : "pointer-events-none"}`
            }`}
            style={{
              height: CARD_H,
              transform,
              clipPath,
              zIndex: 30 - slot * 10,
              transitionDelay: !selected && open ? `${behind * 60}ms` : "0ms",
            }}
          >
            {selected ? (
              <ChevronDown
                className={`absolute top-3 right-3 w-4 h-4 text-muted transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              />
            ) : (
              <RadioDot selected={false} />
            )}
            {/* While closed, the cards behind show only their edges. */}
            <div className={`transition-opacity duration-300 ${selected || open ? "opacity-100" : "opacity-0"}`}>
              <CardText model={m} selected={selected} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
