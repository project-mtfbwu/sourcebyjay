'use client';

import { useAction } from 'next-safe-action/hooks';
import { acceptQuoteAction, rejectQuoteAction } from '@/data/user/orders';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function QuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const accept = useAction(acceptQuoteAction, {
    onSuccess: () => router.refresh(),
  });
  const reject = useAction(rejectQuoteAction, {
    onSuccess: () => router.refresh(),
  });

  const busy = accept.status === 'executing' || reject.status === 'executing';

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={busy}
        onClick={() => accept.execute({ quoteId })}
      >
        {accept.status === 'executing' ? 'Accepting…' : 'Accept quote'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => reject.execute({ quoteId })}
      >
        Decline
      </Button>
      {accept.result.serverError ? (
        <p className="w-full text-sm text-destructive">{accept.result.serverError}</p>
      ) : null}
      {reject.result.serverError ? (
        <p className="w-full text-sm text-destructive">{reject.result.serverError}</p>
      ) : null}
    </div>
  );
}
