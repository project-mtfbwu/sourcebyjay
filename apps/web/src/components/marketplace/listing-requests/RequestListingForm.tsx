'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createListingRequestAction } from '@/data/user/listing-requests';

export function RequestListingForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryHint, setCategoryHint] = useState('');
  const [email, setEmail] = useState(defaultEmail);

  const { execute, status } = useAction(createListingRequestAction, {
    onSuccess: ({ data }) => {
      toast.success('Request posted — suppliers can bid');
      if (data?.listingRequestId) {
        router.push(`/request-listing?posted=${data.listingRequestId}`);
        router.refresh();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not post');
    },
  });

  return (
    <form
      className="mx-auto max-w-xl space-y-4 rounded-xl border bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        execute({
          title,
          description,
          contactEmail: email,
          quantity: quantity ? Number(quantity) : undefined,
          categoryHint: categoryHint || undefined,
        });
      }}
    >
      <div>
        <h1 className="text-2xl font-bold">Post a purchase request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Like Alibaba&apos;s public RFQ: describe what you need; suppliers find you and offer
          quotes. (Different from picking factories on search.)
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lr-title">What do you need?</Label>
        <Input
          id="lr-title"
          required
          minLength={5}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Custom CNC brackets — aluminum"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lr-desc">Details</Label>
        <Textarea
          id="lr-desc"
          required
          minLength={20}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Specs, materials, packaging, destination, timeline…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lr-qty">Quantity (optional)</Label>
          <Input
            id="lr-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lr-cat">Category hint (optional)</Label>
          <Input
            id="lr-cat"
            value={categoryHint}
            onChange={(e) => setCategoryHint(e.target.value)}
            placeholder="Machinery, textiles…"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lr-email">Contact email</Label>
        <Input
          id="lr-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={status === 'executing'}
        className="w-full bg-[#ff6600] hover:bg-[#e55c00]"
      >
        {status === 'executing' ? 'Posting…' : 'Get quotes now'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Prefer picking suppliers yourself?{' '}
        <Link href="/search?rfq=1" className="text-[#ff6600] hover:underline">
          Multi-supplier RFQ from search
        </Link>
      </p>
    </form>
  );
}
