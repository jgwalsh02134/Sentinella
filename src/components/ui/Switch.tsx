"use client";

/**
 * The one toggle. 44px+ tap target around a 52×32 track; state is color
 * plus knob position, and the owning row's label carries the meaning.
 */
export default function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name — the visible row label repeated for the control. */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl disabled:text-tertiary"
    >
      <span
        aria-hidden="true"
        className={`relative h-8 w-[3.25rem] rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none ${
          checked ? "bg-verde" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full border border-default bg-card transition-transform duration-150 ease-out motion-reduce:transition-none ${
            checked ? "translate-x-[1.5rem]" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
