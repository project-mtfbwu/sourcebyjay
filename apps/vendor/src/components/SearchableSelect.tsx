'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { filterLocationOptions, type LocationOption } from '@sourcebyjay/types';

export function SearchableSelect({
  name,
  label,
  options,
  defaultValue = '',
  required,
  placeholder = 'Type to search…',
  onValueChange,
}: {
  name: string;
  label: string;
  options: LocationOption[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultValue);
  const [value, setValue] = useState(defaultValue);

  const filtered = useMemo(() => filterLocationOptions(options, query), [options, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(option: LocationOption) {
    setValue(option.value);
    setQuery(option.label);
    setOpen(false);
    onValueChange?.(option.value);
  }

  return (
    <label className="searchable-field">
      {label}
      <input type="hidden" name={name} value={value} required={required} />
      <div className="searchable-select" ref={rootRef}>
        <input
          type="text"
          className="searchable-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setValue(e.target.value);
            setOpen(true);
            onValueChange?.(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        />
        {open && filtered.length > 0 ? (
          <ul id={listId} className="searchable-list" role="listbox">
            {filtered.map((opt) => (
              <li key={`${opt.value}-${opt.isoCode ?? ''}`}>
                <button type="button" role="option" onMouseDown={() => pick(opt)}>
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </label>
  );
}
