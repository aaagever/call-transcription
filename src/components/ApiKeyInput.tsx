import { useState, useEffect } from "react";
import type { TranscriptionProvider } from "../lib/types";

const STORAGE_KEYS: Record<TranscriptionProvider, string> = {
  "assemblyai": "assemblyai-api-key",
  "ivrit-ai": "runpod-api-key",
};

const LABELS: Record<TranscriptionProvider, string> = {
  "assemblyai": "AssemblyAI API Key",
  "ivrit-ai": "RunPod API Key",
};

function readStoredKey(provider: TranscriptionProvider): string {
  return localStorage.getItem(STORAGE_KEYS[provider]) ?? "";
}

interface Props {
  provider: TranscriptionProvider;
  onKeyChange: (key: string) => void;
}

// Renders with key={provider} in App, so a provider switch remounts it and
// re-reads that provider's stored key.
export function ApiKeyInput({ provider, onKeyChange }: Props) {
  // What is saved in localStorage, and what is currently in the field.
  const [storedKey, setStoredKey] = useState(() => readStoredKey(provider));
  const [key, setKey] = useState(storedKey);
  const [visible, setVisible] = useState(false);

  // Tell the parent which key is in effect on mount.
  useEffect(() => {
    onKeyChange(readStoredKey(provider));
  }, [provider, onKeyChange]);

  // Nothing to save while the field matches what is already stored.
  const isSaved = key !== "" && key === storedKey;
  const canSave = key !== "" && !isSaved;

  function handleSave() {
    if (!canSave) return;
    localStorage.setItem(STORAGE_KEYS[provider], key);
    setStoredKey(key);
    onKeyChange(key);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        {LABELS[provider]}
      </label>
      <div className="relative flex-1">
        <input
          type={visible ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          placeholder="Enter your API key"
          className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        title={isSaved ? "This key is saved. Edit it to save a different one." : undefined}
        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 text-white hover:bg-gray-900"
      >
        {isSaved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
