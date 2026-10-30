import type { SpeechModel } from "../lib/types";

interface Props {
  value: SpeechModel;
  onChange: (model: SpeechModel) => void;
}

const MODELS: { value: SpeechModel; provider: string; name: string; tag: string; best?: boolean }[] = [
  { value: "soniox-stt-async-v5", provider: "Soniox", name: "v5", tag: "Best for Hebrew", best: true },
  { value: "universal-3-5-pro", provider: "AssemblyAI", name: "Universal-3.5 Pro", tag: "Strong in English" },
  { value: "universal-2", provider: "AssemblyAI", name: "Universal-2", tag: "Lower cost" },
];

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Model" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {MODELS.map((m) => {
        const selected = m.value === value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(m.value)}
            className={`relative text-left rounded-[14px] px-3.5 pt-3.5 pb-3 border transition-all hover:-translate-y-px ${
              selected
                ? "border-transparent bg-[color-mix(in_srgb,var(--accent)_12%,var(--field))] shadow-[0_0_0_1.5px_var(--accent),0_10px_30px_-14px_var(--accent)]"
                : "bg-field border-line hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]"
            }`}
          >
            <span
              className={`absolute top-3 right-3 w-4 h-4 rounded-full border-[1.5px] grid place-items-center ${
                selected ? "border-accent bg-accent" : "border-line"
              }`}
            >
              {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <div className="text-[11px] leading-tight font-medium text-muted">{m.provider}</div>
            <div className="text-sm leading-tight font-semibold mt-[3px] tracking-tight text-ink">{m.name}</div>
            <span
              className={`inline-block mt-2.5 text-[11px] leading-tight font-semibold px-2 py-[3px] rounded-full ${
                selected && m.best ? "accent-gradient text-white" : "bg-chip text-muted"
              }`}
            >
              {m.tag}
            </span>
          </button>
        );
      })}
    </div>
  );
}
