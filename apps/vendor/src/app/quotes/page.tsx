import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { CreateQuoteForm } from '@/components/CreateQuoteForm';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function VendorQuotesPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="RFQs & quotes" subtitle="Reply to buyer inquiries with pricing.">
        <div className="card denied">Complete seller signup to receive RFQs.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const [{ data: directInquiries }, { data: broadcastLinks }, { data: quotes }] =
    await Promise.all([
      supabase
        .from('inquiries')
        .select('id, message, quantity, contact_email, created_at, product_id, is_broadcast, title')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('inquiry_suppliers')
        .select(
          'inquiry_id, status, product_id, inquiries(id, message, quantity, contact_email, created_at, title, is_broadcast)',
        )
        .eq('supplier_id', supplier.id)
        .neq('status', 'skipped_quota')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('quotes')
        .select(
          'id, inquiry_id, unit_price, quantity, status, is_sample, created_at, currency, incoterm, freight_amount, shipping_zone, destination_pincode',
        )
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  const quotedInquiryIds = new Set((quotes ?? []).map((q) => q.inquiry_id).filter(Boolean));

  type InboxRow = {
    id: string;
    message: string;
    quantity: number | null;
    contact_email: string;
    created_at: string;
    title: string | null;
    is_broadcast: boolean;
  };

  const inbox: InboxRow[] = [];
  const seen = new Set<string>();

  for (const inq of directInquiries ?? []) {
    const id = inq.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    inbox.push({
      id,
      message: inq.message as string,
      quantity: (inq.quantity as number | null) ?? null,
      contact_email: inq.contact_email as string,
      created_at: inq.created_at as string,
      title: (inq.title as string | null) ?? null,
      is_broadcast: Boolean(inq.is_broadcast),
    });
  }

  for (const link of broadcastLinks ?? []) {
    const nested = Array.isArray(link.inquiries) ? link.inquiries[0] : link.inquiries;
    if (!nested) continue;
    const id = nested.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    inbox.push({
      id,
      message: nested.message as string,
      quantity: (nested.quantity as number | null) ?? null,
      contact_email: nested.contact_email as string,
      created_at: nested.created_at as string,
      title: (nested.title as string | null) ?? null,
      is_broadcast: true,
    });
  }

  inbox.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  return (
    <VendorAuthenticated
      title="RFQs & quotes"
      subtitle="Direct product inquiries and multi-supplier RFQs. Quote → buyer accepts → order."
    >
      <h2 style={{ marginTop: '2rem', fontSize: '1.15rem' }}>Open inquiries</h2>
      {inbox.length === 0 ? (
        <p className="muted">No inquiries yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '0.75rem' }}>
          {inbox.map((inq) => {
            const alreadyQuoted = quotedInquiryIds.has(inq.id);
            return (
              <div key={inq.id} className="card">
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {String(inq.created_at).replace('T', ' ').slice(0, 19)} UTC
                  {inq.quantity != null ? ` · qty ${inq.quantity}` : ''}
                  {inq.is_broadcast ? ' · multi-supplier RFQ' : ''}
                  {alreadyQuoted ? ' · quote sent' : ''}
                </div>
                {inq.title ? <p style={{ fontWeight: 600, margin: '0.35rem 0' }}>{inq.title}</p> : null}
                <p style={{ whiteSpace: 'pre-wrap' }}>{inq.message}</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  {inq.contact_email}
                </p>
                {!alreadyQuoted ? (
                  <CreateQuoteForm inquiryId={inq.id} defaultQuantity={inq.quantity} />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ marginTop: '2rem', fontSize: '1.15rem' }}>Sent quotes</h2>
      {(quotes ?? []).length === 0 ? (
        <p className="muted">No quotes yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem' }}>
          {(quotes ?? []).map((q) => (
            <li key={q.id as string} className="card" style={{ marginBottom: '0.75rem' }}>
              <strong>{q.status as string}</strong>
              {q.is_sample ? ' · sample' : ''} · ₹{Number(q.unit_price).toLocaleString('en-IN')} ×{' '}
              {q.quantity as number} {q.currency as string}
              {q.incoterm ? (
                <span style={{ marginLeft: 8, color: '#c2410c', fontWeight: 600 }}>
                  {q.incoterm as string}
                </span>
              ) : null}
              {Number(q.freight_amount) > 0 ? (
                <span className="muted"> · freight ₹{Number(q.freight_amount).toLocaleString('en-IN')}</span>
              ) : null}
              {q.shipping_zone ? (
                <span className="muted"> · {q.shipping_zone as string} zone</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </VendorAuthenticated>
  );
}
