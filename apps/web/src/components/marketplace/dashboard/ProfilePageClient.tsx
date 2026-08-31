'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Profile } from '@/types/marketplace';
import { updateProfileAction } from '@/data/user/profile';
import { Badge } from '@/components/ui/badge';
import { LocationFields } from '@/components/marketplace/LocationFields';

const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL ?? 'http://localhost:3001';

const profileSchema = z.object({
  fullName: z.string().min(1).max(120),
  companyName: z.string().max(200).optional(),
  phone: z.string().min(8, 'Phone is required').max(40),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
  gstin: z.string().max(20).optional(),
  industry: z.string().max(120).optional(),
});

export function ProfilePageClient({ profile }: { profile: Profile }) {
  const router = useRouter();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName ?? '',
      companyName: profile.companyName ?? '',
      phone: profile.phone ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      bio: profile.bio ?? '',
      gstin: profile.gstin ?? '',
      industry: profile.industry ?? '',
    },
  });

  const { execute: saveProfile, status: profileStatus } = useAction(updateProfileAction, {
    onSuccess: () => {
      toast.success('Profile updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Buyer profile</h1>
        <Badge variant="secondary">buyer</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        This is your shopper account. Factory / seller accounts are separate — use{' '}
        <a href={`${vendorUrl}/signup`} className="text-brand-primary underline">
          Sell on SourceByJay
        </a>
        .
      </p>

      <form
        onSubmit={profileForm.handleSubmit((v) => saveProfile(v))}
        className="space-y-4 rounded-xl border p-6"
      >
        <h2 className="font-semibold">Account details</h2>
      <p className="text-sm text-muted-foreground">
        Alibaba / IndiaMART buyer basics: name, phone, company, location, GSTIN, industry. For
        multiple billing identities (GSTIN + address), use{' '}
        <a href="/account/business" className="text-brand-primary underline">
          Business details
        </a>
        .
      </p>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input {...profileForm.register('fullName')} />
          </div>
          <div className="space-y-2">
            <Label>Phone (required)</Label>
            <Input placeholder="+91…" {...profileForm.register('phone')} />
          </div>
          <div className="sm:col-span-2">
            <LocationFields
              defaultCountry={profileForm.watch('country') || 'India'}
              defaultCity={profileForm.watch('city') || ''}
              onCountryChange={(v) => profileForm.setValue('country', v)}
              onCityChange={(v) => profileForm.setValue('city', v)}
            />
          </div>
          <div className="space-y-2">
            <Label>GSTIN (optional for buyers)</Label>
            <Input placeholder="22AAAAA0000A1Z5" {...profileForm.register('gstin')} />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input placeholder="Apparel, electronics…" {...profileForm.register('industry')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Company name</Label>
          <Input {...profileForm.register('companyName')} />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea rows={3} {...profileForm.register('bio')} />
        </div>
        {profileForm.formState.errors.phone && (
          <p className="text-sm text-destructive">{profileForm.formState.errors.phone.message}</p>
        )}
        <Button type="submit" disabled={profileStatus === 'executing'}>
          Save profile
        </Button>
      </form>
    </div>
  );
}
