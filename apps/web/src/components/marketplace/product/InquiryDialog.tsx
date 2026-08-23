'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { createClient } from '@/supabase-clients/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitInquiryAction } from '@/data/user/inquiries';

interface InquiryDialogProps {
  productId: string;
  supplierId: string;
  productTitle: string;
  productSlug: string;
  type: 'contact' | 'rfq';
}

export function InquiryDialog({
  productId,
  supplierId,
  productTitle,
  productSlug,
  type,
}: InquiryDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });
  }, []);

  const { execute, status } = useAction(submitInquiryAction, {
    onSuccess: () => {
      toast.success(type === 'rfq' ? 'Quote request sent!' : 'Message sent to supplier!');
      setOpen(false);
      setMessage('');
      setQuantity('');
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Failed to send'),
  });

  const label = type === 'rfq' ? 'Request Quote' : 'Contact Supplier';

  if (!isLoggedIn) {
    return (
      <Button asChild variant={type === 'rfq' ? 'default' : 'outline'} className={type === 'rfq' ? 'flex-1 bg-marketplace-accent hover:bg-marketplace-accent/90' : 'flex-1'}>
        <Link href={`/login?next=/products/${productSlug}`}>{label}</Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={type === 'rfq' ? 'default' : 'outline'}
          className={type === 'rfq' ? 'flex-1 bg-marketplace-accent hover:bg-marketplace-accent/90' : 'flex-1'}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === 'rfq' ? 'Request for Quotation' : 'Contact Supplier'}</DialogTitle>
          <DialogDescription>
            {productTitle}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            execute({
              productId,
              supplierId,
              contactEmail: email,
              quantity: quantity ? Number(quantity) : undefined,
              message: message || (type === 'rfq' ? `RFQ for ${productTitle}` : `Inquiry about ${productTitle}`),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="inquiry-email">Your email</Label>
            <Input
              id="inquiry-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@company.com"
            />
          </div>
          {type === 'rfq' && (
            <div className="space-y-2">
              <Label htmlFor="inquiry-qty">Quantity needed</Label>
              <Input
                id="inquiry-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="inquiry-message">Message</Label>
            <Textarea
              id="inquiry-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'rfq' ? 'Specify requirements, customization, delivery timeline...' : 'Your questions for the supplier...'}
            />
          </div>
          <Button type="submit" className="w-full" disabled={status === 'executing'}>
            {status === 'executing' ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
