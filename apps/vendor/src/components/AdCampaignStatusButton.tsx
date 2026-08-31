'use client';

import { useTransition } from 'react';
import { updateAdCampaignStatusAction } from '@/lib/ad-actions';

export function AdCampaignStatusButton({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const next = status === 'active' ? 'paused' : 'active';

  if (status !== 'active' && status !== 'paused') return null;

  return (
    <button
      type="button"
      className="btn secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await updateAdCampaignStatusAction(campaignId, next);
          if (!result.ok) alert(result.error);
          else window.location.reload();
        })
      }
    >
      {pending ? 'Saving…' : status === 'active' ? 'Pause' : 'Resume'}
    </button>
  );
}
