'use client';

import { useMemo, useState } from 'react';
import { listCities, listCountries, listStates } from '@sourcebyjay/types';
import { SearchableSelect } from '@/components/SearchableSelect';

export function LocationFields({
  defaultCountry = 'India',
  defaultState = '',
  defaultCity = '',
  countryRequired = true,
  stateRequired = true,
  cityRequired = true,
}: {
  defaultCountry?: string;
  defaultState?: string;
  defaultCity?: string;
  countryRequired?: boolean;
  stateRequired?: boolean;
  cityRequired?: boolean;
}) {
  const countries = useMemo(() => listCountries(), []);
  const [country, setCountry] = useState(defaultCountry);
  const [state, setState] = useState(defaultState);

  const states = useMemo(() => listStates(country), [country]);
  const cities = useMemo(() => listCities(country, state), [country, state]);

  return (
    <>
      <SearchableSelect
        name="country"
        label={`Country${countryRequired ? ' *' : ''}`}
        options={countries}
        defaultValue={defaultCountry}
        required={countryRequired}
        onValueChange={(v) => {
          setCountry(v);
          setState('');
        }}
      />
      <SearchableSelect
        name="state"
        label={`State / province${stateRequired ? ' *' : ''}`}
        options={states}
        defaultValue={defaultState}
        required={stateRequired}
        placeholder={states.length ? 'Type state…' : 'Pick country first'}
        onValueChange={setState}
      />
      <SearchableSelect
        name="city"
        label={`City${cityRequired ? ' *' : ''}`}
        options={cities}
        defaultValue={defaultCity}
        required={cityRequired}
        placeholder={cities.length ? 'Type city…' : state ? 'Type city…' : 'Pick state first'}
      />
    </>
  );
}
