import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onClear, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    // merge the forwarded ref with our internal ref
    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    const hasValue =
      typeof props.value === "string"
        ? props.value.length > 0
        : props.defaultValue !== undefined;

    const showClear = Boolean(onClear && hasValue);

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onClear?.();
      // re-focus the input after clearing
      requestAnimationFrame(() => {
        internalRef.current?.focus();
      });
    };

    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
            showClear && "pr-7",
            className
          )}
          ref={setRef}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={handleClear}
            className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
            aria-label="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
