'use client';

import { Columns2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCompareOptional, type CompareItem } from './CompareContext';

const MAX = 4;

export function CompareButton({ item, className }: { item: CompareItem; className?: string }) {
  const compare = useCompareOptional();
  if (!compare) return null;

  const selected = compare.isSelected(item.supplierId);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => {
        if (selected) {
          compare.remove(item.supplierId);
          return;
        }
        if (compare.items.length >= MAX) {
          toast.error(`Compare up to ${MAX} suppliers (Alibaba-style).`);
          return;
        }
        compare.add(item);
        toast.success('Added to compare tray');
      }}
    >
      <Columns2 className="mr-1.5 size-4" />
      {selected ? 'In compare' : 'Compare'}
    </Button>
  );
}
