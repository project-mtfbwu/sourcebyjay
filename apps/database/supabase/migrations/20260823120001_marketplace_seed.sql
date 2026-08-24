-- Seed marketplace data for SourceByJay

INSERT INTO public.categories (id, name, slug) VALUES
  ('c0000001-0000-4000-8000-000000000001', 'Apparel & Accessories', 'apparel-accessories'),
  ('c0000001-0000-4000-8000-000000000002', 'Consumer Electronics', 'consumer-electronics'),
  ('c0000001-0000-4000-8000-000000000003', 'Industrial Machinery', 'industrial-machinery'),
  ('c0000001-0000-4000-8000-000000000004', 'Packaging & Printing', 'packaging-printing'),
  ('c0000001-0000-4000-8000-000000000005', 'Renewable Energy', 'renewable-energy')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.suppliers (id, slug, name, verified, country, city, years_in_business, response_rate, main_products, description, banner_url) VALUES
  (
    '00000001-0000-4000-8000-000000000001'::uuid,
    'jaytech-industries',
    'JayTech Industries Co.',
    true,
    'China',
    'Shenzhen',
    12,
    '98%',
    'Electronics, Industrial Components',
    'JayTech Industries is a verified manufacturer specializing in consumer electronics and industrial components.',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=300&fit=crop'
  ),
  (
    '00000002-0000-4000-8000-000000000001'::uuid,
    'global-source-trading',
    'Global Source Trading Ltd.',
    true,
    'India',
    'Mumbai',
    8,
    '95%',
    'Textiles, Apparel, Packaging',
    'Global Source Trading connects international buyers with quality textile and packaging manufacturers.',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=300&fit=crop'
  ),
  (
    '00000003-0000-4000-8000-000000000001'::uuid,
    'precision-parts-co',
    'Precision Parts Co.',
    false,
    'Vietnam',
    'Ho Chi Minh City',
    5,
    '92%',
    'Machinery Parts, Tools',
    'Precision Parts Co. manufactures high-quality machinery components and tools.',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&h=300&fit=crop'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, slug, title, price, moq, is_local, image_url, images, category_id, supplier_id, description, specs, price_tiers, sold_count) VALUES
  (
    '10000001-0000-4000-8000-000000000001'::uuid,
    'wireless-bluetooth-earbuds-oem',
    'Wireless Bluetooth Earbuds OEM — Bulk Order',
    14.90,
    1,
    true,
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop"]'::jsonb,
    'c0000001-0000-4000-8000-000000000002',
    '00000001-0000-4000-8000-000000000001'::uuid,
    'Premium wireless Bluetooth earbuds with active noise cancellation.',
    '{"Bluetooth Version": "5.3", "Battery Life": "8 hours"}'::jsonb,
    '[{"minQty": 1, "price": 14.9}, {"minQty": 100, "price": 12.5}]'::jsonb,
    NULL
  ),
  (
    '10000002-0000-4000-8000-000000000001'::uuid,
    'organic-cotton-t-shirts-bulk',
    'Organic Cotton T-Shirts — Bulk Wholesale',
    0.16,
    100,
    false,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop"]'::jsonb,
    'c0000001-0000-4000-8000-000000000001',
    '00000002-0000-4000-8000-000000000001'::uuid,
    'GOTS-certified organic cotton t-shirts available in 20+ colors.',
    '{"Material": "100% Organic Cotton", "Weight": "180 GSM"}'::jsonb,
    '[{"minQty": 100, "price": 0.16}, {"minQty": 1000, "price": 0.12}]'::jsonb,
    26100
  ),
  (
    '10000003-0000-4000-8000-000000000001'::uuid,
    'cnc-machining-center-vmc850',
    'CNC Machining Center VMC-850',
    3980.00,
    1,
    true,
    'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop',
    '["https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=800&fit=crop"]'::jsonb,
    'c0000001-0000-4000-8000-000000000003',
    '00000003-0000-4000-8000-000000000001'::uuid,
    'Vertical machining center with 850mm travel.',
    '{"Table Size": "1000 x 500 mm", "Spindle Speed": "8000 RPM"}'::jsonb,
    '[{"minQty": 1, "price": 3980}]'::jsonb,
    NULL
  )
ON CONFLICT (slug) DO NOTHING;


