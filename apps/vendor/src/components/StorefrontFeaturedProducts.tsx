'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type StorefrontCatalogProduct = {
  id: string;
  title: string;
  imageUrl: string;
};

function SortRow({
  product,
  onToggle,
  selected,
  disabled,
}: {
  product: StorefrontCatalogProduct;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !selected || disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`storefront-product-row${selected ? ' is-selected' : ''}`}
    >
      <label className="storefront-product-check">
        <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imageUrl || '/mockups/placeholder.jpeg'}
        alt=""
        className="storefront-product-thumb"
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src.endsWith('/mockups/placeholder.jpeg')) return;
          el.src = '/mockups/placeholder.jpeg';
        }}
      />
      <span className="storefront-product-title">{product.title}</span>
      {selected ? (
        <button type="button" className="storefront-drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
          ⋮⋮
        </button>
      ) : null}
    </div>
  );
}

export function StorefrontFeaturedProducts({
  products,
  selectedIds,
  disabled,
  onChange,
}: {
  products: StorefrontCatalogProduct[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as StorefrontCatalogProduct[];

  function toggle(id: string) {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= 8) return;
    onChange([...selectedIds, id]);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;
    onChange(arrayMove(selectedIds, selectedIds.indexOf(String(active.id)), selectedIds.indexOf(String(over.id))));
  }

  return (
    <div className="storefront-featured-products">
      <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
        Choose up to 8 published products for your storefront home tab. Drag selected items to set order.
        Listing count on the buyer page is automatic from your catalog.
      </p>
      {selectedProducts.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
            <div className="storefront-product-list storefront-product-list-selected">
              <p className="storefront-list-label">Featured order (home tab)</p>
              {selectedProducts.map((product) => (
                <SortRow
                  key={product.id}
                  product={product}
                  selected
                  disabled={disabled}
                  onToggle={() => toggle(product.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}
      <div className="storefront-product-list">
        <p className="storefront-list-label">Published listings</p>
        {products.length === 0 ? (
          <p className="muted">No published products yet — add listings first.</p>
        ) : (
          products
            .filter((p) => !selectedIds.includes(p.id))
            .map((product) => (
              <SortRow
                key={product.id}
                product={product}
                selected={false}
                disabled={disabled}
                onToggle={() => toggle(product.id)}
              />
            ))
        )}
      </div>
    </div>
  );
}
