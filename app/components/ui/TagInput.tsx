import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface InputTextTagProps {
  text: string;
  onRemove: () => void;
}

export function InputTextTag({ text, onRemove }: InputTextTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F5F6] border border-[#D7DCE0] px-2.5 py-1 text-sm text-[#111827]">
      {text}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex text-neutral-500 hover:text-neutral-700"
        aria-label={`Remove ${text}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Type and press Enter" }: TagInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, "");
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInput("");
      }
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    const trimmed = input.trim().replace(/,$/, "");
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    const trimmed = input.trim().replace(/,$/, "");
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  return (
    <div
      className="rounded-2xl border border-neutral-200 w-full px-3 py-2 flex flex-wrap gap-2 cursor-text bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100 min-h-[42px]"
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('tag-container')) {
          const input = e.currentTarget.querySelector('input');
          input?.focus();
        }
      }}
    >
      <div className="flex flex-wrap gap-2 items-center flex-1 tag-container">
        {value.map((name, idx) => (
          <InputTextTag
            key={`${name}-${idx}`}
            text={name}
            onRemove={() => handleRemove(idx)}
          />
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[150px] bg-transparent outline-none text-base text-[#111827] placeholder:text-gray-400"
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!input.trim()}
        className="ml-auto disabled:opacity-40 disabled:cursor-not-allowed text-[#7B00D4] hover:text-[#6A00B8]"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
