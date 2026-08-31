import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { AdWalletTopUpButton } from '@/components/AdWalletTopUpButton';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function AdWalletPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Ad wallet" subtitle="TEST MODE credits for campaigns.">
        <div className="card denied">Complete seller signup first.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  await supabase.rpc('ensure_ad_wallet', { p_supplier_id: supplier.id });

  const [{ data: wallet }, { data: txs }] = await Promise.all([
    supabase.from('ad_wallets').select('balance_inr_cents, updated_at').eq('supplier_id', supplier.id).maybeSingle(),
    supabase
      .from('ad_wallet_transactions')
      .select('id, amount_inr_cents, tx_type, balance_after_inr_cents, note, created_at, ad_invoice_id')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <VendorAuthenticated title="Ad wallet" subtitle="Fake top-ups and campaign charges. TEST MODE only.">
      <p style={{ marginTop: '1rem' }}>
        <Link href="/advertising">← Advertising</Link>
      </p>

      <div className="card" style={{ marginTop: '1rem' }}>
        <p className="kpi">{formatInr(Number(wallet?.balance_inr_cents ?? 0))}</p>
        <p className="muted">Updated {wallet?.updated_at ? String(wallet.updated_at).slice(0, 19) : '—'}</p>
        <AdWalletTopUpButton />
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
        {(txs ?? []).map((tx) => (
          <div key={tx.id as string} className="card">
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              {String(tx.created_at).slice(0, 19)} · {tx.tx_type as string}
            </div>
            <div>
              {Number(tx.amount_inr_cents) >= 0 ? '+' : ''}
              {formatInr(Number(tx.amount_inr_cents))} → balance{' '}
              {formatInr(Number(tx.balance_after_inr_cents))}
            </div>
            {tx.note ? <p className="muted">{tx.note as string}</p> : null}
            {tx.ad_invoice_id ? (
              <Link href={`/advertising/invoices/${tx.ad_invoice_id}`}>View receipt →</Link>
            ) : null}
          </div>
        ))}
      </div>
    </VendorAuthenticated>
  );
}
