import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  groupedOptions?: SelectOptionGroup[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, groupedOptions, error, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-ink-muted">{label}</label>}
        <select
          ref={ref}
          className={`rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${error ? 'border-loss focus:border-loss focus:ring-loss' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {groupedOptions
            ? groupedOptions.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))
            : options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
        </select>
        {error && <p className="text-sm text-loss">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
