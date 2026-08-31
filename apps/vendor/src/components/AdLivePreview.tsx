'use client';

export type AdPreviewCreative = {
  format: 'text' | 'image' | 'video';
  headline: string;
  body: string;
  mediaUrl: string;
  ctaLabel: string;
  supplierName: string;
  productTitle?: string;
  productPrice?: number;
  productImageUrl?: string;
};

const PLACEMENT_LABELS: Record<string, string> = {
  search_results_top: 'Search results — top row',
  search_sidebar: 'Search — sidebar',
  home_featured: 'Home — sponsored carousel',
  category_banner: 'Category banner',
  supplier_spotlight: 'Supplier spotlight',
};

function PreviewAdCard({
  creative,
  size = 'md',
}: {
  creative: AdPreviewCreative;
  size?: 'sm' | 'md';
}) {
  const imageSize = size === 'sm' ? 120 : 140;
  const title = creative.headline || creative.productTitle || 'Your headline';
  const imageSrc =
    creative.format === 'text'
      ? ''
      : creative.mediaUrl || creative.productImageUrl || '';
  const price = creative.productPrice ?? 1299;

  if (creative.format === 'text') {
    return (
      <div
        className="ad-preview-text-card"
        style={{ maxWidth: size === 'sm' ? 200 : 280 }}
      >
        <span className="ad-preview-sponsored">Sponsored</span>
        <p className="ad-preview-headline">{title}</p>
        <p className="ad-preview-body">{creative.body || 'Primary text appears here…'}</p>
        <p className="ad-preview-supplier">{creative.supplierName}</p>
        <span className="ad-preview-cta">{creative.ctaLabel}</span>
      </div>
    );
  }

  return (
    <div className="ad-preview-product-card" style={{ width: imageSize }}>
      <span className="ad-preview-sponsored">Sponsored</span>
      <div className="ad-preview-image-wrap">
        {creative.format === 'video' && imageSrc ? (
          <video
            src={imageSrc}
            className="ad-preview-media"
            muted
            playsInline
            loop
            autoPlay
          />
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={title} className="ad-preview-media" />
        ) : (
          <div className="ad-preview-placeholder">Image / video</div>
        )}
      </div>
      <div className="ad-preview-card-body">
        <p className="ad-preview-headline">{title}</p>
        {creative.body ? <p className="ad-preview-body-sm">{creative.body}</p> : null}
        <p className="ad-preview-supplier">{creative.supplierName}</p>
        {creative.productPrice != null || !creative.body ? (
          <p className="ad-preview-price">₹{price.toLocaleString('en-IN')}</p>
        ) : null}
      </div>
    </div>
  );
}

function MockSearchPage({ creative }: { creative: AdPreviewCreative }) {
  return (
    <div className="ad-preview-frame">
      <div className="ad-preview-browser-bar">
        <span />
        <span />
        <span />
        <div className="ad-preview-url">sourcebyjay.test/search?q=earbuds</div>
      </div>
      <div className="ad-preview-page">
        <div className="ad-preview-search-bar">🔍 earbuds</div>
        <div className="ad-preview-sponsored-strip">
          <p className="ad-preview-section-label">Sponsored</p>
          <div className="ad-preview-row">
            <PreviewAdCard creative={creative} />
            <div className="ad-preview-ghost-card" />
            <div className="ad-preview-ghost-card" />
          </div>
        </div>
        <div className="ad-preview-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ad-preview-ghost-card" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MockSearchSidebar({ creative }: { creative: AdPreviewCreative }) {
  return (
    <div className="ad-preview-frame ad-preview-frame--sidebar">
      <div className="ad-preview-browser-bar">
        <span />
        <span />
        <span />
        <div className="ad-preview-url">Search sidebar</div>
      </div>
      <div className="ad-preview-page ad-preview-page--split">
        <div className="ad-preview-main-col">
          <div className="ad-preview-ghost-card ad-preview-ghost-card--wide" />
          <div className="ad-preview-ghost-card ad-preview-ghost-card--wide" />
        </div>
        <aside className="ad-preview-sidebar-col">
          <p className="ad-preview-section-label">Sponsored</p>
          <PreviewAdCard creative={creative} size="sm" />
        </aside>
      </div>
    </div>
  );
}

function MockHomeCarousel({ creative }: { creative: AdPreviewCreative }) {
  return (
    <div className="ad-preview-frame">
      <div className="ad-preview-browser-bar">
        <span />
        <span />
        <span />
        <div className="ad-preview-url">sourcebyjay.test — Home</div>
      </div>
      <div className="ad-preview-page">
        <div className="ad-preview-hero-ghost" />
        <div className="ad-preview-carousel-section">
          <div className="ad-preview-carousel-header">
            <span>Sponsored picks</span>
            <span className="ad-preview-ad-tag">Ad</span>
          </div>
          <div className="ad-preview-row">
            <PreviewAdCard creative={creative} />
            <div className="ad-preview-ghost-card" />
            <div className="ad-preview-ghost-card" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockBanner({ creative }: { creative: AdPreviewCreative }) {
  return (
    <div className="ad-preview-frame">
      <div className="ad-preview-browser-bar">
        <span />
        <span />
        <span />
        <div className="ad-preview-url">Category / spotlight</div>
      </div>
      <div className="ad-preview-page">
        <div className="ad-preview-banner">
          {creative.format === 'video' && creative.mediaUrl ? (
            <video src={creative.mediaUrl} className="ad-preview-banner-media" muted autoPlay loop playsInline />
          ) : creative.mediaUrl || creative.productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creative.mediaUrl || creative.productImageUrl}
              alt=""
              className="ad-preview-banner-media"
            />
          ) : (
            <div className="ad-preview-banner-placeholder">
              <strong>{creative.headline || 'Banner headline'}</strong>
              <span>{creative.body || 'Supporting copy'}</span>
            </div>
          )}
          <div className="ad-preview-banner-overlay">
            <strong>{creative.headline || 'Headline'}</strong>
            <button type="button">{creative.ctaLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdLivePreview({
  creative,
  activePlacement,
}: {
  creative: AdPreviewCreative;
  activePlacement: string;
}) {
  const label = PLACEMENT_LABELS[activePlacement] ?? activePlacement;

  return (
    <aside className="ad-studio-preview">
      <div className="ad-studio-preview-header">
        <h3>Live placement preview</h3>
        <p className="muted">Updates as you edit — like Meta Ads Manager.</p>
      </div>
      <p className="ad-preview-placement-label">{label}</p>
      {activePlacement === 'search_results_top' ? (
        <MockSearchPage creative={creative} />
      ) : activePlacement === 'search_sidebar' ? (
        <MockSearchSidebar creative={creative} />
      ) : activePlacement === 'home_featured' ? (
        <MockHomeCarousel creative={creative} />
      ) : (
        <MockBanner creative={creative} />
      )}
    </aside>
  );
}
