"use client";

/**
 * Segmented control (radiogroup). Two selection styles:
 *
 * - default: selected = accent-subtle fill + accent text (the app-wide
 *   "selected" grammar).
 * - toned options (the check-in status control): selected = a SOLID fill
 *   in the option's meaning color. verde=safe, ambra=caution, and signal
 *   for "help" — the one non-plate solid red, because tapping toward help
 *   is a genuine emergency path.
 */

type Tone = "verde" | "ambra" | "signal";

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: string;
  tone?: Tone;
};

const SELECTED_TONE: Record<Tone, string> = {
  verde: "border-verde bg-verde text-white",
  ambra: "border-ambra bg-ambra text-white",
  signal: "border-signal bg-signal text-white",
};

export default function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  className = "",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Accessible name for the radiogroup. */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const selectedClasses = option.tone
          ? SELECTED_TONE[option.tone]
          : "border-accent bg-accent-subtle text-accent-deep";
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`min-h-control rounded-xl border-2 px-2 text-callout font-bold transition-colors duration-150 ease-out disabled:border-default disabled:bg-sunken disabled:text-tertiary ${
              selected ? selectedClasses : "border-default bg-card text-secondary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
