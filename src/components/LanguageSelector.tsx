import { ChevronDown } from "lucide-react";
import { languages } from "../lib/languages";

interface Props {
  value: string;
  onChange: (code: string) => void;
  id?: string;
}

export function LanguageSelector({ value, onChange, id }: Props) {
  return (
    <div className="field-focus relative flex items-center h-11 rounded-xl bg-field border border-line transition-shadow">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full h-full pl-3 pr-9 bg-transparent border-0 outline-none text-sm text-ink cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 w-4 h-4 text-faint" />
    </div>
  );
}
