import React, { useState } from "react";

interface ScoreInputProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

function sanitizeScoreValue(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 2);
  if (digitsOnly === "") {
    return "";
  }
  return String(Math.min(Number(digitsOnly), 99));
}

const ScoreInput: React.FC<ScoreInputProps> = ({
  value,
  onChange,
  ariaLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const currentNumericValue = value === "" ? null : Number(value);

  const updateValue = (nextValue: number) => {
    onChange(String(Math.max(0, Math.min(99, nextValue))));
  };

  return (
    <div className="relative shrink-0">
      <input
        aria-label={ariaLabel}
        className="w-12 rounded-lg border border-slate-300 px-1 py-1 text-center shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:w-14"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{1,2}"
        maxLength={2}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(sanitizeScoreValue(event.target.value))}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 transition-all ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label={`${ariaLabel} aumentar`}
          className={`pointer-events-auto absolute -top-3 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-white text-sm font-bold text-emerald-700 shadow-md transition hover:bg-emerald-50 ${
            isFocused ? "scale-100" : "scale-90"
          }`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => updateValue((currentNumericValue ?? 0) + 1)}
        >
          +
        </button>
        <button
          type="button"
          aria-label={`${ariaLabel} diminuir`}
          className={`pointer-events-auto absolute -bottom-3 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-50 ${
            isFocused ? "scale-100" : "scale-90"
          }`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            updateValue(currentNumericValue == null ? 0 : currentNumericValue - 1)
          }
        >
          -
        </button>
      </div>
    </div>
  );
};

export default ScoreInput;
