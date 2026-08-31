'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  listCities,
  listCountries,
  listStates,
  type LocationOption,
} from '@sourcebyjay/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function LocationCombobox({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  options: LocationOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value || placeholder || 'Select…'}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder ?? 'Type to search…'} />
            <CommandList>
              <CommandEmpty>No match.</CommandEmpty>
              <CommandGroup>
                {options.slice(0, 150).map((opt) => (
                  <CommandItem
                    key={`${opt.value}-${opt.isoCode ?? ''}`}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 size-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" name={id} value={value} required={required} />
    </div>
  );
}

export function LocationFields({
  defaultCountry = 'India',
  defaultState = '',
  defaultCity = '',
  countryRequired,
  stateRequired,
  cityRequired,
  onCountryChange,
  onStateChange,
  onCityChange,
}: {
  defaultCountry?: string;
  defaultState?: string;
  defaultCity?: string;
  countryRequired?: boolean;
  stateRequired?: boolean;
  cityRequired?: boolean;
  onCountryChange?: (value: string) => void;
  onStateChange?: (value: string) => void;
  onCityChange?: (value: string) => void;
}) {
  const countries = useMemo(() => listCountries(), []);
  const [country, setCountry] = useState(defaultCountry);
  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);

  const states = useMemo(() => listStates(country), [country]);
  const cities = useMemo(() => listCities(country, state), [country, state]);

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:col-span-2">
      <LocationCombobox
        id="country"
        label="Country"
        options={countries}
        value={country}
        onChange={(v) => {
          setCountry(v);
          setState('');
          setCity('');
          onCountryChange?.(v);
        }}
        required={countryRequired}
        placeholder="Type country…"
      />
      <LocationCombobox
        id="state"
        label="State / province"
        options={states}
        value={state}
        onChange={(v) => {
          setState(v);
          setCity('');
          onStateChange?.(v);
        }}
        required={stateRequired}
        placeholder={states.length ? 'Type state…' : 'Pick country first'}
      />
      <LocationCombobox
        id="city"
        label="City"
        options={cities}
        value={city}
        onChange={(v) => {
          setCity(v);
          onCityChange?.(v);
        }}
        required={cityRequired}
        placeholder={cities.length ? 'Type city…' : 'Pick state first'}
      />
    </div>
  );
}
