'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { MapPin, Clock, Package, BadgeCheck, Users, ChevronRight } from 'lucide-react';
import type { Category, Product, Supplier, SupplierCertificate, SupplierGalleryItem } from '@/types/marketplace';
import { orderProductsByFeatured } from '@sourcebyjay/types';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import { GuaranteeBadge } from '@/components/marketplace/GuaranteeBadge';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';
import { CompareButton } from '@/components/marketplace/compare/CompareButton';
import { StartChatButton } from '@/components/marketplace/chat/StartChatButton';
import { InquiryDialog } from '@/components/marketplace/product/InquiryDialog';
import { SupplierVideoGrid } from '@/components/marketplace/supplier/SupplierVideoGrid';
import { SupplierContextBanner } from '@/components/marketplace/supplier/SupplierContextBanner';
import { SupplierStickyBar } from '@/components/marketplace/supplier/SupplierStickyBar';
import { FactoryGalleryGrid } from '@/components/marketplace/supplier/FactoryGalleryGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface SupplierProfileViewProps {
  supplier: Supplier;
  products: Product[];
  gallery: SupplierGalleryItem[];
  videos: SupplierGalleryItem[];
  certificates: SupplierCertificate[];
  categories: Category[];
  contextProduct?: Product | null;
  entryFrom?: string | null;
  /** marketplace = full site chrome; minisite = /factory/{slug} Business+ layout */
  variant?: 'marketplace' | 'minisite';
  /** Vendor iframe draft preview — hides sticky bar duplicate chrome tweaks */
  previewMode?: boolean;
  /** Override home/products ordering from storefront editor */
  featuredProductIds?: string[] | null;
}

