import { getLoggedInUserId } from '@/data/user/user';
import { getMyInquiries } from '@/data/user/profile';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

function InquiriesFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

function formatInquiryTime(iso: string) {
  // Fixed UTC string — avoids locale / "current time" prerender issues.
  return iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

async function InquiriesContent() {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const inquiries = await getMyInquiries(userId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/account/profile" className="text-muted-foreground hover:text-foreground">
          Profile
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="font-medium text-foreground">My inquiries</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">My inquiries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          RFQs and product questions you sent to suppliers.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No inquiries yet.{' '}
          <Link href="/search" className="text-brand-primary hover:underline">
            Browse products
          </Link>{' '}
          and tap “Send inquiry”.
        </div>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {formatInquiryTime(inquiry.createdAt)}
                </span>
                {inquiry.quantity != null && (
                  <span className="font-medium">Qty {inquiry.quantity}</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{inquiry.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{inquiry.contactEmail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AccountInquiriesPage() {
  return (
    <Suspense fallback={<InquiriesFallback />}>
      <InquiriesContent />
    </Suspense>
  );
}
