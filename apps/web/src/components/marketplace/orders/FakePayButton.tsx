'use client';

import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { fakeMarkOrderPaidAction } from '@/data/user/orders';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { GuaranteeBadge } from '@/components/marketplace/GuaranteeBadge';

export function FakePayButton({
  orderId,
  guaranteeEligible = false,
}: {
  orderId: string;
  guaranteeEligible?: boolean;
}) {
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const action = useAction(fakeMarkOrderPaidAction, {
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-dashed p-3">
      {guaranteeEligible ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <span>
            <span className="inline-flex items-center gap-1 font-medium">
              <GuaranteeBadge size="sm" /> Protect with SourceByJay Guarantee
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              I pay on SourceByJay (test mode). Coverage: quality match, on-time ship, dispute within
              30 days of delivery. Off-platform pay is never protected.
            </span>
          </span>
        </label>
      ) : (
        <p className="text-xs text-amber-800">
          <strong>No Guarantee cover</strong> — supplier not eligible for disputes. Paying on
          platform still holds fake funds in escrow (Alibaba-style) until release or refund.
        </p>
      )}
      <Button
        size="sm"
        disabled={action.status === 'executing'}
        onClick={() =>
          action.execute({ orderId, acceptGuaranteeTerms: acceptTerms && guaranteeEligible })
        }
      >
        {action.status === 'executing' ? 'Marking…' : 'Mark paid (test)'}
      </Button>
      <p className="text-xs text-muted-foreground">
        TEST MODE — fake pay → escrow held + invoice. No real charge. Stripe is Phase 10B.
      </p>
      {action.result.serverError ? (
        <p className="text-sm text-destructive">{action.result.serverError}</p>
      ) : null}
    </div>
  );
}
