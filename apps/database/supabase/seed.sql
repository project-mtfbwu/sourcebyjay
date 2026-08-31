-- Seed data for private_items table
-- This creates sample data for testing purposes
-- Insert test private_items with hardcoded UUIDs simulating different users
INSERT INTO public.private_items (id, name, description, created_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Project Alpha',
    'A comprehensive project management tool for agile teams',
    NOW() - INTERVAL '5 days'
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Marketing Campaign Q4',
    'Strategic marketing initiatives for the fourth quarter',
    NOW() - INTERVAL '3 days'
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Product Launch Checklist',
    'Complete checklist for new product launch procedures',
    NOW() - INTERVAL '1 day'
  ),
  (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Team Building Activities',
    'Collection of team building exercises and activities',
    NOW() - INTERVAL '7 days'
  ),
  (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Technical Documentation',
    'Comprehensive technical documentation for the platform',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed demo authors in auth.users
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'olivia@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Olivia Martin"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'liam@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Liam Patel"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'amelia@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Amelia Chen"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed blog posts
INSERT INTO public.content_blog_posts (id, slug, title, excerpt, body, author_id, is_published, published_at, created_at)
VALUES
  (
    '44444444-4444-4444-9444-444444444444',
    'supabase-workflows-at-scale',
    'Supabase Workflows at Scale',
    'How we orchestrate Supabase workflows for multi-tenant platforms.',
    'Supabase workflows require robust patterns for scaling teams and data-heavy workloads. In this post we walk through connection pooling, background jobs, and schema design tactics that keep queries fast under load.',
    '11111111-1111-4111-8111-111111111111',
    true,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '12 days'
  ),
  (
    '55555555-5555-4555-9555-555555555555',
    'designing-nextjs-edge-experiences',
    'Designing Next.js Edge Experiences',
    'Blueprints for delivering personalized UX at the edge with Next.js 15.',
    'Edge rendering with Next.js 15 unlocks real-time personalization. We explore caching strategies, streaming responses, and how to pair Supabase RLS with middleware to keep sessions fast and secure.',
    '22222222-2222-4222-8222-222222222222',
    true,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '9 days'
  ),
  (
    '66666666-6666-4666-9666-666666666666',
    'tailwind-shadcn-design-systems',
    'Tailwind + shadcn/ui Design Systems',
    'Practical guide for building cohesive UI systems with Tailwind and shadcn/ui.',
    'Design systems thrive on consistency. Learn how to blend Tailwind, shadcn/ui primitives, and Radix accessibility helpers to ship interfaces that scale with your product roadmap.',
    '33333333-3333-4333-8333-333333333333',
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    '77777777-7777-4777-9777-777777777777',
    'caching-strategies-for-rsc',
    'Caching Strategies for RSC',
    'Patterns for caching React Server Component data safely.',
    'React Server Components shift the caching story. We cover memoization utilities, revalidation, and how to avoid serving stale personalized content across tenants.',
    '11111111-1111-4111-8111-111111111111',
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    '88888888-8888-4888-9888-888888888888',
    'shipping-reliable-server-actions',
    'Shipping Reliable Server Actions',
    'Lessons learned from production hardening of Next.js server actions.',
    'Server actions remove client round-trips but require great observability. In this walkthrough we explore logging, retries, and coupling actions with pgTap tests to catch regressions.',
    '22222222-2222-4222-8222-222222222222',
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed blog post comments
INSERT INTO public.content_blog_post_comments (id, blog_post_id, author_id, body, created_at)
VALUES
  (
    '99999999-9999-4999-9999-999999999999',
    '44444444-4444-4444-9444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'Loved the section on connection pooling—would enjoy a deep dive on pgBouncer with Supabase.',
    NOW() - INTERVAL '8 days'
  ),
  (
    'aaaaaaa1-aaaa-4aaa-9aaa-aaaaaaaaaaa1',
    '55555555-5555-4555-9555-555555555555',
    '33333333-3333-4333-8333-333333333333',
    'This aligns perfectly with our edge A/B testing strategy. Appreciate the checklist at the end.',
    NOW() - INTERVAL '6 days'
  ),
  (
    'aaaaaaa2-aaaa-4aaa-9aaa-aaaaaaaaaaa2',
    '66666666-6666-4666-9666-666666666666',
    '11111111-1111-4111-8111-111111111111',
    'Great reminder to document tokens for each primitive. The color recipes example is gold.',
    NOW() - INTERVAL '4 days'
  ),
  (
    'aaaaaaa3-aaaa-4aaa-9aaa-aaaaaaaaaaa3',
    '77777777-7777-4777-9777-777777777777',
    '22222222-2222-4222-8222-222222222222',
    'Could you expand on revalidation timing for incremental static regeneration?',
    NOW() - INTERVAL '2 days'
  ),
  (
    'aaaaaaa4-aaaa-4aaa-9aaa-aaaaaaaaaaa4',
    '88888888-8888-4888-9888-888888888888',
    '33333333-3333-4333-8333-333333333333',
    'The pgTap section is super actionable—thanks for the tips on arranging fixtures.',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Local demo staff for ops portal (:3002) — cookie sb-sbj-ops-auth (isolated from buyer/seller)
-- Password: SourceByJay1!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'cccccccc-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'staff@sourcebyjay.test',
  crypt('SourceByJay1!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ops Staff Demo","account_type":"buyer"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'cccccccc-1111-4111-8111-111111111111',
  'cccccccc-1111-4111-8111-111111111111',
  format('{"sub":"%s","email":"%s"}', 'cccccccc-1111-4111-8111-111111111111', 'staff@sourcebyjay.test')::jsonb,
  'email',
  'cccccccc-1111-4111-8111-111111111111',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'cccccccc-1111-4111-8111-111111111111',
  'staff@sourcebyjay.test',
  'Ops Staff Demo',
  'buyer'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.staff_members (user_id, role, department, is_active)
VALUES (
  'cccccccc-1111-4111-8111-111111111111',
  'super_admin',
  'ops',
  true
)
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role, is_active = true, department = EXCLUDED.department;

-- Also roster the live local staff user if present (created outside seed)
INSERT INTO public.staff_members (user_id, role, department, is_active)
SELECT id, 'super_admin'::public.staff_role, 'ops', true
FROM auth.users
WHERE email = 'staff@sourcebyjay.test'
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin', is_active = true;

-- Marketplace demo listings should be visible on the storefront
UPDATE public.products SET status = 'published' WHERE status = 'draft';

-- Phase 9: default SourceByJay Guarantee policy (DML not always in schema diffs)
INSERT INTO public.guarantee_policies (
  id, name, coverage_quality, coverage_shipping, dispute_days,
  max_order_inr_cents, max_order_usd_cents, active
) VALUES (
  'a1000001-0000-4000-8000-000000000001',
  'Standard SourceByJay Guarantee',
  true, true, 30, 50000000, 1000000, true
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Phase 13 demo: ad seller, buyer, 10 listings, 5 active ad campaigns
-- Seller login: ads-demo-seller@sourcebyjay.test / Password123!
-- Buyer login: ads-demo-buyer@sourcebyjay.test / Password123!
-- Search "earbuds" or "bluetooth" on :3000 to see sponsored rows
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'dddddddd-1111-4111-8111-111111111111',
    'authenticated', 'authenticated',
    'ads-demo-seller@sourcebyjay.test',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ad Demo Seller","account_type":"seller"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'eeeeeeee-1111-4111-8111-111111111111',
    'authenticated', 'authenticated',
    'ads-demo-buyer@sourcebyjay.test',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ad Demo Buyer","account_type":"buyer"}',
    NOW(), NOW(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  (
    'dddddddd-1111-4111-8111-111111111111',
    'dddddddd-1111-4111-8111-111111111111',
    '{"sub":"dddddddd-1111-4111-8111-111111111111","email":"ads-demo-seller@sourcebyjay.test"}'::jsonb,
    'email', 'dddddddd-1111-4111-8111-111111111111', NOW(), NOW(), NOW()
  ),
  (
    'eeeeeeee-1111-4111-8111-111111111111',
    'eeeeeeee-1111-4111-8111-111111111111',
    '{"sub":"eeeeeeee-1111-4111-8111-111111111111","email":"ads-demo-buyer@sourcebyjay.test"}'::jsonb,
    'email', 'eeeeeeee-1111-4111-8111-111111111111', NOW(), NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, company_name, country, city)
VALUES
  ('dddddddd-1111-4111-8111-111111111111', 'ads-demo-seller@sourcebyjay.test', 'Ad Demo Seller', 'seller', 'SparkAds Factory Pvt Ltd', 'India', 'Delhi'),
  ('eeeeeeee-1111-4111-8111-111111111111', 'ads-demo-buyer@sourcebyjay.test', 'Ad Demo Buyer', 'buyer', 'Demo Import Co', 'India', 'Mumbai')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_name = EXCLUDED.company_name;

INSERT INTO public.suppliers (
  id, slug, name, verified, owner_id, country, city, years_in_business, response_rate,
  main_products, description, banner_url, verification_tier
)
VALUES (
  '00000004-0000-4000-8000-000000000001',
  'sparkads-factory',
  'SparkAds Factory Pvt Ltd',
  true,
  'dddddddd-1111-4111-8111-111111111111',
  'India',
  'Delhi',
  9,
  '99%',
  'Earbuds, speakers, textiles, packaging, solar',
  'Demo seller for Phase 13 hybrid ads — CPC search, CPM home, sponsorship spotlight.',
  '/mockups/placeholder.jpeg',
  'verified'
)
ON CONFLICT (slug) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  name = EXCLUDED.name,
  verified = true,
  verification_tier = 'verified';

INSERT INTO public.products (
  id, slug, title, price, currency, moq, is_local, image_url, images, category_id, supplier_id,
  description, specs, price_tiers, sold_count, status
) VALUES
  ('20000001-0000-4000-8000-000000000001', 'spark-anc-earbuds-pro', 'ANC Wireless Bluetooth Earbuds Pro — OEM Bulk', 899, 'INR', 100, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001',
   'Premium ANC earbuds with Bluetooth 5.3 for export buyers.', '{"Bluetooth":"5.3"}'::jsonb,
   '[{"minQty":100,"price":899}]'::jsonb, 4200, 'published'),
  ('20000002-0000-4000-8000-000000000001', 'spark-sports-earbuds-ipx7', 'Sports Bluetooth Earbuds IPX7 — Factory Direct', 649, 'INR', 200, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001',
   'Sweat-proof wireless earbuds for gym and outdoor brands.', '{}'::jsonb,
   '[{"minQty":200,"price":649}]'::jsonb, 1800, 'published'),
  ('20000003-0000-4000-8000-000000000001', 'spark-tws-earbuds-basic', 'TWS Earbuds Basic — MOQ 500', 399, 'INR', 500, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001',
   'Entry TWS earbuds for private label retailers.', '{}'::jsonb, NULL, 900, 'published'),
  ('20000004-0000-4000-8000-000000000001', 'spark-portable-bluetooth-speaker', 'Portable Bluetooth Speaker 20W', 1299, 'INR', 50, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001',
   'RGB portable speaker with deep bass for promotional gifts.', '{}'::jsonb, NULL, 650, 'published'),
  ('20000005-0000-4000-8000-000000000001', 'spark-organic-cotton-tee', 'Organic Cotton T-Shirt — GOTS Bulk', 89, 'INR', 500, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001',
   '180 GSM organic cotton tees — 20 colors.', '{}'::jsonb, NULL, 12000, 'published'),
  ('20000006-0000-4000-8000-000000000001', 'spark-kraft-mailer-box', 'Custom Kraft Mailer Boxes — MOQ 1000', 12, 'INR', 1000, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000001',
   'E-commerce mailer boxes with custom print.', '{}'::jsonb, NULL, 800, 'published'),
  ('20000007-0000-4000-8000-000000000001', 'spark-solar-panel-100w', 'Mono Solar Panel 100W — Export Grade', 4500, 'INR', 10, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000005', '00000004-0000-4000-8000-000000000001',
   'Tier-1 solar modules for distributors.', '{}'::jsonb, NULL, 220, 'published'),
  ('20000008-0000-4000-8000-000000000001', 'spark-cnc-aluminum-part', 'CNC Aluminum Parts — Precision OEM', 250, 'INR', 100, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000001',
   '5-axis CNC machining for industrial buyers.', '{}'::jsonb, NULL, 90, 'published'),
  ('20000009-0000-4000-8000-000000000001', 'spark-smart-watch-oem', 'Smart Watch OEM — Bluetooth Calling', 1899, 'INR', 100, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001',
   'Bluetooth smartwatch with custom logo dial.', '{}'::jsonb, NULL, 1100, 'published'),
  ('20000010-0000-4000-8000-000000000001', 'spark-eco-jute-bag', 'Eco Jute Tote Bags — Print Ready', 45, 'INR', 2000, true,
   '/mockups/placeholder.jpeg',
   '["/mockups/placeholder.jpeg"]'::jsonb,
   'c0000001-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000001',
   'Sustainable jute bags for retail chains.', '{}'::jsonb, NULL, 5400, 'published')
ON CONFLICT (slug) DO UPDATE SET status = 'published', supplier_id = EXCLUDED.supplier_id;

INSERT INTO public.ad_wallets (supplier_id, balance_inr_cents)
VALUES ('00000004-0000-4000-8000-000000000001', 5000000)
ON CONFLICT (supplier_id) DO UPDATE SET balance_inr_cents = GREATEST(ad_wallets.balance_inr_cents, 5000000);

INSERT INTO public.ad_campaigns (
  id, supplier_id, name, status, billing_model, placement_types,
  max_cpc_bid_inr_cents, cpm_rate_inr_cents, sponsorship_daily_inr_cents,
  daily_budget_inr_cents, total_budget_inr_cents, created_by_user_id
) VALUES
  ('a1000001-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001',
   'CPC — Earbuds search', 'active', 'cpc', ARRAY['search_results_top', 'search_sidebar'],
   500, NULL, NULL, 500000, NULL, 'dddddddd-1111-4111-8111-111111111111'),
  ('a1000002-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001',
   'CPC — Bluetooth audio', 'active', 'cpc', ARRAY['search_results_top'],
   450, NULL, NULL, 300000, NULL, 'dddddddd-1111-4111-8111-111111111111'),
  ('a1000003-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001',
   'CPM — Home featured carousel', 'active', 'cpm', ARRAY['home_featured'],
   NULL, 150, NULL, 200000, NULL, 'dddddddd-1111-4111-8111-111111111111'),
  ('a1000004-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001',
   'CPM — Category electronics banner', 'active', 'cpm', ARRAY['category_banner'],
   NULL, 100, NULL, 150000, NULL, 'dddddddd-1111-4111-8111-111111111111'),
  ('a1000005-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001',
   'Sponsorship — Supplier spotlight', 'active', 'sponsorship', ARRAY['supplier_spotlight', 'home_featured'],
   NULL, NULL, 50000, 100000, NULL, 'dddddddd-1111-4111-8111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ad_creatives (id, campaign_id, product_id, headline_override, sort_order) VALUES
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001', '20000001-0000-4000-8000-000000000001', 'Sponsored — Factory Direct ANC Earbuds', 0),
  ('b1000002-0000-4000-8000-000000000001', 'a1000002-0000-4000-8000-000000000001', '20000002-0000-4000-8000-000000000001', 'Top sports earbuds — MOQ 200', 0),
  ('b1000003-0000-4000-8000-000000000001', 'a1000003-0000-4000-8000-000000000001', '20000004-0000-4000-8000-000000000001', 'Featured Bluetooth speaker — sample available', 0),
  ('b1000004-0000-4000-8000-000000000001', 'a1000004-0000-4000-8000-000000000001', '20000009-0000-4000-8000-000000000001', 'Smart watch OEM — export ready', 0),
  ('b1000005-0000-4000-8000-000000000001', 'a1000005-0000-4000-8000-000000000001', '20000007-0000-4000-8000-000000000001', 'Verified solar supplier — Delhi factory', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ad_keywords (campaign_id, keyword, match_type) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'earbuds', 'broad'),
  ('a1000001-0000-4000-8000-000000000001', 'wireless earbuds', 'phrase'),
  ('a1000001-0000-4000-8000-000000000001', 'bluetooth earbuds', 'broad'),
  ('a1000002-0000-4000-8000-000000000001', 'bluetooth', 'broad'),
  ('a1000002-0000-4000-8000-000000000001', 'speaker', 'broad'),
  ('a1000002-0000-4000-8000-000000000001', 'audio', 'broad')
ON CONFLICT DO NOTHING;

-- Phase 14 demo: Business plan + factory video + product video (visual demo seed)
UPDATE public.vendor_subscriptions vs
SET
  plan_id = lp.id,
  status = 'active',
  notes = 'Phase 14 demo — Business plan for video tab + slots',
  updated_at = NOW()
FROM public.listing_plans lp
WHERE vs.supplier_id = '00000004-0000-4000-8000-000000000001'
  AND lp.slug = 'business'
  AND vs.status IN ('active', 'comped');

INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status, notes)
SELECT
  '00000004-0000-4000-8000-000000000001',
  lp.id,
  'active',
  'Phase 14 demo — Business plan for video tab + slots'
FROM public.listing_plans lp
WHERE lp.slug = 'business'
  AND NOT EXISTS (
    SELECT 1 FROM public.vendor_subscriptions vs
    WHERE vs.supplier_id = '00000004-0000-4000-8000-000000000001'
      AND vs.status IN ('active', 'comped')
  );

UPDATE public.products
SET
  video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  product_video_enabled = true,
  updated_at = NOW()
WHERE slug = 'spark-anc-earbuds-pro';

INSERT INTO public.supplier_gallery (
  id, supplier_id, media_type, image_url, caption, sort_order, status,
  content_kind, video_url, uploaded_by, reviewed_at
)
VALUES (
  'f1000001-0000-4000-8000-000000000001',
  '00000004-0000-4000-8000-000000000001',
  'factory',
  '/mockups/placeholder.jpeg',
  'Factory floor tour — assembly line (demo)',
  0,
  'approved',
  'video',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'dddddddd-1111-4111-8111-111111111111',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  content_kind = EXCLUDED.content_kind,
  video_url = EXCLUDED.video_url,
  status = 'approved',
  caption = EXCLUDED.caption;
