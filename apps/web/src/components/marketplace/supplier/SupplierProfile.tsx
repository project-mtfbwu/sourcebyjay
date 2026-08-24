'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin, Clock, Package, BadgeCheck } from 'lucide-react';
import type { Product, Supplier, SupplierCertificate, SupplierGalleryItem } from '@/types/marketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupplierProfileViewProps {
  supplier: Supplier;
  products: Product[];
  gallery: SupplierGalleryItem[];
  certificates: SupplierCertificate[];
}

export function SupplierProfileView({
  supplier,
  products,
  gallery,
  certificates,
}: SupplierProfileViewProps) {
  return (
    <div>
      <div className="relative h-48 overflow-hidden bg-muted lg:h-64">
        {supplier.bannerUrl && (
          <Image src={supplier.bannerUrl} alt="" fill className="object-cover" sizes="100vw" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="-mt-16 relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-brand-primary text-3xl font-bold shadow-lg">
              {supplier.name.charAt(0)}
            </div>
            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg lg:text-3xl">{supplier.name}</h1>
                <VerificationBadge tier={supplier.verificationTier} size="md" />
              </div>
              <p className="mt-1 flex items-center gap-1 text-white/90 drop-shadow">
                <MapPin className="size-4" />
                {supplier.city}, {supplier.country}
              </p>
            </div>
          </div>
          <Button className="w-fit bg-marketplace-accent hover:bg-marketplace-accent/90">
            Contact Supplier
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Clock} label="Years in business" value={`${supplier.yearsInBusiness}+`} />
          <StatCard icon={Package} label="Main products" value={supplier.mainProducts} />
          <StatCard icon={BadgeCheck} label="Response rate" value={supplier.responseRate} />
        </div>

        <Tabs defaultValue="overview" className="mb-12">
          <TabsList className="mb-6 flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="factory">Factory tour ({gallery.length})</TabsTrigger>
            <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="rounded-xl border border-marketplace-border p-6">
              <h2 className="mb-3 text-lg font-semibold">About the company</h2>
              <p className="text-marketplace-muted">{supplier.description}</p>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  supplierVerificationTier={supplier.verificationTier}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="factory">
            {gallery.length === 0 ? (
              <EmptyState message="Factory photos will appear here after ops approval." />
            ) : (
              <GalleryCarousel items={gallery} />
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {certificates.length === 0 ? (
              <EmptyState message="Certificates will appear here after verification." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="overflow-hidden rounded-xl border border-marketplace-border bg-white"
                  >
                    <div className="relative aspect-[4/5] bg-muted">
                      <Image src={cert.fileUrl} alt={cert.name} fill className="object-cover" sizes="300px" />
                    </div>
                    <div className="p-4">
                      <p className="font-medium">{cert.name}</p>
                      {cert.expiresAt && (
                        <p className="mt-1 text-xs text-marketplace-muted">Expires {cert.expiresAt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GalleryCarousel({ items }: { items: SupplierGalleryItem[] }) {
  const [index, setIndex] = useState(0);
  const current = items[index];

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <Image
          src={current.imageUrl}
          alt={current.caption ?? 'Factory photo'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 900px"
          priority
        />
      </div>
      {current.caption && <p className="text-sm text-marketplace-muted">{current.caption}</p>}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`relative size-20 shrink-0 overflow-hidden rounded-lg border-2 ${
              i === index ? 'border-marketplace-accent' : 'border-transparent'
            }`}
          >
            <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="80px" />
          </button>
        ))}
      </div>
    </div>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-marketplace-border p-4">
      <Icon className="mb-2 size-5 text-marketplace-accent" />
      <p className="text-xs text-marketplace-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
