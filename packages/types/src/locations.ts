import { City, Country, State } from 'country-state-city';

export interface LocationOption {
  value: string;
  label: string;
  isoCode?: string;
}

function findCountry(countryName: string) {
  const q = countryName.trim();
  if (!q) return undefined;
  return Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === q.toLowerCase() || c.isoCode.toLowerCase() === q.toLowerCase(),
  );
}

function findState(countryIso: string, stateName: string) {
  const q = stateName.trim();
  if (!q) return undefined;
  return State.getStatesOfCountry(countryIso).find(
    (s) => s.name.toLowerCase() === q.toLowerCase() || s.isoCode.toLowerCase() === q.toLowerCase(),
  );
}

/** All countries — sorted A→Z for searchable pickers. */
export function listCountries(): LocationOption[] {
  return Country.getAllCountries()
    .map((c) => ({ value: c.name, label: c.name, isoCode: c.isoCode }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** States/provinces for a country name or ISO code. */
export function listStates(countryName: string): LocationOption[] {
  const country = findCountry(countryName);
  if (!country) return [];
  return State.getStatesOfCountry(country.isoCode)
    .map((s) => ({ value: s.name, label: s.name, isoCode: s.isoCode }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Cities for country + state names. */
export function listCities(countryName: string, stateName: string): LocationOption[] {
  const country = findCountry(countryName);
  if (!country) return [];
  const state = findState(country.isoCode, stateName);
  if (!state) return [];
  return City.getCitiesOfState(country.isoCode, state.isoCode)
    .map((c) => ({ value: c.name, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterLocationOptions(options: LocationOption[], query: string, limit = 80): LocationOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, limit);
}
