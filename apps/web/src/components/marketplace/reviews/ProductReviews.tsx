import { Star } from 'lucide-react';

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
};

export function ProductReviews({
  reviews,
  average,
}: {
  reviews: ReviewRow[];
  average: number | null;
}) {
  return (
    <section className="rounded-xl border border-marketplace-border p-4">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Verified reviews</h3>
        {average != null ? (
          <p className="flex items-center gap-1 text-sm text-marketplace-muted">
            <Star className="size-4 fill-[#ff6600] text-[#ff6600]" />
            {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </p>
        ) : (
          <p className="text-sm text-marketplace-muted">No reviews yet</p>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-marketplace-muted">
          Reviews appear after a buyer completes an order with this supplier.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-marketplace-border pb-3 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{'★'.repeat(r.rating)}</span>
                {r.title ? <span className="font-semibold">{r.title}</span> : null}
                <span className="text-xs text-marketplace-muted">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-marketplace-muted">{r.body}</p>
              <p className="mt-1 text-[11px] font-medium text-[#ff6600]">Verified order</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
