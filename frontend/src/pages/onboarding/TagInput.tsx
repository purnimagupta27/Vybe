import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

type TagInputProps = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

const MAX_TAGS = 30;

const inputClass =
  "w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-vybe-400 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export default function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const atLimit = values.length >= MAX_TAGS;

  function add(raw: string) {
    const value = raw.trim();
    if (!value || atLimit || values.includes(value)) return;
    onChange([...values, value]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    add(input);
    setInput("");
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (!next.includes(",")) {
      setInput(next);
      return;
    }
    const [head, ...rest] = next.split(",");
    add(head);
    setInput(rest.join(",").trimStart());
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-3 pr-1.5 text-xs text-white/80"
          >
            {value}
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove ${value}`}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={atLimit}
        placeholder={atLimit ? "Limit reached (30)" : (placeholder ?? "Add a name")}
        className={`${inputClass} ${values.length > 0 ? "mt-3" : ""}`}
      />

      <p className="mt-1.5 text-xs text-white/35">
        {atLimit ? "You can add up to 30 singers." : "Press Enter to add"}
      </p>
    </div>
  );
}
