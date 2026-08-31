import {
  HeroSearch,
  QuickLinks,
  CategoryGrid,
  PromoStrip,
} from '@/components/marketplace/home/HomeSections';
import { PersonalizedProductGrid } from '@/components/marketplace/home/PersonalizedProductGrid';
import { TrendingChips } from '@/components/marketplace/home/TrendingChips';
import {
  getAllProducts,
  getAllSuppliers,
  getCategories,
  getTrendingProducts,
} from '@/data/anon/marketplace';
import { getSponsoredPlacements } from '@/data/anon/ads';
import { SponsoredHomeCarousel } from '@/components/marketplace/ads/SponsoredHomeCarousel';
import type { VerificationTier } from '@/types/marketplace';

export default async function HomePage() {
  const [products, categories, suppliers, trending, homeAds] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getAllSuppliers(),
    getTrendingProducts(6),
    getSponsoredPlacements('home_featured', { limit: 6 }),
  ]);

  const supplierTiers: Record<string, VerificationTier> = {};
  const guaranteeBySupplier: Record<string, boolean> = {};
  for (const s of suppliers) {
    supplierTiers[s.id] = s.verificationTier;
    guaranteeBySupplier[s.id] = Boolean(s.guaranteeEligible);
  }

  return (
    <>
      <HeroSearch />
      <QuickLinks />
      <TrendingChips products={trending} />
      <CategoryGrid />
      <SponsoredHomeCarousel ads={homeAds} />
      <PromoStrip />
      <PersonalizedProductGrid
        products={products}
        categories={categories}
        supplierTiers={supplierTiers}
        guaranteeBySupplier={guaranteeBySupplier}
      />
    </>
  );
}