export function SupplierProfileView({
  supplier,
  products,
  gallery,
  videos,
  certificates,
  categories,
  contextProduct = null,
  entryFrom = null,
  variant = 'marketplace',
  previewMode = false,
  featuredProductIds = null,
}: SupplierProfileViewProps) {
  const rfqProduct = contextProduct ?? products[0] ?? null;
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');

  const orderedProducts = useMemo(
    () => orderProductsByFeatured(products, featuredProductIds ?? supplier.featuredProductIds),
    [products, featuredProductIds, supplier.featuredProductIds],
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const productCategories = useMemo(() => {
    const ids = [...new Set(orderedProducts.map((p) => p.categoryId).filter(Boolean))];
    return ids
      .map((id) => ({ id, name: categoryNameById.get(id) ?? 'Other' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orderedProducts, categoryNameById]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return orderedProducts;
    return orderedProducts.filter((p) => p.categoryId === categoryFilter);
  }, [orderedProducts, categoryFilter]);

  const [activeTab, setActiveTab] = useState(
    entryFrom === 'detail_company_card' && contextProduct ? 'products' : 'home',
  );

  return (
    <div className={previewMode ? 'pb-8' : 'pb-24 md:pb-12'}>
      {variant === 'minisite' ? (
        <div className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-2 text-center text-xs text-emerald-900 lg:px-10">
          Official factory storefront ·{' '}
          <a href={`/suppliers/${supplier.slug}`} className="font-medium underline-offset-2 hover:underline">
            View on marketplace
          </a>
        </div>
      ) : null}
      {/* Hero */}
      <div className="relative min-h-[200px] overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-950 sm:min-h-[240px] lg:min-h-[280px]">
        {supplier.bannerUrl ? (
          previewMode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={supplier.bannerUrl}
              src={supplier.bannerUrl}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-90"
            />
          ) : (
            <Image
              src={supplier.bannerUrl}
              alt=""
              fill
              className="object-cover opacity-90"
              sizes="100vw"
              priority
            />
          )
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />

        <div className="relative mx-auto max-w-[1440px] px-4 pb-8 pt-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-primary text-2xl font-bold shadow-lg sm:size-24 sm:text-3xl">
                {supplier.logoUrl ? (
                  previewMode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={supplier.logoUrl}
                      src={supplier.logoUrl}
                      alt=""
                      width={96}
                      height={96}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Image src={supplier.logoUrl} alt="" width={96} height={96} className="size-full object-cover" />
                  )
                ) : (
                  supplier.name.charAt(0)
                )}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-white drop-shadow sm:text-2xl lg:text-3xl">{supplier.name}</h1>
                  {supplier.guaranteeEligible ? <GuaranteeBadge size="md" /> : null}
                  <VerificationBadge tier={supplier.verificationTier} size="md" />
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/90 drop-shadow sm:text-base">
                  <MapPin className="size-4 shrink-0" />
                  {supplier.city}, {supplier.country}
                </p>
              </div>
            </div>

            {/* Desktop actions — hidden on mobile (sticky bar instead) */}
            <div className="hidden flex-wrap gap-2 md:flex">
              <StartChatButton
                supplierId={supplier.id}
                productId={rfqProduct?.id}
                supplierName={supplier.name}
                label="Chat"
              />
              {rfqProduct ? (
                <>
                  <InquiryDialog
                    productId={rfqProduct.id}
                    supplierId={supplier.id}
                    productTitle={rfqProduct.title}
                    productSlug={rfqProduct.slug}
                    type="rfq"
                    label="Send RFQ"
                  />
                  <InquiryDialog
                    productId={rfqProduct.id}
                    supplierId={supplier.id}
                    productTitle={rfqProduct.title}
                    productSlug={rfqProduct.slug}
                    type="contact"
                    label="Contact"
                    variant="outline"
                  />
                </>
              ) : null}
              <FavoriteButton kind="supplier" supplierId={supplier.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        {/* Company stats strip */}
        <div className="-mt-6 relative z-10 mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Clock} label="Years" value={`${supplier.yearsInBusiness}+`} />
          <StatCard icon={Package} label="Main products" value={supplier.mainProducts} compact />
          <StatCard icon={BadgeCheck} label="Response" value={supplier.responseRate} />
          <StatCard icon={Users} label="Listings" value={`${orderedProducts.length} products`} />
        </div>

        {contextProduct ? <SupplierContextBanner product={contextProduct} /> : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto bg-muted/50 p-1">
            <TabsTrigger value="home" className="shrink-0">
              Home
            </TabsTrigger>
            <TabsTrigger value="products" className="shrink-0">
              Products ({orderedProducts.length})
            </TabsTrigger>
            <TabsTrigger value="factory" className="shrink-0">
              Factory ({gallery.length})
            </TabsTrigger>
            {videos.length > 0 ? (
              <TabsTrigger value="videos" className="shrink-0">
                Videos ({videos.length})
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="certificates" className="shrink-0">
              Certificates ({certificates.length})
            </TabsTrigger>
            <TabsTrigger value="about" className="shrink-0">
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-8">
            <section className="rounded-xl border border-marketplace-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Company overview</h2>
              <p className="leading-relaxed text-marketplace-muted">{supplier.description}</p>
            </section>

            {orderedProducts.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">Featured products</h2>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setActiveTab('products')} className="gap-1">
                    View all
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {orderedProducts.slice(0, 5).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      supplierVerificationTier={supplier.verificationTier}
                      guaranteeEligible={supplier.guaranteeEligible}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {gallery.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Factory tour preview</h2>
                <FactoryGalleryGrid items={gallery.slice(0, 4)} />
              </section>
            ) : null}
          </TabsContent>

          <TabsContent value="products">
            {productCategories.length > 1 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
                  All
                </FilterChip>
                {productCategories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    active={categoryFilter === cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.name}
                  </FilterChip>
                ))}
              </div>
            ) : null}
            {filteredProducts.length === 0 ? (
              <EmptyState message="No products in this category yet." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    supplierVerificationTier={supplier.verificationTier}
                    guaranteeEligible={supplier.guaranteeEligible}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="factory">
            {gallery.length === 0 ? (
              <EmptyState message="Factory photos appear here after ops approval." />
            ) : (
              <FactoryGalleryGrid items={gallery} />
            )}
          </TabsContent>

          <TabsContent value="videos">
            <SupplierVideoGrid items={videos} />
          </TabsContent>

          <TabsContent value="certificates">
            {certificates.length === 0 ? (
              <EmptyState message="Certificates appear here after verification." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="overflow-hidden rounded-xl border border-marketplace-border bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/5] bg-muted">
                      <Image src={cert.fileUrl} alt={cert.name} fill className="object-cover" sizes="300px" />
                    </div>
                    <div className="p-4">
                      <p className="font-medium">{cert.name}</p>
                      {cert.certType ? (
                        <p className="text-xs font-medium text-[#c2410c]">{cert.certType.replace(/_/g, ' ')}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <div className="space-y-6">
              <div className="rounded-xl border border-marketplace-border p-6">
                <h2 className="mb-3 text-lg font-semibold">About {supplier.name}</h2>
                <p className="leading-relaxed text-marketplace-muted">{supplier.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CompareButton
                  item={{
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    supplierSlug: supplier.slug,
                    verificationTier: supplier.verificationTier,
                    city: supplier.city,
                    country: supplier.country,
                    yearsInBusiness: supplier.yearsInBusiness,
                    responseRate: supplier.responseRate,
                    mainProducts: supplier.mainProducts,
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {!previewMode ? <SupplierStickyBar supplier={supplier} rfqProduct={rfqProduct} /> : null}
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-marketplace-border bg-white text-marketplace-muted hover:border-emerald-300'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-marketplace-border p-12 text-center text-marketplace-muted">
      {message}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-marketplace-border bg-white p-3 shadow-sm sm:p-4">
      <Icon className="mb-1 size-4 text-emerald-600 sm:mb-2 sm:size-5" />
      <p className="text-[10px] uppercase tracking-wide text-marketplace-muted sm:text-xs">{label}</p>
      <p className={`mt-0.5 font-semibold ${compact ? 'text-xs sm:text-sm line-clamp-2' : 'text-sm sm:text-base'}`}>
        {value}
      </p>
    </div>
  );
}
