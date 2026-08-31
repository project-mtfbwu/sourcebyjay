'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addDisputeMessageAction } from '@/data/user/orders';
import { Button } from '@/components/ui/button';

export function DisputeMessageForm({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const action = useAction(addDisputeMessageAction, {
    onSuccess: () => {
      setBody('');
      router.refresh();
    },
  });

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        action.execute({ disputeId, body: body.trim() });
      }}
    >
      <textarea
        className="w-full rounded-md border px-3 py-2 text-sm"
        rows={3}
        placeholder="Add a message for ops / the other party…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
      />
      <Button type="submit" size="sm" disabled={action.status === 'executing' || !body.trim()}>
        {action.status === 'executing' ? 'Sending…' : 'Send message'}
      </Button>
      {action.result.serverError ? (
        <p className="text-sm text-destructive">{action.result.serverError}</p>
      ) : null}
    </form>
  );
}
