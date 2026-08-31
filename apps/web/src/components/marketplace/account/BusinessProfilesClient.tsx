'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  deleteBuyerBusinessProfileAction,
  saveBuyerBusinessProfileAction,
  type BuyerBusinessProfile,
} from '@/data/user/business-profiles';
import { LocationFields } from '@/components/marketplace/LocationFields';

export function BusinessProfilesClient({ profiles }: { profiles: BuyerBusinessProfile[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<BuyerBusinessProfile | null>(null);

  const { execute: save, status: saveStatus } = useAction(saveBuyerBusinessProfileAction, {
    onSuccess: () => {
      toast.success('Business details saved');
      setEditing(null);
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Save failed'),
  });

  const { execute: remove } = useAction(deleteBuyerBusinessProfileAction, {
    onSuccess: () => {
      toast.success('Removed');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Delete failed'),
  });

  const form = editing ?? {
    id: undefined,
    label: 'Default',
    companyName: '',
    gstin: '',
    pan: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: profiles.length === 0,
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Save company + GSTIN for invoices and RFQs (IndiaMART buyer pattern). Use on orders without
        re-typing each time.
      </p>

      {profiles.length > 0 ? (
        <ul className="space-y-3">
          {profiles.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">
                  {p.label}
                  {p.isDefault ? (
                    <span className="ml-2 text-xs text-[#c2410c]">Default</span>
                  ) : null}
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove({ id: p.id })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.companyName ?? '—'}
                {p.gstin ? ` · GSTIN ${p.gstin}` : ''}
                {p.city ? ` · ${p.city}` : ''}
                {p.pincode ? ` ${p.pincode}` : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No saved business details yet. Add one below for GST invoices.
        </div>
      )}

      <form
        key={editing?.id ?? 'new'}
        className="space-y-4 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          save({
            id: editing?.id,
            label: String(fd.get('label')),
            companyName: String(fd.get('companyName') || '') || undefined,
            gstin: String(fd.get('gstin') || '') || undefined,
            pan: String(fd.get('pan') || '') || undefined,
            addressLine1: String(fd.get('addressLine1') || '') || undefined,
            addressLine2: String(fd.get('addressLine2') || '') || undefined,
            city: String(fd.get('city') || '') || undefined,
            state: String(fd.get('state') || '') || undefined,
            pincode: String(fd.get('pincode') || '') || undefined,
            country: String(fd.get('country') || 'India') || undefined,
            isDefault: fd.get('isDefault') === 'on',
          });
        }}
      >
        <h2 className="font-semibold">{editing ? 'Edit' : 'Add'} business details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" required defaultValue={form.label} placeholder="HQ / Mumbai office" />
          </div>
          <div>
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" name="companyName" defaultValue={form.companyName ?? ''} />
          </div>
          <div>
            <Label htmlFor="gstin">GSTIN</Label>
            <Input id="gstin" name="gstin" defaultValue={form.gstin ?? ''} placeholder="22AAAAA0000A1Z5" />
          </div>
          <div>
            <Label htmlFor="pan">PAN (optional)</Label>
            <Input id="pan" name="pan" defaultValue={form.pan ?? ''} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" name="addressLine1" defaultValue={form.addressLine1 ?? ''} />
          </div>
          <LocationFields
            defaultCountry={form.country}
            defaultState={form.state ?? ''}
            defaultCity={form.city ?? ''}
            stateRequired
            cityRequired
          />
          <div>
            <Label htmlFor="pincode">PIN code</Label>
            <Input id="pincode" name="pincode" defaultValue={form.pincode ?? ''} maxLength={6} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="isDefault" type="checkbox" defaultChecked={form.isDefault} />
          Use as default for new RFQs / orders
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveStatus === 'executing'}>
            {saveStatus === 'executing' ? 'Saving…' : 'Save'}
          </Button>
          {editing ? (
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
