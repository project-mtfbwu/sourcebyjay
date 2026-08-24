'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setVerificationTierAction, verifySupplierAction } from '@/data/user/admin';
import type { VerificationTier } from '@/types/marketplace';
import { TIER_LABELS, TIER_OPTIONS } from '@/utils/verification';

interface SupplierRow {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  verified: boolean;
  verification_tier?: VerificationTier | null;
  main_products: string;
}

export function AdminSuppliersTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const { execute: setTier, status: tierStatus } = useAction(setVerificationTierAction, {
    onSuccess: () => {
      toast.success('Verification tier updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  const { execute: verify, status: verifyStatus } = useAction(verifySupplierAction, {
    onSuccess: () => {
      toast.success('Supplier updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  const busy = tierStatus === 'executing' || verifyStatus === 'executing';

  if (suppliers.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-muted-foreground">No suppliers found.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Company</th>
            <th className="p-3">Location</th>
            <th className="p-3">Tier</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => {
            const tier = (s.verification_tier ?? (s.verified ? 'verified' : 'none')) as VerificationTier;
            return (
              <tr key={s.id} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.main_products}</p>
                </td>
                <td className="p-3 text-muted-foreground">
                  {s.city}, {s.country}
                </td>
                <td className="p-3">
                  <Select
                    value={tier}
                    disabled={busy}
                    onValueChange={(value) =>
                      setTier({ supplierId: s.id, tier: value as VerificationTier })
                    }
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <Badge variant={s.verified ? 'default' : 'secondary'}>
                    {TIER_LABELS[tier]}
                  </Badge>
                </td>
                <td className="p-3">
                  {tier === 'none' ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => verify({ supplierId: s.id, verified: true })}
                    >
                      Quick verify
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setTier({ supplierId: s.id, tier: 'none' })}
                    >
                      Reset
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
