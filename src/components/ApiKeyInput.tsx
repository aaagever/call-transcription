import { useState, useEffect } from "react";

const STORAGE_KEY = "assemblyai-api-key";

interface Props {
  onKeyChange: (key: string) => void;
}

export function ApiKeyInput({ onKeyChange }: Props) {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setKey(stored);
      setSaved(true);
      onKeyChange(stored);
    }
  }, [onKeyChange]);

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, key);
    onKeyChange(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleChange(value: string) {
    setKey(value);
    setSaved(false);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        AssemblyAI API Key
      </label>
      <div className="relative flex-1">
        <input
          type={visible ? "text" : "password"}
          value={key}
          onChange={(e) => handleChange(e.target.value)}
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
        disabled={!key}
        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 text-white hover:bg-gray-900"
      >
        {saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
