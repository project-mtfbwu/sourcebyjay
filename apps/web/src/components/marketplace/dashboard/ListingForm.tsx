'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Category, Product } from '@/types/marketplace';
import { createListingAction, updateListingAction } from '@/data/user/listings';
import { ImageUpload } from '@/components/marketplace/dashboard/ImageUpload';

const formSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().length(3),
  moq: z.number().int().positive(),
  maxOrderQty: z.number().int().positive().optional().nullable(),
  unit: z.string().min(1).max(30),
  imageUrl: z.string().url(),
  leadTimeDays: z.number().int().min(0).max(365).optional().nullable(),
  paymentTerms: z.string().max(500).optional(),
  sampleAvailable: z.boolean(),
  customizationAvailable: z.boolean(),
  isLocal: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  specKey: z.string().optional(),
  specValue: z.string().optional(),
  priceTiers: z.array(z.object({ minQty: z.number().int().positive(), price: z.number().positive() })),
});

type FormValues = z.infer<typeof formSchema>;

interface ListingFormProps {
  categories: Category[];
  listing?: Product;
}

export function ListingForm({ categories, listing }: ListingFormProps) {
  const router = useRouter();
  const isEdit = Boolean(listing);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: listing?.title ?? '',
      description: listing?.description ?? '',
      categoryId: listing?.categoryId ?? categories[1]?.id ?? '',
      price: listing?.price ?? 1,
      currency: listing?.currency ?? 'USD',
      moq: listing?.moq ?? 1,
      maxOrderQty: listing?.maxOrderQty ?? undefined,
      unit: listing?.unit ?? 'piece',
      imageUrl: listing?.imageUrl ?? '',
      leadTimeDays: listing?.leadTimeDays ?? undefined,
      paymentTerms: listing?.paymentTerms ?? '',
      sampleAvailable: listing?.sampleAvailable ?? false,
      customizationAvailable: listing?.customizationAvailable ?? false,
      isLocal: listing?.isLocal ?? false,
      status: listing?.status ?? 'draft',
      priceTiers: listing?.priceTiers ?? [{ minQty: 1, price: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'priceTiers' });

  const { execute: createListing, status: createStatus } = useAction(createListingAction, {
    onSuccess: ({ data }) => {
      toast.success('Listing created');
      router.push(`/dashboard/listings/${data?.id}/edit`);
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Failed to create listing'),
  });

  const { execute: updateListing, status: updateStatus } = useAction(updateListingAction, {
    onSuccess: () => {
      toast.success('Listing updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Failed to update listing'),
  });

  const isLoading = createStatus === 'executing' || updateStatus === 'executing';

  function onSubmit(values: FormValues) {
    const specs: Record<string, string> = {};
    if (values.specKey && values.specValue) {
      specs[values.specKey] = values.specValue;
    }
    if (listing?.specs) Object.assign(specs, listing.specs);

    const payload = {
      title: values.title,
      description: values.description,
      categoryId: values.categoryId,
      price: values.price,
      currency: values.currency,
      moq: values.moq,
      maxOrderQty: values.maxOrderQty ?? null,
      unit: values.unit,
      imageUrl: values.imageUrl,
      images: [values.imageUrl],
      specs,
      priceTiers: values.priceTiers,
      leadTimeDays: values.leadTimeDays ?? null,
      paymentTerms: values.paymentTerms || null,
      sampleAvailable: values.sampleAvailable,
      customizationAvailable: values.customizationAvailable,
      isLocal: values.isLocal,
      status: values.status,
    };

    if (isEdit && listing) {
      updateListing({ ...payload, id: listing.id });
    } else {
      createListing(payload);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-4 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Basic info</h2>
        <div className="space-y-2">
          <Label htmlFor="title">Product title</Label>
          <Input id="title" {...form.register('title')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={5} {...form.register('description')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch('categoryId')}
              onValueChange={(v) => form.setValue('categoryId', v)}
            >
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.filter((c) => c.slug !== 'featured').map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(v) => form.setValue('status', v as FormValues['status'])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Main image</Label>
          <ImageUpload
            value={form.watch('imageUrl')}
            onChange={(url) => form.setValue('imageUrl', url, { shouldValidate: true })}
          />
          <Input id="imageUrl" placeholder="https://..." {...form.register('imageUrl')} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Pricing & MOQ</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Unit price (USD)</Label>
            <Input id="price" type="number" step="0.01" {...form.register('price')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moq">MOQ</Label>
            <Input id="moq" type="number" {...form.register('moq')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" placeholder="piece, set, kg..." {...form.register('unit')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxOrderQty">Max order qty (optional)</Label>
            <Input id="maxOrderQty" type="number" {...form.register('maxOrderQty')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadTimeDays">Lead time (days)</Label>
            <Input id="leadTimeDays" type="number" {...form.register('leadTimeDays')} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Volume pricing tiers</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ minQty: 100, price: 1 })}>
              Add tier
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input placeholder="Min qty" type="number" {...form.register(`priceTiers.${index}.minQty`)} />
              <Input placeholder="Price" type="number" step="0.01" {...form.register(`priceTiers.${index}.price`)} />
              <Button type="button" variant="ghost" onClick={() => remove(index)}>Remove</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">B2B options</h2>
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment terms</Label>
          <Input id="paymentTerms" placeholder="T/T 30% deposit, 70% before shipment" {...form.register('paymentTerms')} />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.watch('sampleAvailable')} onCheckedChange={(v) => form.setValue('sampleAvailable', Boolean(v))} />
            Sample available
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.watch('customizationAvailable')} onCheckedChange={(v) => form.setValue('customizationAvailable', Boolean(v))} />
            Customization / OEM
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.watch('isLocal')} onCheckedChange={(v) => form.setValue('isLocal', Boolean(v))} />
            Local stock badge
          </label>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Save listing' : 'Create listing'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/listings')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
