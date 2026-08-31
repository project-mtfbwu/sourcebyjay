import type { SponsoredAd } from '@/data/anon/ads';
import { SponsoredProductCard } from '@/components/marketplace/ads/SponsoredProductCard';

export function SponsoredSearchBlock({
  ads,
  searchQuery,
}: {
  ads: SponsoredAd[];
  searchQuery?: string;
}) {
  if (ads.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-marketplace-muted">Sponsored</p>
      <div className="flex flex-wrap gap-4">
        {ads.map((ad) => (
          <SponsoredProductCard
            key={ad.creativeId}
            ad={ad}
            placement="search_results_top"
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </section>
  );
}
