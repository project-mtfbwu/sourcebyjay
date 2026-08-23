import type { Category } from '@/types/marketplace';

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else if (!cat.parentId || cat.slug === 'featured') {
      if (cat.slug !== 'featured') roots.push(node);
    }
  }

  // If no roots from parent_id, fall back to flat top-level (exclude featured)
  if (roots.length === 0) {
    return categories
      .filter((c) => c.slug !== 'featured')
      .map((c) => ({ ...c, children: [] }));
  }

  return roots;
}

export function getCategoryAndDescendantIds(categories: Category[], slug: string): string[] {
  const tree = buildCategoryTree(categories);
  const ids: string[] = [];

  function walk(nodes: CategoryNode[]) {
    for (const node of nodes) {
      if (node.slug === slug) {
        collect(node);
        return true;
      }
      if (walk(node.children)) return true;
    }
    return false;
  }

  function collect(node: CategoryNode) {
    ids.push(node.id);
    node.children.forEach(collect);
  }

  walk(tree);

  const flat = categories.find((c) => c.slug === slug);
  if (ids.length === 0 && flat) ids.push(flat.id);

  return ids;
}
