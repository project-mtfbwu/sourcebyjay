'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAdCampaignAction } from '@/lib/ad-actions';

export function NewAdCampaignForm({
  products,
}: {
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card"
      style={{ marginTop: '1rem', maxWidth: 640 }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await createAdCampaignAction(fd);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          router.push(`/advertising/${result.id}`);
          router.refresh();
        });
      }}
    >
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Campaign name
        <input name="name" required minLength={2} style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Billing model
        <select name="billingModel" defaultValue="cpc" style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="cpc">CPC — pay per click (search)</option>
          <option value="cpm">CPM — pay per impression (display)</option>
          <option value="sponsorship">Sponsorship — flat daily burn</option>
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Product
        <select name="productId" required style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="">Pick a published listing</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>

      <fieldset style={{ marginBottom: '0.75rem', border: '1px solid var(--crm-border)', padding: '0.75rem' }}>
        <legend>Placements</legend>
        {[
          ['search_results_top', 'Search results (top sponsored row)'],
          ['search_sidebar', 'Search sidebar'],
          ['home_featured', 'Home featured carousel'],
          ['category_banner', 'Category banner'],
          ['supplier_spotlight', 'Supplier spotlight'],
        ].map(([id, label]) => (
          <label key={id} style={{ display: 'block', marginBottom: 4 }}>
            <input type="checkbox" name={`placement_${id}`} defaultChecked={id === 'search_results_top'} /> {label}
          </label>
        ))}
      </fieldset>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Keywords (CPC only, comma-separated)
        <input name="keywords" placeholder="earbuds, bluetooth, wireless" style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Headline override (optional)
        <input name="headlineOverride" style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Max CPC bid (₹)
        <input name="maxCpcBidInr" type="number" min={0.01} step={0.01} defaultValue={5} style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        CPM rate (₹ per impression)
        <input name="cpmRateInr" type="number" min={0.01} step={0.01} defaultValue={1} style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Sponsorship daily burn (₹)
        <input name="sponsorshipDailyInr" type="number" min={1} step={1} defaultValue={100} style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Daily budget (₹, 0 = unlimited)
        <input name="dailyBudgetInr" type="number" min={0} step={1} defaultValue={500} style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Total budget (₹, optional)
        <input name="totalBudgetInr" type="number" min={0} step={1} style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Category hint (optional slug)
        <input name="categoryHint" placeholder="electronics" style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>

      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Launch campaign (TEST MODE)'}
      </button>
      <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
        Wallet must have test credit. Charges are simulated — no real payment.
      </p>
    </form>
  );
}
