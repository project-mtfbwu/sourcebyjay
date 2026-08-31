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
  type: 'contact' | 'rfq' | 'sample';
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function InquiryDialog({
  productId,
  supplierId,
  productTitle,
  productSlug,
  type,
  label: labelProp,
  variant: variantProp,
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
      toast.success(
        type === 'rfq'
          ? 'Quote request sent!'
          : type === 'sample'
            ? 'Sample request sent!'
            : 'Message sent to supplier!',
      );
      setOpen(false);
      setMessage('');
      setQuantity('');
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Failed to send'),
  });

  const label =
    labelProp ??
    (type === 'rfq' ? 'Request Quote' : type === 'sample' ? 'Request sample' : 'Contact Supplier');
  const isPrimary = type === 'rfq';
  const buttonVariant = variantProp ?? (isPrimary ? 'default' : 'outline');
  const buttonClass = isPrimary
    ? 'flex-1 bg-marketplace-accent hover:bg-marketplace-accent/90'
    : 'flex-1';

  const dialogTitle =
    type === 'rfq'
      ? 'Request for Quotation'
      : type === 'sample'
        ? 'Request a sample'
        : 'Send inquiry';

  const defaultMessage =
    type === 'rfq'
      ? `RFQ for ${productTitle}`
      : type === 'sample'
        ? `Sample request for ${productTitle}`
        : `Inquiry about ${productTitle}`;

  if (!isLoggedIn) {
    return (
      <Button asChild variant={buttonVariant} className={buttonClass}>
        <Link href={`/login?next=/products/${productSlug}`}>{label}</Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={buttonClass}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{productTitle}</DialogDescription>
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
              message: message || defaultMessage,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="inquiry-email">Email</Label>
            <Input
              id="inquiry-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {(type === 'rfq' || type === 'sample') && (
            <div className="space-y-2">
              <Label htmlFor="inquiry-qty">Quantity</Label>
              <Input
                id="inquiry-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="inquiry-msg">Message</Label>
            <Textarea
              id="inquiry-msg"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'rfq'
                  ? 'Specify requirements, customization, delivery timeline...'
                  : type === 'sample'
                    ? 'Sample size, shipping address notes…'
                    : 'Your questions for the supplier...'
              }
            />
          </div>
          <Button type="submit" disabled={status === 'executing'} className="w-full">
            {status === 'executing' ? 'Sending…' : label}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
