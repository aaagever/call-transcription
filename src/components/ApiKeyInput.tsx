import { useState, useEffect } from "react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import type { TranscriptionProvider } from "../lib/types";

const STORAGE_KEYS: Record<TranscriptionProvider, string> = {
  "assemblyai": "assemblyai-api-key",
  "soniox": "soniox-api-key",
  "ivrit-ai": "runpod-api-key",
};

const LABELS: Record<TranscriptionProvider, string> = {
  "assemblyai": "AssemblyAI key",
  "soniox": "Soniox key",
  "ivrit-ai": "RunPod key",
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
    <div className="field-focus flex items-center gap-2.5 h-11 pl-3 pr-1.5 rounded-xl bg-field border border-line transition-shadow">
      <Lock className="w-4 h-4 text-faint shrink-0" strokeWidth={2} />
      <label htmlFor="api-key" className="text-[13px] text-muted whitespace-nowrap">
        {LABELS[provider]}
      </label>
      <input
        id="api-key"
        type={visible ? "text" : "password"}
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        placeholder="Paste your API key"
        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-ink placeholder:text-faint"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide key" : "Show key"}
        title={visible ? "Hide key" : "Show key"}
        className="p-1.5 rounded-md text-faint hover:text-ink"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      {isSaved ? (
        <span
          title="This key is saved. Edit it to save a different one."
          className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-ok whitespace-nowrap"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
          Saved
        </span>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-8 px-3 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed accent-gradient text-white"
        >
          Save
        </button>
      )}
    </div>
  );
}
