import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Supplier } from '@/types/marketplace';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import { GuaranteeBadge } from '@/components/marketplace/GuaranteeBadge';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';
import { CompareButton } from '@/components/marketplace/compare/CompareButton';

export function SupplierSearchCard({ supplier }: { supplier: Supplier }) {
  return (
    <article className="relative rounded-xl border border-marketplace-border bg-white p-4">
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton variant="overlay" kind="supplier" supplierId={supplier.id} />
      </div>
      <Link href={`/suppliers/${supplier.slug}`} className="block pr-10 hover:opacity-90">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/30 text-lg font-bold">
            {supplier.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{supplier.name}</h3>
              {supplier.guaranteeEligible ? <GuaranteeBadge /> : null}
              <VerificationBadge tier={supplier.verificationTier} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-marketplace-muted">
              <MapPin className="size-3.5" />
              {supplier.city}, {supplier.country}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-marketplace-muted">
              {supplier.mainProducts}
            </p>
            <p className="mt-1 text-xs text-marketplace-muted">
              {supplier.yearsInBusiness} yrs · {supplier.responseRate} response
            </p>
          </div>
        </div>
      </Link>
      <div className="mt-3">
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
    </article>
  );
}
