'use client';

import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createReviewAction } from '@/data/user/reviews';

export function ReviewOrderForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);

  const { execute, status } = useAction(createReviewAction, {
    onSuccess: () => {
      setDone(true);
      toast.success('Review published');
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not submit review');
    },
  });

  if (done) {
    return (
      <p className="mt-3 text-sm text-green-700">Thanks — your verified review is live.</p>
    );
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        execute({ orderId, rating, body, title: title || undefined });
      }}
    >
      <p className="text-xs font-medium text-muted-foreground">
        Verified purchase review (only after order completed — like Alibaba)
      </p>
      <div className="flex items-center gap-2">
        <Label htmlFor={`rating-${orderId}`} className="text-xs">
          Stars
        </Label>
        <select
          id={`rating-${orderId}`}
          className="h-8 rounded-md border bg-white px-2 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <Input
        placeholder="Short title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />
      <Textarea
        placeholder="What went well? Quality, packing, communication… (min 10 chars)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        required
        minLength={10}
      />
      <Button
        type="submit"
        size="sm"
        disabled={status === 'executing'}
        className="bg-[#ff6600] hover:bg-[#e55c00]"
      >
        {status === 'executing' ? 'Submitting…' : 'Post review'}
      </Button>
    </form>
  );
}
