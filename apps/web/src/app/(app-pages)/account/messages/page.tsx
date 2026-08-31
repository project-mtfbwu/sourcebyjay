import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import { ChatThread } from '@/components/marketplace/chat/ChatThread';

type SearchParams = Promise<{ c?: string }>;

function AccountNav() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link href="/account/profile" className="text-muted-foreground hover:text-foreground">
        Profile
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/inquiries" className="text-muted-foreground hover:text-foreground">
        Inquiries
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/quotes" className="text-muted-foreground hover:text-foreground">
        Quotes
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/orders" className="text-muted-foreground hover:text-foreground">
        Orders
      </Link>
      <span className="text-muted-foreground">·</span>
      <span className="font-medium text-foreground">Messages</span>
    </div>
  );
}

async function MessagesContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const params = await searchParams;
  const supabase = await createSupabaseClient();

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, supplier_id, last_message_at, created_at, suppliers(name, slug)')
    .eq('buyer_id', userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const rows = conversations ?? [];
  const activeId =
    params.c && rows.some((r) => r.id === params.c)
      ? params.c
      : (rows[0]?.id as string | undefined);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <AccountNav />
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat with suppliers (one thread per factory — like Alibaba Message Center).
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No chats yet. Open a product and tap <strong>Chat</strong> to start.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <ul className="space-y-1 rounded-xl border bg-white p-2">
            {rows.map((row) => {
              const supplier = Array.isArray(row.suppliers) ? row.suppliers[0] : row.suppliers;
              const name = (supplier as { name?: string } | null)?.name ?? 'Supplier';
              const selected = row.id === activeId;
              return (
                <li key={row.id}>
                  <Link
                    href={`/account/messages?c=${row.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      selected ? 'bg-[#ff6600]/15 font-semibold' : 'hover:bg-muted'
                    }`}
                  >
                    {name}
                    <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                      {row.last_message_at
                        ? new Date(row.last_message_at).toLocaleString()
                        : 'New'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {activeId ? (
            <ChatThread conversationId={activeId} currentUserId={userId} />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function AccountMessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <MessagesContent searchParams={searchParams} />
    </Suspense>
  );
}
