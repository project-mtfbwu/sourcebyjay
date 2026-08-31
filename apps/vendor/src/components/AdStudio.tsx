'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAdCampaignAction } from '@/lib/ad-actions';
import { AdLivePreview, type AdPreviewCreative } from '@/components/AdLivePreview';

const PLACEMENTS = [
  { id: 'search_results_top', label: 'Search top', hint: 'CPC row above organic results' },
  { id: 'search_sidebar', label: 'Search sidebar', hint: 'Right rail on search' },
  { id: 'home_featured', label: 'Home carousel', hint: 'Sponsored picks on homepage' },
  { id: 'category_banner', label: 'Category banner', hint: 'Wide banner on category pages' },
  { id: 'supplier_spotlight', label: 'Supplier spotlight', hint: 'Brand spotlight strip' },
] as const;

type ProductOption = { id: string; title: string; imageUrl?: string | null; price?: number | null };

export function AdStudio({
  products,
  supplierName,
}: {
  products: ProductOption[];
  supplierName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [format, setFormat] = useState<'text' | 'image' | 'video'>('image');
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Learn more');
  const [productId, setProductId] = useState('');
  const [billingModel, setBillingModel] = useState<'cpc' | 'cpm' | 'sponsorship'>('cpc');
  const [keywords, setKeywords] = useState('earbuds, bluetooth');
  const [dailyBudgetInr, setDailyBudgetInr] = useState(500);
  const [maxCpcBidInr, setMaxCpcBidInr] = useState(5);
  const [cpmRateInr, setCpmRateInr] = useState(1);
  const [sponsorshipDailyInr, setSponsorshipDailyInr] = useState(100);
  const [placements, setPlacements] = useState<string[]>(['search_results_top']);
  const [previewPlacement, setPreviewPlacement] = useState('search_results_top');

  const selectedProduct = products.find((p) => p.id === productId);

  const previewCreative: AdPreviewCreative = useMemo(
    () => ({
      format,
      headline: headline || selectedProduct?.title || '',
      body,
      mediaUrl: mediaUrl || (format !== 'text' ? selectedProduct?.imageUrl ?? '' : ''),
      ctaLabel,
      supplierName,
      productTitle: selectedProduct?.title,
      productPrice: selectedProduct?.price ?? undefined,
      productImageUrl: selectedProduct?.imageUrl ?? undefined,
    }),
    [format, headline, body, mediaUrl, ctaLabel, supplierName, selectedProduct],
  );

  function togglePlacement(id: string) {
    setPlacements((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      if (next.length === 0) return prev;
      if (!next.includes(previewPlacement)) setPreviewPlacement(id);
      return next;
    });
  }

  function handleProductChange(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      if (!headline) setHeadline(p.title);
      if (!mediaUrl && format !== 'text' && p.imageUrl) setMediaUrl(p.imageUrl);
    }
  }

  function submit() {
    const fd = new FormData();
    fd.set('name', name);
    fd.set('billingModel', billingModel);
    fd.set('creativeFormat', format);
    fd.set('headlineOverride', headline);
    fd.set('bodyText', body);
    fd.set('mediaUrl', mediaUrl);
    fd.set('ctaLabel', ctaLabel);
    if (productId) fd.set('productId', productId);
    fd.set('keywords', keywords);
    fd.set('dailyBudgetInr', String(dailyBudgetInr));
    fd.set('maxCpcBidInr', String(maxCpcBidInr));
    fd.set('cpmRateInr', String(cpmRateInr));
    fd.set('sponsorshipDailyInr', String(sponsorshipDailyInr));
    for (const p of placements) fd.set(`placement_${p}`, 'on');

    startTransition(async () => {
      const result = await createAdCampaignAction(fd);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.push(`/advertising/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="ad-studio">
      <div className="ad-studio-builder">
        <section className="ad-studio-section">
          <h2>1. Ad format</h2>
          <div className="ad-format-grid">
            {(
              [
                ['text', 'Text ad', 'Headline + copy — no image'],
                ['image', 'Image ad', 'Photo or banner creative'],
                ['video', 'Video ad', 'Short clip or product demo'],
              ] as const
            ).map(([id, title, hint]) => (
              <button
                key={id}
                type="button"
                className={`ad-format-card${format === id ? ' is-selected' : ''}`}
                onClick={() => setFormat(id)}
              >
                <strong>{title}</strong>
                <span>{hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ad-studio-section">
          <h2>2. Creative</h2>
          <div className="ad-studio-fields">
            <label>
              Headline
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Factory-direct TWS earbuds — MOQ 100"
                maxLength={80}
              />
            </label>
            <label>
              Primary text
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ships in 7 days · CE certified · Custom logo available"
                rows={3}
                maxLength={300}
              />
            </label>
            {format !== 'text' ? (
              <label>
                {format === 'video' ? 'Video URL' : 'Image URL'}
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            ) : null}
            <label>
              Call to action
              <select value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}>
                {['Learn more', 'Shop now', 'Get quote', 'Contact supplier'].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Link to listing <span className="muted">(optional — or build from scratch)</span>
              <select value={productId} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">No listing — custom creative only</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="ad-studio-section">
          <h2>3. Placements</h2>
          <p className="muted ad-studio-hint">Click a placement to preview it on the right.</p>
          <div className="ad-placement-grid">
            {PLACEMENTS.map((p) => {
              const on = placements.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`ad-placement-chip${on ? ' is-on' : ''}${previewPlacement === p.id ? ' is-previewing' : ''}`}
                  onClick={() => {
                    if (!on) togglePlacement(p.id);
                    setPreviewPlacement(p.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    readOnly
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlacement(p.id);
                    }}
                  />
                  <span>
                    <strong>{p.label}</strong>
                    <small>{p.hint}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ad-studio-section">
          <h2>4. Campaign & budget</h2>
          <div className="ad-studio-fields">
            <label>
              Campaign name
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </label>
            <label>
              Billing
              <select
                value={billingModel}
                onChange={(e) => setBillingModel(e.target.value as typeof billingModel)}
              >
                <option value="cpc">CPC — pay per click (search)</option>
                <option value="cpm">CPM — pay per 1,000 impressions</option>
                <option value="sponsorship">Sponsorship — flat daily burn</option>
              </select>
            </label>
            {billingModel === 'cpc' ? (
              <>
                <label>
                  Keywords (comma-separated)
                  <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                </label>
                <label>
                  Max CPC bid (₹)
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={maxCpcBidInr}
                    onChange={(e) => setMaxCpcBidInr(Number(e.target.value))}
                  />
                </label>
              </>
            ) : null}
            {billingModel === 'cpm' ? (
              <label>
                CPM rate (₹)
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={cpmRateInr}
                  onChange={(e) => setCpmRateInr(Number(e.target.value))}
                />
              </label>
            ) : null}
            {billingModel === 'sponsorship' ? (
              <label>
                Daily sponsorship (₹)
                <input
                  type="number"
                  min={1}
                  value={sponsorshipDailyInr}
                  onChange={(e) => setSponsorshipDailyInr(Number(e.target.value))}
                />
              </label>
            ) : null}
            <label>
              Daily budget (₹)
              <input
                type="number"
                min={0}
                value={dailyBudgetInr}
                onChange={(e) => setDailyBudgetInr(Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <div className="ad-studio-actions">
          <button className="btn" type="button" disabled={pending} onClick={submit}>
            {pending ? 'Publishing…' : 'Publish ad (TEST MODE)'}
          </button>
          <p className="muted">Uses your ad wallet test credit — no real charge.</p>
        </div>
      </div>

      <AdLivePreview creative={previewCreative} activePlacement={previewPlacement} />
    </div>
  );
}
