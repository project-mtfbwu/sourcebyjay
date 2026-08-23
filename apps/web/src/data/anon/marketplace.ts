import { cacheLife } from 'next/cache';

import type { Product, SearchFilters, Supplier, Category } from '@/types/marketplace';
import { createSupabaseAnonServerClient } from '@/supabase-clients/anon/createSupabaseAnonServerClient';
import { mapDbProduct } from '@/utils/marketplace-mappers';
import { getCategoryAndDescendantIds } from '@/utils/category-tree';
import {
  products as mockProducts,
  getProductBySlug as mockGetProductBySlug,
  getProductsBySupplier as mockGetProductsBySupplier,
  searchProducts as mockSearchProducts,
} from '@/data/mock/products';
import {
  suppliers as mockSuppliers,
  getSupplierBySlug as mockGetSupplierBySlug,
} from '@/data/mock/suppliers';
import { categories as mockCategories } from '@/data/mock/categories';

function mapDbSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    verified: Boolean(row.verified),
    country: row.country as string,
    city: row.city as string,
    yearsInBusiness: Number(row.years_in_business),
    responseRate: row.response_rate as string,
    mainProducts: row.main_products as string,
    description: row.description as string,
    bannerUrl: row.banner_url as string | undefined,
  };
}

function mapDbCategory(row: { id: string; name: string; slug: string; parent_id: string | null }): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
  };
}

async function fetchDbCategories(): Promise<Category[]> {
  'use cache';
  cacheLife('hours');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) return mockCategories;

  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error || !data?.length) return mockCategories;
  return data.map(mapDbCategory);
}

export async function getCategories() {
  return fetchDbCategories();
}

function applyClientFilters(results: Product[], filters: SearchFilters, categories: Category[]) {
  let filtered = results;

  if (filters.category) {
    const categoryIds = getCategoryAndDescendantIds(categories, filters.category);
    if (categoryIds.length) {
      filtered = filtered.filter((p) => categoryIds.includes(p.categoryId));
    }
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.moq !== undefined) {
    filtered = filtered.filter((p) => p.moq <= filters.moq!);
  }

  return filtered;
}

function sortProducts(results: Product[], sort?: SearchFilters['sort']) {
  const sorted = [...results];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'moq-asc':
      sorted.sort((a, b) => a.moq - b.moq);
      break;
    default:
      break;
  }
  return sorted;
}

export async function searchProducts(filters: SearchFilters): Promise<Product[]> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockSearchProducts(filters);
  }

  const categories = await fetchDbCategories();
  let query = supabase.from('products').select('*').eq('status', 'published');

  if (filters.q) {
    const { data: ftsData, error: ftsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .textSearch('search_vector', filters.q, { type: 'websearch', config: 'english' });

    if (!ftsError && ftsData?.length) {
      let results = ftsData.map(mapDbProduct);
      results = applyClientFilters(results, filters, categories);
      return sortProducts(results, filters.sort);
    }

    query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  }

  if (filters.category) {
    const categoryIds = getCategoryAndDescendantIds(categories, filters.category);
    if (categoryIds.length) {
      query = query.in('category_id', categoryIds);
    }
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.moq !== undefined) {
    query = query.lte('moq', filters.moq);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return mockSearchProducts(filters);
  }

  return sortProducts(data.map(mapDbProduct), filters.sort);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockGetProductBySlug(slug);
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return mockGetProductBySlug(slug);
  }

  return mapDbProduct(data);
}

export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockGetProductsBySupplier(supplierId);
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'published');

  if (error || !data?.length) {
    return mockGetProductsBySupplier(supplierId);
  }

  return data.map(mapDbProduct);
}

export async function getSupplierById(id: string): Promise<Supplier | undefined> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockSuppliers.find((s) => s.id === id);
  }

  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();

  if (error || !data) {
    return mockSuppliers.find((s) => s.id === id);
  }

  return mapDbSupplier(data);
}

export async function getSupplierBySlug(slug: string): Promise<Supplier | undefined> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockGetSupplierBySlug(slug);
  }

  const { data, error } = await supabase.from('suppliers').select('*').eq('slug', slug).single();

  if (error || !data) {
    return mockGetSupplierBySlug(slug);
  }

  return mapDbSupplier(data);
}

export async function getAllProducts(): Promise<Product[]> {
  'use cache';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockProducts;
  }

  const { data, error } = await supabase.from('products').select('*');

  if (error || !data?.length) {
    return mockProducts;
  }

  return data.map(mapDbProduct);
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  'use cache';
  cacheLife('hours');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockSuppliers;
  }

  const { data, error } = await supabase.from('suppliers').select('*');

  if (error || !data?.length) {
    return mockSuppliers;
  }

  return data.map(mapDbSupplier);
}
