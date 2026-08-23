import type { Json } from '@/lib/database.types';

export type UserRole = 'buyer' | 'seller' | 'admin';
export type ListingStatus = 'draft' | 'published' | 'archived';

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  companyName: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface Supplier {
  id: string;
  slug: string;
  name: string;
  verified: boolean;
  country: string;
  city: string;
  yearsInBusiness: number;
  responseRate: string;
  mainProducts: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  ownerId?: string | null;
}

export interface PriceTier {
  minQty: number;
  price: number;
}

export interface ListingAttribute {
  key: string;
  value: string;
}

export interface ListingVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  moq: number;
  maxOrderQty?: number | null;
  soldCount?: number;
  isLocal?: boolean;
  status: ListingStatus;
  unit: string;
  imageUrl: string;
  images: string[];
  categoryId: string;
  supplierId: string;
  description: string;
  specs: Record<string, string>;
  priceTiers?: PriceTier[];
  leadTimeDays?: number | null;
  paymentTerms?: string | null;
  shippingInfo?: Record<string, string>;
  attributes?: ListingAttribute[];
  variants?: ListingVariant[];
  sampleAvailable?: boolean;
  customizationAvailable?: boolean;
}

export interface HotSearch {
  term: string;
  productSlug: string;
  imageUrl: string;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  moq?: number;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'moq-asc';
}

export interface ListingInput {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  currency?: string;
  moq: number;
  maxOrderQty?: number | null;
  unit?: string;
  imageUrl: string;
  images?: string[];
  specs?: Record<string, string>;
  priceTiers?: PriceTier[];
  leadTimeDays?: number | null;
  paymentTerms?: string | null;
  shippingInfo?: Record<string, string>;
  attributes?: ListingAttribute[];
  variants?: ListingVariant[];
  sampleAvailable?: boolean;
  customizationAvailable?: boolean;
  isLocal?: boolean;
  status?: ListingStatus;
}

export type DbProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  moq: number;
  max_order_qty: number | null;
  sold_count: number | null;
  is_local: boolean;
  status: ListingStatus;
  unit: string;
  image_url: string;
  images: Json;
  category_id: string | null;
  supplier_id: string;
  description: string;
  specs: Json;
  price_tiers: Json | null;
  lead_time_days: number | null;
  payment_terms: string | null;
  shipping_info: Json;
  attributes: Json;
  variants: Json;
  sample_available: boolean;
  customization_available: boolean;
};
