'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { verifySupplierAction } from '@/data/user/admin';

interface SupplierRow {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  verified: boolean;
  main_products: string;
}

export function AdminSuppliersTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const { execute, status } = useAction(verifySupplierAction, {
    onSuccess: () => {
      toast.success('Supplier updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  if (suppliers.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-muted-foreground">
        All suppliers are verified — nothing pending.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Company</th>
            <th className="p-3">Location</th>
            <th className="p-3">Products</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-3 font-medium">{s.name}</td>
              <td className="p-3 text-muted-foreground">{s.city}, {s.country}</td>
              <td className="p-3 text-muted-foreground">{s.main_products}</td>
              <td className="p-3">
                <Badge variant={s.verified ? 'default' : 'secondary'}>
                  {s.verified ? 'Verified' : 'Pending'}
                </Badge>
              </td>
              <td className="p-3">
                {!s.verified ? (
                  <Button
                    size="sm"
                    disabled={status === 'executing'}
                    onClick={() => execute({ supplierId: s.id, verified: true })}
                  >
                    Approve
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={status === 'executing'}
                    onClick={() => execute({ supplierId: s.id, verified: false })}
                  >
                    Revoke
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
