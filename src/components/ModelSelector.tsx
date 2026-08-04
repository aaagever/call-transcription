import type { SpeechModel } from "../lib/types";

interface Props {
  value: SpeechModel;
  onChange: (model: SpeechModel) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SpeechModel)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="universal-3-5-pro">Universal-3.5 Pro (best)</option>
        <option value="universal-2">Universal-2 (lower cost)</option>
      </select>
    </div>
  );
}
