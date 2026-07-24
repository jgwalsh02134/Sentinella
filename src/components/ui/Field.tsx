import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * System form controls. All text sits at text-body (17px) so iOS never
 * zooms the viewport on focus; radius is the input radius (12px); focus
 * is the one global ring — no per-control focus styling.
 */

const CONTROL_CLASSES =
  "w-full rounded-xl border border-default bg-card px-4 text-body text-primary placeholder:text-tertiary disabled:bg-sunken disabled:text-tertiary";

/** Label + control + optional hint, wired together for screen readers. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint ? <span className="mt-1 block text-footnote text-secondary">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`min-h-control ${CONTROL_CLASSES} ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return <textarea ref={ref} className={`py-3 ${CONTROL_CLASSES} ${className}`} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", ...props }, ref) {
    return (
      <select ref={ref} className={`min-h-control ${CONTROL_CLASSES} ${className}`} {...props} />
    );
  },
);

/** Inline error under a field or form — signal TEXT, never a red fill. */
export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-callout font-medium text-danger">
      {children}
    </p>
  );
}
