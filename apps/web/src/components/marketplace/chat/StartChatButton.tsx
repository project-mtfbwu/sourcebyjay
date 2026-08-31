'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChatThread } from '@/components/marketplace/chat/ChatThread';
import { openConversationAction } from '@/data/user/chat';
import { createClient } from '@/supabase-clients/client';

/**
 * Alibaba-style: Chat opens a right-side panel on the product page.
 * Full inbox stays at /account/messages for history.
 */
export function StartChatButton({
  supplierId,
  productId,
  supplierName,
  className,
  label = 'Chat',
}: {
  supplierId: string;
  productId?: string;
  supplierName?: string;
  className?: string;
  label?: string;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const { execute, status } = useAction(openConversationAction, {
    onSuccess: ({ data }) => {
      if (data?.conversationId) {
        setConversationId(data.conversationId);
        setOpen(true);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not start chat');
    },
  });

  if (!loggedIn) {
    return (
      <Button asChild variant="outline" className={className ?? 'flex-1'}>
        <Link href={`/login?next=/account/messages`}>
          <MessageCircle className="mr-2 size-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className ?? 'flex-1'}
        disabled={status === 'executing'}
        onClick={() => {
          if (conversationId) {
            setOpen(true);
            return;
          }
          execute({ supplierId, productId });
        }}
      >
        <MessageCircle className="mr-2 size-4" />
        {status === 'executing' ? 'Opening…' : label}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-marketplace-border px-4 py-3 text-left">
            <SheetTitle className="text-base">
              Chat with {supplierName ?? 'supplier'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Stay on this product page — same idea as Alibaba Message Center.
              {' '}
              <Link
                href={
                  conversationId
                    ? `/account/messages?c=${conversationId}`
                    : '/account/messages'
                }
                className="font-medium text-[#ff6600] underline-offset-2 hover:underline"
              >
                Open full inbox
              </Link>
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 p-3">
            {conversationId && userId ? (
              <ChatThread
                conversationId={conversationId}
                currentUserId={userId}
                className="h-[calc(100vh-8rem)] border-0 shadow-none"
              />
            ) : (
              <p className="p-4 text-sm text-marketplace-muted">Loading chat…</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
