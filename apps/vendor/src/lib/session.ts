import { createClient } from '@/lib/supabase';
import type { UserRole } from '@sourcebyjay/types';

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, supplier: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, company_name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name, slug, verification_tier')
    .eq('owner_id', user.id)
    .maybeSingle();

  return {
    user,
    profile: profile
      ? {
          id: profile.id as string,
          email: profile.email as string,
          fullName: (profile.full_name as string) ?? null,
          role: profile.role as UserRole,
          companyName: (profile.company_name as string) ?? null,
        }
      : null,
    supplier,
  };
}
