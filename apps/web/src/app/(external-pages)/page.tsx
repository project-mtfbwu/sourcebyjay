import {
  HeroSearch,
  QuickLinks,
  CategoryGrid,
  PromoStrip,
  ProductGridSection,
} from '@/components/marketplace/home/HomeSections';

export default function HomePage() {
  return (
    <>
      <HeroSearch />
      <QuickLinks />
      <CategoryGrid />
      <PromoStrip />
      <ProductGridSection />
    </>
  );
}
