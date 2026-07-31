"use client";

import { useState } from "react";

type CountedTextareaProps = {
  name: string;
  defaultValue: string;
  maxLength: number;
  required?: boolean;
};

export function CountedTextarea({ name, defaultValue, maxLength, required = false }: CountedTextareaProps) {
  const [length, setLength] = useState(defaultValue.length);
  const remaining = maxLength - length;

  return (
    <>
      <textarea
        className="input min-h-28"
        name={name}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required={required}
        onInput={(event) => setLength(event.currentTarget.value.length)}
      />
      <span className={`text-xs font-semibold ${remaining <= Math.min(50, maxLength * 0.1) ? "text-red-700" : "text-stone-500"}`} aria-live="polite">
        {length.toLocaleString()} / {maxLength.toLocaleString()} characters
      </span>
    </>
  );
}
