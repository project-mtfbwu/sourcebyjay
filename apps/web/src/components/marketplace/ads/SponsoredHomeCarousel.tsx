import type { SponsoredAd } from '@/data/anon/ads';
import { SponsoredProductCard } from '@/components/marketplace/ads/SponsoredProductCard';

export function SponsoredHomeCarousel({ ads }: { ads: SponsoredAd[] }) {
  if (ads.length === 0) return null;

  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sponsored picks</h2>
          <span className="text-xs uppercase tracking-wide text-marketplace-muted">Ad</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {ads.map((ad) => (
            <SponsoredProductCard key={ad.creativeId} ad={ad} placement="home_featured" size="md" />
          ))}
        </div>
      </div>
    </section>
  );
}
