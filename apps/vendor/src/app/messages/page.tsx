import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorChatThread } from '@/components/VendorChatThread';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

type SearchParams = Promise<{ c?: string }>;

export default async function VendorMessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { user, supplier } = await getSessionProfile();
  const params = await searchParams;

  if (!user || !supplier?.id) {
    return (
      <VendorAuthenticated title="Messages" subtitle="Buyer chats — one thread per buyer.">
        <div className="card denied">Complete seller signup to use messages.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, buyer_id, last_message_at, created_at')
    .eq('supplier_id', supplier.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const rows = conversations ?? [];
  const activeId =
    params.c && rows.some((r) => r.id === params.c)
      ? params.c
      : (rows[0]?.id as string | undefined);

  return (
    <VendorAuthenticated
      title="Messages"
      subtitle={`Buyer chats for ${supplier.name}. One thread per buyer.`}
    >
      {rows.length === 0 ? (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p className="muted">
            No buyer chats yet. When a buyer taps Chat on your product, it shows up here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'minmax(180px, 240px) 1fr',
            marginTop: '1rem',
          }}
        >
          <ul className="card" style={{ listStyle: 'none', margin: 0, padding: 8 }}>
            {rows.map((row) => {
              const selected = row.id === activeId;
              return (
                <li key={row.id}>
                  <Link
                    href={`/messages?c=${row.id}`}
                    style={{
                      display: 'block',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: selected ? '#e8f5ec' : 'transparent',
                      fontWeight: selected ? 700 : 500,
                      textDecoration: 'none',
                      color: 'var(--ink)',
                    }}
                  >
                    Buyer {String(row.buyer_id).slice(0, 8)}…
                    <span className="muted" style={{ display: 'block', fontSize: 11, fontWeight: 400 }}>
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
            <VendorChatThread conversationId={activeId} currentUserId={user.id} />
          ) : null}
        </div>
      )}
    </VendorAuthenticated>
  );
}
