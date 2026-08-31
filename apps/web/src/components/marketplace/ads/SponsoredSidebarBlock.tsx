import type { SponsoredAd } from '@/data/anon/ads';
import { SponsoredProductCard } from '@/components/marketplace/ads/SponsoredProductCard';

export function SponsoredSidebarBlock({
  ads,
  searchQuery,
}: {
  ads: SponsoredAd[];
  searchQuery?: string;
}) {
  if (ads.length === 0) return null;

  return (
    <div className="rounded-xl border border-marketplace-border bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-marketplace-muted">Sponsored</p>
      <div className="flex flex-col gap-3">
        {ads.map((ad) => (
          <SponsoredProductCard
            key={ad.creativeId}
            ad={ad}
            placement="search_sidebar"
            searchQuery={searchQuery}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}
