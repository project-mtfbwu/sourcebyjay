'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import { GuaranteeBadge } from '@/components/marketplace/GuaranteeBadge';
import type { Product } from '@/types/marketplace';
import type { Supplier } from '@/types/marketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { InquiryDialog } from '@/components/marketplace/product/InquiryDialog';
import { StartChatButton } from '@/components/marketplace/chat/StartChatButton';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';
import { CompareButton } from '@/components/marketplace/compare/CompareButton';
import {
  ProductReviews,
  type ReviewRow,
} from '@/components/marketplace/reviews/ProductReviews';
import { ProductMediaGallery } from '@/components/marketplace/product/ProductMediaGallery';
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
  reviews?: ReviewRow[];
  reviewAverage?: number | null;
  initialFavorited?: boolean;
  supplierStorefrontHref?: string;
}

export function ProductGallery({
  images,
  title,
  favorite,
}: {
  images: string[];
  title: string;
  favorite?: { supplierId: string; productId: string; initialFavorited?: boolean };
}) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-marketplace-border bg-muted">
        <Image src={images[selected]} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
        {/* Alibaba PC: circular heart overlay, top-right of main gallery image */}
        {favorite ? (
          <FavoriteButton
            variant="overlay"
            kind="product"
            supplierId={favorite.supplierId}
            productId={favorite.productId}
            initialFavorited={favorite.initialFavorited}
          />
        ) : null}
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
      {product.hsnCode || product.gstRateBps != null ? (
        <p className="mt-2 text-xs text-marketplace-muted">
          {product.hsnCode ? <>HSN {product.hsnCode}</> : null}
          {product.hsnCode && product.gstRateBps != null ? ' · ' : null}
          {product.gstRateBps != null ? <>GST {(product.gstRateBps / 100).toFixed(0)}%</> : null}
        </p>
      ) : null}

      {supplier.guaranteeEligible ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          <div className="flex items-center gap-2">
            <GuaranteeBadge />
            <span className="font-medium">SourceByJay Guarantee</span>
          </div>
          <p className="mt-1 text-xs text-emerald-900/80">
            Protected when you pay on SourceByJay (not WhatsApp / UPI direct). Quality, on-time ship,
            and 30-day dispute window.
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <strong>Not covered by SourceByJay Guarantee.</strong> This supplier is not on a Pro+ plan
          (unless ops grants it). Off-platform payment is never protected.
        </div>
      )}

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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <StartChatButton
          supplierId={supplier.id}
          productId={product.id}
          supplierName={supplier.name}
          label="Chat now"
        />
        <InquiryDialog
          productId={product.id}
          supplierId={supplier.id}
          productTitle={product.title}
          productSlug={product.slug}
          type="contact"
          label="Send inquiry"
        />
        <InquiryDialog
          productId={product.id}
          supplierId={supplier.id}
          productTitle={product.title}
          productSlug={product.slug}
          type="rfq"
          label="Request quote"
        />
      </div>
      {product.sampleAvailable ? (
        <div className="mt-2">
          <InquiryDialog
            productId={product.id}
            supplierId={supplier.id}
            productTitle={product.title}
            productSlug={product.slug}
            type="sample"
            label="Request sample"
            variant="ghost"
          />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
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
            productId: product.id,
            productTitle: product.title,
          }}
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

export function SupplierMiniCard({
  supplier,
  product,
  href: hrefProp,
}: {
  supplier: Supplier;
  product?: Pick<Product, 'id' | 'slug' | 'title'>;
  href?: string;
}) {
  const href =
    hrefProp ??
    (product
      ? `/suppliers/${supplier.slug}?productId=${product.id}&from=detail_company_card`
      : `/suppliers/${supplier.slug}`);

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border-2 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-brand-primary/20 text-xl font-bold text-emerald-900">
          {supplier.logoUrl ? (
            <Image
              src={supplier.logoUrl}
              alt=""
              width={56}
              height={56}
              className="size-full object-cover"
            />
          ) : (
            supplier.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground group-hover:text-emerald-800">{supplier.name}</h4>
            <VerificationBadge tier={supplier.verificationTier} />
            {supplier.guaranteeEligible ? <GuaranteeBadge size="sm" /> : null}
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-marketplace-muted">
            <MapPin className="size-3 shrink-0" />
            {supplier.city}, {supplier.country}
          </p>
          <p className="mt-1 text-xs text-marketplace-muted">
            {supplier.yearsInBusiness} yrs · {supplier.responseRate} response · {supplier.mainProducts}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            View company profile
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
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

export function ProductDetailView({
  product,
  supplier,
  reviews = [],
  reviewAverage = null,
  initialFavorited = false,
  supplierStorefrontHref,
}: ProductDetailProps) {
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
        <ProductMediaGallery
          media={product.media ?? product.images.map((url, i) => ({ id: `img-${i}`, kind: 'image' as const, url, sortOrder: i }))}
          title={product.title}
          favorite={{
            supplierId: supplier.id,
            productId: product.id,
            initialFavorited,
          }}
        />
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">{product.title}</h1>
            <p className="mt-3 text-marketplace-muted">{product.description}</p>
          </div>
          <ProductPricing product={product} supplier={supplier} />
          <SupplierMiniCard supplier={supplier} product={product} href={supplierStorefrontHref} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ProductSpecs specs={product.specs} />
        <ProductReviews reviews={reviews} average={reviewAverage} />
      </div>
    </div>
  );
}
