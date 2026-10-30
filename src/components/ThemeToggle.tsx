import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeChoice = "light" | "system" | "dark";

const STORAGE_KEY = "theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");

function readChoice(): ThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && media.matches);
  document.documentElement.dataset.look = dark ? "dark" : "light";
}

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "Match system", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

// Light, dark, or follow the Mac's setting (the default). The choice is
// remembered; index.html applies it before the first paint.
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice);

  useEffect(() => {
    apply(choice);
    if (choice !== "system") return;
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  function pick(next: ThemeChoice) {
    localStorage.setItem(STORAGE_KEY, next);
    setChoice(next);
  }

  return (
    <div role="radiogroup" aria-label="Theme" className="flex gap-0.5 p-[3px] rounded-full bg-chip border border-line">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          title={label}
          onClick={() => pick(value)}
          className={`w-[30px] h-[30px] rounded-full grid place-items-center transition-colors ${
            choice === value ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <Icon className="w-[15px] h-[15px]" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
