'use client';

import { useActionState } from 'react';
import { updateComplianceSettingsAction } from '@/lib/listing-actions';
import { BUSINESS_TYPE_OPTIONS } from '@sourcebyjay/types';
import { LocationFields } from '@/components/LocationFields';

export type ComplianceDefaults = {
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
};

export function CompliancePanel({ defaults }: { defaults: ComplianceDefaults }) {
  const [state, formAction, pending] = useActionState(updateComplianceSettingsAction, null);

  return (
    <form action={formAction} className="compliance-panel">
      <details className="compliance-details">
        <summary>Contact, location &amp; statutory (India)</summary>
        <p className="muted compliance-note">
          PAN, GSTIN, and address save directly — ops may verify separately from storefront marketing
          drafts.
        </p>

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
              Legal company name *
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
            <label className="span-2">
              Export markets (comma-separated)
              <input
                name="exportMarkets"
                defaultValue={defaults.exportMarkets ?? ''}
                placeholder="USA, UAE, UK"
              />
            </label>
          </div>
        </fieldset>

        {state?.error ? <p className="denied">{state.error}</p> : null}
        {state?.ok ? <p className="save-ok">Compliance saved.</p> : null}
        <button className="btn btn-secondary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save compliance fields'}
        </button>
      </details>
    </form>
  );
}
