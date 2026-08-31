import { createClient } from '@/lib/supabase';
import type { StaffRole, UserRole } from '@sourcebyjay/types';

export async function getOpsSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, staff: null };

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, role').eq('id', user.id).maybeSingle(),
    supabase
      .from('staff_members')
      .select('user_id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  return {
    user,
    profile: profile
      ? {
          id: profile.id as string,
          email: profile.email as string,
          fullName: (profile.full_name as string) ?? null,
          role: profile.role as UserRole,
        }
      : null,
    staff: staff
      ? {
          userId: staff.user_id as string,
          role: staff.role as StaffRole,
          isActive: Boolean(staff.is_active),
        }
      : null,
  };
}
