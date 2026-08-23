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
import { becomeSellerAction, updateProfileAction } from '@/data/user/profile';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  fullName: z.string().min(1).max(120),
  companyName: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
});

const sellerSchema = z.object({
  companyName: z.string().min(2).max(200),
  country: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  mainProducts: z.string().min(2).max(500),
  description: z.string().min(10).max(3000),
  yearsInBusiness: z.coerce.number().int().min(0).max(100),
});

export function ProfilePageClient({
  profile,
  hasSupplier,
}: {
  profile: Profile;
  hasSupplier: boolean;
}) {
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
    },
  });

  const sellerForm = useForm({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      companyName: profile.companyName ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      mainProducts: '',
      description: '',
      yearsInBusiness: 1,
    },
  });

  const { execute: saveProfile, status: profileStatus } = useAction(updateProfileAction, {
    onSuccess: () => {
      toast.success('Profile updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  const { execute: becomeSeller, status: sellerStatus } = useAction(becomeSellerAction, {
    onSuccess: () => {
      toast.success('Seller account created!');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Could not create seller account'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Your profile</h1>
        <Badge variant={profile.role === 'seller' ? 'default' : 'secondary'}>{profile.role}</Badge>
      </div>

      <form
        onSubmit={profileForm.handleSubmit((v) => saveProfile(v))}
        className="space-y-4 rounded-xl border p-6"
      >
        <h2 className="font-semibold">Account details</h2>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input {...profileForm.register('fullName')} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...profileForm.register('phone')} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input {...profileForm.register('country')} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input {...profileForm.register('city')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea rows={3} {...profileForm.register('bio')} />
        </div>
        <Button type="submit" disabled={profileStatus === 'executing'}>
          Save profile
        </Button>
      </form>

      {!hasSupplier && (
        <form
          onSubmit={sellerForm.handleSubmit((v) => becomeSeller(v))}
          className="space-y-4 rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-6"
        >
          <h2 className="font-semibold">Become a seller</h2>
          <p className="text-sm text-muted-foreground">
            Register your company to start listing products on SourceByJay — like Alibaba supplier onboarding.
          </p>
          <div className="space-y-2">
            <Label>Company name</Label>
            <Input {...sellerForm.register('companyName')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input {...sellerForm.register('country')} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...sellerForm.register('city')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Main products</Label>
            <Input placeholder="Electronics, textiles..." {...sellerForm.register('mainProducts')} />
          </div>
          <div className="space-y-2">
            <Label>Company description</Label>
            <Textarea rows={4} {...sellerForm.register('description')} />
          </div>
          <div className="space-y-2">
            <Label>Years in business</Label>
            <Input type="number" {...sellerForm.register('yearsInBusiness')} />
          </div>
          <Button type="submit" disabled={sellerStatus === 'executing'}>
            Register as seller
          </Button>
        </form>
      )}
    </div>
  );
}
