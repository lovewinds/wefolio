import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-ink-muted">{label}</label>}
        <input
          ref={ref}
          className={`rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${error ? 'border-loss focus:border-loss focus:ring-loss' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-loss">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
