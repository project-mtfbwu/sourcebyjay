'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { CategoryNode } from '@/utils/category-tree';

interface CategoryTreeProps {
  categories: CategoryNode[];
  currentSlug?: string;
  baseHref?: string;
}

function CategoryNodeItem({
  node,
  currentSlug,
  baseHref,
  depth,
}: {
  node: CategoryNode;
  currentSlug?: string;
  baseHref: string;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isActive = currentSlug === node.slug;

  return (
    <div>
      <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
        {hasChildren ? (
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-1 text-muted-foreground">
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          href={`${baseHref}?category=${node.slug}`}
          className={`flex-1 rounded px-2 py-1.5 text-sm hover:bg-muted ${
            isActive ? 'bg-brand-primary/20 font-medium' : ''
          }`}
        >
          {node.name}
        </Link>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoryNodeItem
              key={child.id}
              node={child}
              currentSlug={currentSlug}
              baseHref={baseHref}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({ categories, currentSlug, baseHref = '/search' }: CategoryTreeProps) {
  return (
    <nav className="space-y-0.5">
      <Link
        href={baseHref}
        className={`block rounded px-2 py-1.5 text-sm font-medium hover:bg-muted ${
          !currentSlug ? 'bg-brand-primary/20' : ''
        }`}
      >
        All categories
      </Link>
      {categories.map((node) => (
        <CategoryNodeItem
          key={node.id}
          node={node}
          currentSlug={currentSlug}
          baseHref={baseHref}
          depth={0}
        />
      ))}
    </nav>
  );
}
