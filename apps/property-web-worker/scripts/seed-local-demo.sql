-- Local D1 seed helpers. App seed inventory lives in TypeScript (Gamuda/Vinhomes/Ecopark/Đất Xanh).
-- Apply only to local DB: wrangler d1 execute ancu-property-db --local --file=scripts/seed-local-demo.sql
-- Does not invent real prices/areas/handover dates.

INSERT OR IGNORE INTO developers (
  id, slug, name, website, source_class, provenance
) VALUES (
  'dev_gamuda_land',
  'gamuda-land',
  'Gamuda Land',
  'https://www.gamudaland.com.vn',
  'verified_public',
  'Public developer website'
);


INSERT OR IGNORE INTO developers (
  id, slug, name, website, source_class, provenance
) VALUES
  ('dev_vinhomes', 'vinhomes', 'Vinhomes', 'https://vinhomes.vn', 'verified_public', 'Vinhomes / Vingroup public corporate pages'),
  ('dev_ecopark', 'ecopark', 'Ecopark', 'https://ecopark.com.vn', 'verified_public', 'Ecopark public website'),
  ('dev_dat_xanh_bluemarq', 'dat-xanh-bluemarq', 'Đất Xanh / Bluemarq Group', 'https://www.datxanh.com.vn', 'verified_public', 'Đất Xanh public disclosures; Bluemarq brand transition');

INSERT OR REPLACE INTO projects (
  id, developer_id, slug, name, tagline, description, city, district, address,
  latitude, longitude, handover, price_range, total_units, status, source_class,
  provenance, confidence
) VALUES (
  'proj_d1_admin_demo',
  'dev_gamuda_land',
  'd1-admin-published-demo',
  'D1 Admin Published Demo',
  'Fixture — dự án chỉ có trong D1 (sanitized)',
  'Dự án demo publish qua D1 để kiểm tra merge API + SPA. Không phải listing thật.',
  'TP. Hồ Chí Minh',
  'Quận 7',
  'Chờ xác minh',
  10.732,
  106.721,
  'Chờ xác minh',
  'Chờ xác minh',
  'Chờ xác minh',
  'published',
  'estimated',
  'Sanitized D1 local seed — not a live listing',
  0.3
);

INSERT OR REPLACE INTO apartment_types (
  id, project_id, slug, name, bedrooms, bathrooms, area_sqm, floorplan_key, price,
  source_class, provenance, confidence, validation_summary
) VALUES (
  'apt_d1_demo_studio',
  'proj_d1_admin_demo',
  'studio-a',
  'Studio A',
  0,
  1,
  'Chờ xác minh',
  'studio',
  'Chờ xác minh',
  'estimated',
  'Demo floorplan mapping',
  0.3,
  'Demo sample FloorPlanDocument'
);

INSERT OR REPLACE INTO amenities (id, project_id, category, name, source_class) VALUES (
  'am_d1_demo_park',
  'proj_d1_admin_demo',
  'park',
  'Công viên nội khu (demo D1)',
  'estimated'
);

INSERT OR REPLACE INTO nearby_places (
  id, project_id, category, name, latitude, longitude, distance_km, travel_time, source_class
) VALUES (
  'near_d1_demo_poi',
  'proj_d1_admin_demo',
  'transport',
  'Trục đường Q7 (demo D1)',
  10.733,
  106.722,
  '~0.5',
  'Chờ xác minh',
  'estimated'
);
