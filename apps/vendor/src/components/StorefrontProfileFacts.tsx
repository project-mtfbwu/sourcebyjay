export type StorefrontProfileFacts = {
  name: string;
  city: string;
  country: string;
  state?: string | null;
  gstin?: string | null;
  pan?: string | null;
  msmeUdhyam?: string | null;
  yearsInBusiness: number;
  employeeCountBand?: string | null;
  responseRate: string;
  listingCount: number;
  certificateCount: number;
};

export function StorefrontProfileFacts({ facts }: { facts: StorefrontProfileFacts }) {
  return (
    <div className="storefront-profile-facts card">
      <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>Company profile (read-only)</h3>
      <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.82rem' }}>
        Uniform company data from your verified seller profile — edit statutory fields in{' '}
        <a href="/settings">Company settings</a>. Years, response rate, and listing count are
        auto-calculated.
      </p>
      <dl className="storefront-facts-grid">
        <div>
          <dt>Company name</dt>
          <dd>{facts.name}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>
            {facts.city}, {facts.state ? `${facts.state}, ` : ''}
            {facts.country}
          </dd>
        </div>
        <div>
          <dt>GSTIN</dt>
          <dd>{facts.gstin || '—'}</dd>
        </div>
        <div>
          <dt>PAN</dt>
          <dd>{facts.pan || '—'}</dd>
        </div>
        <div>
          <dt>MSME / Udyam</dt>
          <dd>{facts.msmeUdhyam || '—'}</dd>
        </div>
        <div>
          <dt>Years in business</dt>
          <dd>{facts.yearsInBusiness}+ (ops / docs)</dd>
        </div>
        <div>
          <dt>Employees</dt>
          <dd>{facts.employeeCountBand || '—'}</dd>
        </div>
        <div>
          <dt>Response rate</dt>
          <dd>{facts.responseRate} (from chat speed)</dd>
        </div>
        <div>
          <dt>Published listings</dt>
          <dd>{facts.listingCount} products</dd>
        </div>
        <div>
          <dt>Certificates on file</dt>
          <dd>{facts.certificateCount}</dd>
        </div>
      </dl>
    </div>
  );
}
