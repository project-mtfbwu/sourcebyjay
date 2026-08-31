import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { CompliancePanel } from '@/components/CompliancePanel';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function VendorSettingsPage() {
  const { user, profile, supplier } = await getSessionProfile();

  const supabase = await createClient();
  const [{ data: supplierRow }, { data: profileRow }] = await Promise.all([
    supplier?.id
      ? supabase
          .from('suppliers')
          .select('name, country, city, state, pincode, pan, business_type, msme_udhyam, export_markets')
          .eq('id', supplier.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('profiles')
          .select('full_name, phone, gstin, company_name')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <VendorAuthenticated
      title="Company settings"
      subtitle="Statutory & location — uniform across the platform. Marketing (banner, logo, about) lives on Storefront."
    >
      {!supplierRow ? (
        <div className="card denied">
          No supplier company yet. Complete <Link href="/signup">seller signup</Link> first.
        </div>
      ) : (
        <CompliancePanel
          defaults={{
            fullName: profileRow?.full_name ?? profile?.fullName,
            phone: profileRow?.phone,
            gstin: profileRow?.gstin,
            pan: supplierRow.pan,
            state: supplierRow.state,
            pincode: supplierRow.pincode,
            businessType: supplierRow.business_type,
            msmeUdhyam: supplierRow.msme_udhyam,
            exportMarkets: Array.isArray(supplierRow.export_markets)
              ? (supplierRow.export_markets as string[]).join(', ')
              : '',
            name: supplierRow.name,
            country: supplierRow.country,
            city: supplierRow.city,
          }}
        />
      )}
      <p className="muted" style={{ marginTop: '1rem' }}>
        <Link href="/storefront">Storefront marketing editor →</Link>
        {' · '}
        <Link href="/plans">Listing plans →</Link>
      </p>
    </VendorAuthenticated>
  );
}
