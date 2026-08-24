'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import type { Product } from '@/types/marketplace';
import type { Supplier } from '@/types/marketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { InquiryDialog } from '@/components/marketplace/product/InquiryDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductDetailProps {
  product: Product;
  supplier: Supplier;
}

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-marketplace-border bg-muted">
        <Image src={images[selected]} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative size-16 overflow-hidden rounded-lg border-2 ${
                selected === i ? 'border-marketplace-accent' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductPricing({
  product,
  supplier,
}: {
  product: Product;
  supplier: Supplier;
}) {
  return (
    <div className="rounded-xl border border-marketplace-border p-4">
      <p className="text-3xl font-bold text-marketplace-accent">
        ${product.price.toFixed(product.price < 1 ? 2 : 2)}
        <span className="ml-1 text-base font-normal text-marketplace-muted">/ unit</span>
      </p>
      <p className="mt-1 text-sm text-marketplace-muted">MOQ: {product.moq} units</p>

      {product.priceTiers && product.priceTiers.length > 1 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-semibold">Volume pricing</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.priceTiers.map((tier) => (
                <TableRow key={tier.minQty}>
                  <TableCell>≥ {tier.minQty}</TableCell>
                  <TableCell className="font-medium text-marketplace-accent">${tier.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <InquiryDialog
          productId={product.id}
          supplierId={supplier.id}
          productTitle={product.title}
          productSlug={product.slug}
          type="contact"
        />
        <InquiryDialog
          productId={product.id}
          supplierId={supplier.id}
          productTitle={product.title}
          productSlug={product.slug}
          type="rfq"
        />
      </div>
    </div>
  );
}

export function ProductSpecs({ specs }: { specs: Record<string, string> }) {
  return (
    <div className="rounded-xl border border-marketplace-border p-4">
      <h3 className="mb-4 font-semibold">Specifications</h3>
      <dl className="space-y-2">
        {Object.entries(specs).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-marketplace-border py-2 text-sm last:border-0">
            <dt className="text-marketplace-muted">{key}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SupplierMiniCard({ supplier }: { supplier: Supplier }) {
  return (
    <Link
      href={`/suppliers/${supplier.slug}`}
      className="marketplace-card-hover block rounded-xl border border-marketplace-border p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-primary/30 text-lg font-bold">
          {supplier.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{supplier.name}</h4>
            <VerificationBadge tier={supplier.verificationTier} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-marketplace-muted">
            <MapPin className="size-3" />
            {supplier.city}, {supplier.country}
          </p>
          <p className="mt-1 text-xs text-marketplace-muted">
            {supplier.yearsInBusiness} yrs · {supplier.responseRate} response rate
          </p>
        </div>
      </div>
    </Link>
  );
}

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-semibold">More from this supplier</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} size="sm" />
        ))}
      </div>
    </section>
  );
}

export function ProductDetailView({ product, supplier }: ProductDetailProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-10">
      <div className="mb-4 text-sm text-marketplace-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/search" className="hover:text-foreground">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">{product.title}</h1>
            <p className="mt-3 text-marketplace-muted">{product.description}</p>
          </div>
          <ProductPricing product={product} supplier={supplier} />
          <SupplierMiniCard supplier={supplier} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ProductSpecs specs={product.specs} />
      </div>
    </div>
  );
}
