'use client';

import { useActionState } from 'react';
import { updateCompanySettingsAction } from '@/lib/listing-actions';
import { BUSINESS_TYPE_OPTIONS } from '@sourcebyjay/types';
import { LocationFields } from '@/components/LocationFields';

type Defaults = {
  fullName?: string | null;
  phone?: string | null;
  gstin?: string | null;
  pan?: string | null;
  name: string;
  country: string;
  city: string;
  state?: string | null;
  pincode?: string | null;
  businessType?: string | null;
  msmeUdhyam?: string | null;
  exportMarkets?: string | null;
  mainProducts: string;
  description: string;
  yearsInBusiness: number;
  employeeCountBand?: string | null;
  bannerUrl?: string | null;
};

const EMPLOYEE_BANDS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

export function CompanySettingsForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState(updateCompanySettingsAction, null);

  return (
    <form action={formAction} className="card form-section-card">
      <div>
        <h2 style={{ margin: '0 0 0.35rem' }}>Company profile</h2>
        <p className="muted" style={{ margin: 0 }}>
          IndiaMART statutory + Alibaba company depth — buyers and ops see this on your storefront.
        </p>
      </div>

      <fieldset className="form-section">
        <legend>Contact</legend>
        <div className="form-grid">
          <label>
            Contact name
            <input name="fullName" defaultValue={defaults.fullName ?? ''} />
          </label>
          <label>
            Phone (required)
            <input name="phone" required defaultValue={defaults.phone ?? ''} placeholder="+91…" />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Statutory (India)</legend>
        <div className="form-grid">
          <label>
            GSTIN
            <input name="gstin" defaultValue={defaults.gstin ?? ''} placeholder="22AAAAA0000A1Z5" />
          </label>
          <label>
            PAN *
            <input
              name="pan"
              required
              defaultValue={defaults.pan ?? ''}
              placeholder="AAAAA9999A"
              pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
              title="5 letters, 4 digits, 1 letter"
            />
          </label>
          <label className="span-2">
            MSME / Udyam (optional)
            <input name="msmeUdhyam" defaultValue={defaults.msmeUdhyam ?? ''} placeholder="UDYAM-XX-00-0000000" />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Location</legend>
        <div className="form-grid">
          <label>
            Company name *
            <input name="name" required defaultValue={defaults.name} />
          </label>
          <label>
            Business type *
            <select name="businessType" required defaultValue={defaults.businessType ?? 'manufacturer'}>
              {BUSINESS_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t === 'both' ? 'Manufacturer & trader' : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <LocationFields
            defaultCountry={defaults.country}
            defaultState={defaults.state ?? ''}
            defaultCity={defaults.city}
          />
          <label>
            PIN code *
            <input
              name="pincode"
              required
              defaultValue={defaults.pincode ?? ''}
              placeholder="400001"
              pattern="[0-9]{6}"
              title="6-digit India PIN"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Storefront</legend>
        <div className="form-grid">
          <label className="span-2">
            Banner image URL
            <input
              name="bannerUrl"
              type="url"
              defaultValue={defaults.bannerUrl ?? ''}
              placeholder="https://… (wide factory or team photo)"
            />
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              Public https URL — shown at the top of your factory page. Ops may review changes.
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Business</legend>
        <div className="form-grid">
          <label>
            Employees (band)
            <select name="employeeCountBand" defaultValue={defaults.employeeCountBand ?? ''}>
              <option value="">—</option>
              {EMPLOYEE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label>
            Years in business
            <input
              name="yearsInBusiness"
              type="number"
              min={0}
              defaultValue={defaults.yearsInBusiness}
            />
          </label>
          <label className="span-2">
            Export markets (comma-separated countries)
            <input
              name="exportMarkets"
              defaultValue={defaults.exportMarkets ?? ''}
              placeholder="USA, UAE, UK"
            />
          </label>
          <label className="span-2">
            Main products *
            <input name="mainProducts" required defaultValue={defaults.mainProducts} />
          </label>
          <label className="span-2">
            Company description
            <textarea name="description" rows={4} defaultValue={defaults.description} />
          </label>
        </div>
      </fieldset>

      {state?.error ? <p className="denied">{state.error}</p> : null}
      {state?.ok ? <p style={{ margin: 0, color: 'var(--accent)' }}>Saved.</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save company profile'}
      </button>
    </form>
  );
}
