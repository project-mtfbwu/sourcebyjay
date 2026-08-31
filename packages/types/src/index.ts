/** Shared domain types for web / vendor / ops portals. */

export type UserRole = 'buyer' | 'seller' | 'admin';

export type StaffRole = 'viewer' | 'manager' | 'admin' | 'super_admin';

export type VerificationTier = 'none' | 'basic' | 'verified' | 'gold' | 'assessed';

export type Portal = 'web' | 'vendor' | 'ops';

export type FormPersona = 'buyer' | 'seller';

export type FormFieldMode = 'required' | 'optional' | 'hidden';

export interface FormFieldConfig {
  id?: string;
  persona: FormPersona;
  fieldKey: string;
  label: string;
  mode: FormFieldMode;
  sortOrder: number;
}

export const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  viewer: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

export interface BuyerProfileFields {
  companyName: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  industry: string | null;
  gstin: string | null;
}

/** Scouted defaults when DB configs are empty. */
export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
  { persona: 'buyer', fieldKey: 'full_name', label: 'Full name', mode: 'required', sortOrder: 10 },
  { persona: 'buyer', fieldKey: 'email', label: 'Email', mode: 'required', sortOrder: 20 },
  { persona: 'buyer', fieldKey: 'phone', label: 'Phone', mode: 'required', sortOrder: 30 },
  { persona: 'buyer', fieldKey: 'password', label: 'Password', mode: 'required', sortOrder: 40 },
  { persona: 'buyer', fieldKey: 'company_name', label: 'Company name', mode: 'optional', sortOrder: 50 },
  { persona: 'buyer', fieldKey: 'gstin', label: 'GSTIN', mode: 'optional', sortOrder: 60 },
  { persona: 'buyer', fieldKey: 'industry', label: 'Industry', mode: 'optional', sortOrder: 70 },
  { persona: 'buyer', fieldKey: 'country', label: 'Country', mode: 'optional', sortOrder: 80 },
  { persona: 'buyer', fieldKey: 'city', label: 'City', mode: 'optional', sortOrder: 90 },
  { persona: 'seller', fieldKey: 'full_name', label: 'Full name', mode: 'required', sortOrder: 10 },
  { persona: 'seller', fieldKey: 'email', label: 'Work email', mode: 'required', sortOrder: 20 },
  { persona: 'seller', fieldKey: 'phone', label: 'Phone', mode: 'required', sortOrder: 30 },
  { persona: 'seller', fieldKey: 'password', label: 'Password', mode: 'required', sortOrder: 40 },
  { persona: 'seller', fieldKey: 'company_name', label: 'Company name', mode: 'required', sortOrder: 50 },
  { persona: 'seller', fieldKey: 'gstin', label: 'GSTIN', mode: 'required', sortOrder: 60 },
  { persona: 'seller', fieldKey: 'country', label: 'Country', mode: 'required', sortOrder: 70 },
  { persona: 'seller', fieldKey: 'city', label: 'City', mode: 'required', sortOrder: 80 },
  { persona: 'seller', fieldKey: 'main_products', label: 'Main products', mode: 'required', sortOrder: 90 },
  { persona: 'seller', fieldKey: 'description', label: 'Company description', mode: 'optional', sortOrder: 100 },
];

export function visibleFormFields(
  configs: FormFieldConfig[] | null | undefined,
  persona: FormPersona,
): FormFieldConfig[] {
  const list = configs?.length ? configs : DEFAULT_FORM_FIELDS;
  return list
    .filter((f) => f.persona === persona && f.mode !== 'hidden')
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function fieldMode(
  configs: FormFieldConfig[] | null | undefined,
  persona: FormPersona,
  fieldKey: string,
): FormFieldMode {
  const list = configs?.length ? configs : DEFAULT_FORM_FIELDS;
  const hit = list.find((f) => f.persona === persona && f.fieldKey === fieldKey);
  return hit?.mode ?? 'optional';
}

export {
  BUSINESS_TYPE_OPTIONS,
  CERT_TYPE_OPTIONS,
  GST_RATE_BPS_OPTIONS,
  gstRateLabel,
  isValidGstin,
  isValidHsn,
  isValidPan,
  isValidPincode,
  normalizeGstin,
  normalizePan,
} from './india';

export {
  filterLocationOptions,
  listCities,
  listCountries,
  listStates,
  type LocationOption,
} from './locations';

export {
  STOREFRONT_DRAFT_MESSAGE,
  STOREFRONT_PREVIEW_READY,
  categoryIdsFromMainProductsLabel,
  hydrateMainProductCategories,
  mainProductsLabelFromCategoryIds,
  mergeDraftIntoSupplier,
  mergeDraftIntoSupplierForPreview,
  normalizeStorefrontPayload,
  orderProductsByFeatured,
  parentCategoriesFromProductCategories,
  payloadFromSupplierRow,
  storefrontPreviewMediaUrl,
  type StorefrontCategoryOption,
  type StorefrontDraftPayload,
} from './storefront-draft';
