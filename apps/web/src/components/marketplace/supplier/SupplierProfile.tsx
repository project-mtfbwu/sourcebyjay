import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Clock, Package } from 'lucide-react';
import type { Product } from '@/types/marketplace';
import type { Supplier } from '@/types/marketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Button } from '@/components/ui/button';

interface SupplierProfileProps {
  supplier: Supplier;
  products: Product[];
}

export function SupplierProfileView({ supplier, products }: SupplierProfileProps) {
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg lg:text-3xl">{supplier.name}</h1>
                {supplier.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-black">
                    <BadgeCheck className="size-3" />
                    Verified
                  </span>
                )}
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

        <div className="mb-8 rounded-xl border border-marketplace-border p-6">
          <h2 className="mb-3 text-lg font-semibold">About the company</h2>
          <p className="text-marketplace-muted">{supplier.description}</p>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Products ({products.length})</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
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
