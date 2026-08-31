import { getLoggedInUserId } from '@/data/user/user';
import { ensureProfile, getMyProfile } from '@/data/user/profile';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { ProfilePageClient } from '@/components/marketplace/dashboard/ProfilePageClient';

export default async function ProfilePage() {
  const { user } = await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const profile = (await getMyProfile(userId)) ?? (await ensureProfile(userId, user.email!));

  return <ProfilePageClient profile={profile} />;
}
