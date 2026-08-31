'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelUnpaidOrderAction, returnEscrowToBuyerAction } from '@/data/user/orders';

export function CancelUnpaidButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const action = useAction(cancelUnpaidOrderAction, {
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="mt-2">
      <Button
        size="sm"
        variant="outline"
        disabled={action.status === 'executing'}
        onClick={() => action.execute({ orderId })}
      >
        {action.status === 'executing' ? 'Cancelling…' : 'Cancel unpaid order'}
      </Button>
      {action.result.serverError ? (
        <p className="mt-1 text-sm text-destructive">{action.result.serverError}</p>
      ) : null}
    </div>
  );
}

export function RequestRefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const action = useAction(returnEscrowToBuyerAction, {
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="mt-2">
      <Button
        size="sm"
        variant="outline"
        disabled={action.status === 'executing'}
        onClick={() => {
          if (
            !window.confirm(
              'Request fake refund? Money returns to your test wallet (not real money).',
            )
          ) {
            return;
          }
          action.execute({ orderId });
        }}
      >
        {action.status === 'executing' ? 'Requesting…' : 'Apply for refund (test)'}
      </Button>
      <p className="mt-1 text-xs text-muted-foreground">
        Like Alibaba: unpaid → cancel; paid → apply for refund. TEST MODE only.
      </p>
      {action.result.serverError ? (
        <p className="mt-1 text-sm text-destructive">{action.result.serverError}</p>
      ) : null}
    </div>
  );
}
