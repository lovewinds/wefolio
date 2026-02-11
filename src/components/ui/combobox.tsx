'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { matchHangul } from '@/lib/hangul-utils';

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
  sublabel?: string;
}

export interface ComboboxOptionGroup {
  label: string;
  options: ComboboxOption[];
}

export interface ComboboxHandle {
  focus: () => void;
}

interface ComboboxProps {
  options?: ComboboxOption[];
  groupedOptions?: ComboboxOptionGroup[];
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const Combobox = forwardRef<ComboboxHandle, ComboboxProps>(
  ({ options, groupedOptions, value, onChange, onConfirm, placeholder, autoFocus }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const listboxId = useId();
    const [inputText, setInputText] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    // Flatten all options for filtering and keyboard navigation
    const allOptions = useMemo(() => {
      if (options) return options;
      if (groupedOptions) return groupedOptions.flatMap(g => g.options);
      return [];
    }, [options, groupedOptions]);

    // Filter options based on input text
    const filtered = useMemo(() => {
      if (!inputText) return allOptions;
      return allOptions.filter(
        opt =>
          matchHangul(opt.label, inputText) ||
          (opt.icon && matchHangul(opt.icon + opt.label, inputText))
      );
    }, [allOptions, inputText]);

    // Build grouped filtered list for display
    const filteredGroups = useMemo(() => {
      if (!groupedOptions) return null;
      const filteredSet = new Set(filtered.map(o => o.value));
      return groupedOptions
        .map(g => ({
          ...g,
          options: g.options.filter(o => filteredSet.has(o.value)),
        }))
        .filter(g => g.options.length > 0);
    }, [groupedOptions, filtered]);

    // Sync display text when value changes externally
    useEffect(() => {
      if (value) {
        const found = allOptions.find(o => o.value === value);
        if (found) {
          const display = found.icon ? `${found.icon} ${found.label}` : found.label;
          setInputText(display);
        }
      } else {
        setInputText('');
      }
    }, [value, allOptions]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (!isOpen || !listRef.current) return;
      const items = listRef.current.querySelectorAll('[data-combobox-option]');
      const item = items[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex, isOpen]);

    const selectOption = useCallback(
      (opt: ComboboxOption) => {
        onChange(opt.value);
        const display = opt.icon ? `${opt.icon} ${opt.label}` : opt.label;
        setInputText(display);
        setIsOpen(false);
        onConfirm?.();
      },
      [onChange, onConfirm]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Skip during IME composition
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(0);
          } else {
            setHighlightedIndex(prev => (prev + 1) % filtered.length);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (isOpen && filtered[highlightedIndex]) {
            selectOption(filtered[highlightedIndex]);
          } else if (!isOpen && !value) {
            // Enter on empty = skip
            onConfirm?.();
          }
        } else if (e.key === 'Tab') {
          if (isOpen && filtered[highlightedIndex]) {
            e.preventDefault();
            selectOption(filtered[highlightedIndex]);
          } else if (!value) {
            // Tab on empty = skip
            onConfirm?.();
          }
        } else if (e.key === 'Escape') {
          setIsOpen(false);
        }
      },
      [isOpen, filtered, highlightedIndex, selectOption, onConfirm, value]
    );

    // Click outside to close
    useEffect(() => {
      if (!isOpen) return;
      function handleClickOutside(e: MouseEvent) {
        const input = inputRef.current;
        const list = listRef.current;
        if (
          input &&
          !input.contains(e.target as Node) &&
          list &&
          !list.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const renderOptions = () => {
      if (filtered.length === 0) {
        return (
          <li className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500">검색 결과 없음</li>
        );
      }

      if (filteredGroups) {
        let flatIdx = 0;
        return filteredGroups.map(group => (
          <li key={group.label}>
            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase dark:text-zinc-500">
              {group.label}
            </div>
            <ul>
              {group.options.map(opt => {
                const idx = flatIdx++;
                return (
                  <li
                    key={opt.value}
                    data-combobox-option
                    role="option"
                    aria-selected={idx === highlightedIndex}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      idx === highlightedIndex
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700/50'
                    }`}
                    onMouseDown={e => {
                      e.preventDefault();
                      selectOption(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    {opt.icon && <span className="mr-1.5">{opt.icon}</span>}
                    {opt.label}
                    {opt.sublabel && (
                      <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                        {opt.sublabel}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ));
      }

      return filtered.map((opt, idx) => (
        <li
          key={opt.value}
          data-combobox-option
          role="option"
          aria-selected={idx === highlightedIndex}
          className={`cursor-pointer px-3 py-2 text-sm ${
            idx === highlightedIndex
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700/50'
          }`}
          onMouseDown={e => {
            e.preventDefault();
            selectOption(opt);
          }}
          onMouseEnter={() => setHighlightedIndex(idx)}
        >
          {opt.icon && <span className="mr-1.5">{opt.icon}</span>}
          {opt.label}
          {opt.sublabel && (
            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">{opt.sublabel}</span>
          )}
        </li>
      ));
    };

    return (
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-lg text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          onChange={e => {
            setInputText(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
            // Clear value when user types
            if (value) onChange('');
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
        {isOpen && (
          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          >
            {renderOptions()}
          </ul>
        )}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';
