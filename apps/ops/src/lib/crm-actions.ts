'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';

async function requireManager() {
  const session = await getOpsSession();
  const { user, profile, staff } = session;
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false as const, error: 'Staff access required.', session };
  }
  if (!hasStaffRole(staff?.role, 'manager')) {
    return { ok: false as const, error: 'Manager+ required.', session };
  }
  return { ok: true as const, session };
}

export async function updateListingAction(formData: FormData): Promise<void> {
  const gate = await requireManager();
  if (!gate.ok) return;

  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const moq = Number(formData.get('moq'));
  const status = String(formData.get('status') ?? 'published');
  if (!id || !title || !Number.isFinite(price) || !Number.isFinite(moq)) return;
  if (!['draft', 'published', 'archived'].includes(status)) return;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from('products')
    .select('id, title, price, moq, status, supplier_id')
    .eq('id', id)
    .maybeSingle();
  if (!before) return;

  const { error } = await supabase
    .from('products')
    .update({
      title,
      description,
      price,
      moq: Math.max(1, Math.floor(moq)),
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return;

  await supabase.from('audit_logs').insert({
    actor_id: gate.session.user!.id,
    action: 'ops.listing.update',
    entity_type: 'product',
    entity_id: id,
    metadata: {
      before,
      after: { title, price, moq, status },
      supplier_id: before.supplier_id,
    },
  });

  revalidatePath('/listings');
  revalidatePath(`/listings/${id}`);
  revalidatePath(`/vendors/${before.supplier_id as string}`);
}

export async function updateSupplierAction(formData: FormData): Promise<void> {
  const gate = await requireManager();
  if (!gate.ok) return;

  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const mainProducts = String(formData.get('main_products') ?? '').trim();
  if (!id || !name || !city || !country) return;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from('suppliers')
    .select('id, name, city, country, description, main_products')
    .eq('id', id)
    .maybeSingle();
  if (!before) return;

  const { error } = await supabase
    .from('suppliers')
    .update({
      name,
      city,
      country,
      description,
      main_products: mainProducts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return;

  await supabase.from('audit_logs').insert({
    actor_id: gate.session.user!.id,
    action: 'ops.supplier.update',
    entity_type: 'supplier',
    entity_id: id,
    metadata: {
      before,
      after: { name, city, country, description, main_products: mainProducts },
    },
  });

  revalidatePath('/vendors');
  revalidatePath(`/vendors/${id}`);
}
