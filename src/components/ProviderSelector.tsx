import type { TranscriptionProvider } from "../lib/types";

interface Props {
  value: TranscriptionProvider;
  onChange: (provider: TranscriptionProvider) => void;
}

export function ProviderSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Provider
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TranscriptionProvider)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="assemblyai">AssemblyAI</option>
        <option value="ivrit-ai">ivrit-ai (Hebrew)</option>
      </select>
    </div>
  );
}
