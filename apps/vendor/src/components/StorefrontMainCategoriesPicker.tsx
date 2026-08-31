'use client';

import type { StorefrontCategoryOption } from '@sourcebyjay/types';

type Props = {
  options: StorefrontCategoryOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
};

export function StorefrontMainCategoriesPicker({ options, selectedIds, disabled, onChange }: Props) {
  const selected = selectedIds
    .map((id) => options.find((o) => o.id === id))
    .filter(Boolean) as StorefrontCategoryOption[];

  const available = options.filter((o) => !selectedIds.includes(o.id));

  function remove(id: string) {
    if (disabled) return;
    onChange(selectedIds.filter((x) => x !== id));
  }

  function add(id: string) {
    if (disabled || !id || selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  }

  return (
    <div className="storefront-category-picker">
      <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
        Pulled from parent categories of your published listings — e.g. Earbuds, EV cycle. Shown in
        the buyer stats strip.
      </p>

      {selected.length > 0 ? (
        <div className="storefront-category-pills" role="list" aria-label="Selected main product categories">
          {selected.map((cat) => (
            <span key={cat.id} className="storefront-category-pill" role="listitem">
              {cat.name}
              {!disabled ? (
                <button
                  type="button"
                  className="storefront-category-pill-remove"
                  aria-label={`Remove ${cat.name}`}
                  onClick={() => remove(cat.id)}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: '0 0 0.65rem', fontSize: '0.85rem' }}>
          No categories selected — add from your catalog groups below.
        </p>
      )}

      {available.length > 0 ? (
        <label className="storefront-category-add">
          <span className="storefront-field-label">Add category</span>
          <select
            disabled={disabled}
            value=""
            onChange={(e) => {
              add(e.target.value);
              e.target.value = '';
            }}
            style={{ width: '100%', font: 'inherit', padding: '0.45rem 0.55rem', marginTop: '0.35rem' }}
          >
            <option value="">Choose a category group…</option>
            {available.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
      ) : options.length === 0 ? (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Publish listings with categories first — parent groups appear here automatically.
        </p>
      ) : (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          All available category groups are selected.
        </p>
      )}
    </div>
  );
}
