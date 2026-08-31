'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { broadcastRfqAction } from '@/data/user/broadcast-rfq';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

type Target = { supplierId: string; productId?: string; label: string };

export function BroadcastRfqForm({
  targets,
  defaultEmail,
  defaultTitle,
}: {
  targets: Target[];
  defaultEmail: string;
  defaultTitle: string;
}) {
  const router = useRouter();
  const supplierCount = useMemo(
    () => new Set(targets.map((t) => t.supplierId)).size,
    [targets],
  );
  const [message, setMessage] = useState(
    defaultTitle
      ? `Looking for quotes on: ${defaultTitle}. Please share unit price, MOQ, and lead time.`
      : 'Please share unit price, MOQ, lead time, and shipping options.',
  );
  const [quantity, setQuantity] = useState('100');
  const [email, setEmail] = useState(defaultEmail);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const { execute, status, result } = useAction(broadcastRfqAction, {
    onSuccess: ({ data }) => {
      const skipped = data?.skippedQuota ?? 0;
      setDoneMsg(
        skipped > 0
          ? `Sent to ${data?.delivered ?? 0} supplier(s). ${skipped} skipped (weekly plan quota).`
          : `Sent to ${data?.delivered ?? 0} supplier(s).`,
      );
      router.refresh();
    },
  });

  if (supplierCount < 2) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Need products from at least 2 suppliers.{' '}
        <Link href="/search" className="text-brand-primary hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setDoneMsg(null);
        execute({
          targets: targets.map((t) => ({
            supplierId: t.supplierId,
            productId: t.productId,
          })),
          message,
          quantity: quantity ? Number(quantity) : undefined,
          contactEmail: email,
          title: defaultTitle || undefined,
        });
      }}
    >
      <div>
        <h1 className="text-2xl font-bold">Request quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One RFQ goes to {supplierCount} selected suppliers. Each can reply with their own quote.
        </p>
      </div>

      <ul className="rounded-xl border p-3 text-sm">
        {targets.map((t) => (
          <li key={`${t.supplierId}-${t.productId}`} className="py-1">
            {t.label}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Label htmlFor="qty">Quantity</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Contact email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="msg">Message</Label>
        <Textarea
          id="msg"
          required
          rows={5}
          minLength={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={status === 'executing'}>
        {status === 'executing' ? 'Sending…' : `Send RFQ to ${supplierCount} suppliers`}
      </Button>

      {result.serverError ? (
        <p className="text-sm text-destructive">{result.serverError}</p>
      ) : null}
      {doneMsg ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
          <p>{doneMsg}</p>
          <Link href="/account/inquiries" className="mt-2 inline-block text-brand-primary hover:underline">
            View my inquiries
          </Link>
        </div>
      ) : null}
    </form>
  );
}
