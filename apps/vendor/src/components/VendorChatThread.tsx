'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type Msg = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

export function VendorChatThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createBrowserSupabase();
    const { data, error: err } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (err) {
      setError(err.message);
      return;
    }
    setMessages((data as Msg[]) ?? []);
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`vendor-chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Msg;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { data, error: err } = await supabase.rpc('send_chat_message', {
        p_conversation_id: conversationId,
        p_body: body,
      });
      if (err) throw new Error(err.message);
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? 'Send failed');
      setDraft('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {messages.length === 0 ? (
          <p className="muted">No messages yet. Reply when a buyer writes you.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: mine ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: 16,
                    padding: '8px 12px',
                    background: mine ? 'var(--accent)' : '#eef0ea',
                    color: mine ? '#fff' : 'var(--ink)',
                    fontSize: 14,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.body}
                  <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4 }}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {error ? <p style={{ color: '#b00020', fontSize: 13 }}>{error}</p> : null}
      <textarea
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Reply to buyer…"
        style={{
          width: '100%',
          borderRadius: 8,
          border: '1px solid var(--border)',
          padding: 8,
          font: 'inherit',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn"
          disabled={sending || !draft.trim()}
          onClick={() => void send()}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
