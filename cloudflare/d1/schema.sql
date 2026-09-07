PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shoe_products (
  product_id INTEGER PRIMARY KEY,
  brand_id INTEGER,
  name TEXT NOT NULL,
  model TEXT,
  colorway TEXT,
  style_code TEXT,
  gender TEXT,
  category TEXT,
  description TEXT,
  retail_price REAL,
  currency TEXT,
  available_sizes_json TEXT,
  product_url TEXT,
  image_url TEXT,
  image_source TEXT,
  image_usage TEXT,
  source_name TEXT,
  source_id TEXT,
  rank_score REAL,
  rank_within_brand INTEGER,
  popularity_tier TEXT,
  market_signals_json TEXT,
  source_data_json TEXT,
  status TEXT,
  created_at TEXT,
  updated_at TEXT,
  price_type TEXT,
  price_reference_at TEXT,
  verification_status TEXT,
  verification_notes_json TEXT,
  size_profile_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_shoe_products_status ON shoe_products(status);
CREATE INDEX IF NOT EXISTS idx_shoe_products_brand ON shoe_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_shoe_products_style ON shoe_products(style_code);
CREATE INDEX IF NOT EXISTS idx_shoe_products_category ON shoe_products(category);
CREATE INDEX IF NOT EXISTS idx_shoe_products_price ON shoe_products(retail_price);
CREATE INDEX IF NOT EXISTS idx_shoe_products_name ON shoe_products(name);

CREATE TABLE IF NOT EXISTS shoe_product_media (
  media_id INTEGER PRIMARY KEY,
  master_product_id INTEGER NOT NULL,
  source_id INTEGER,
  media_url TEXT NOT NULL,
  media_type TEXT,
  verification_status TEXT,
  storefront_approved INTEGER DEFAULT 0,
  content_verified INTEGER,
  created_at TEXT,
  updated_at TEXT,
  raw_json TEXT,
  FOREIGN KEY(master_product_id) REFERENCES shoe_products(product_id)
);
CREATE INDEX IF NOT EXISTS idx_media_product ON shoe_product_media(master_product_id);
CREATE INDEX IF NOT EXISTS idx_media_verified ON shoe_product_media(storefront_approved, verification_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_product_url ON shoe_product_media(master_product_id, media_url);

CREATE TABLE IF NOT EXISTS shoe_enrichment_sources (
  source_id INTEGER PRIMARY KEY,
  code TEXT,
  name TEXT,
  raw_json TEXT
);

CREATE TABLE IF NOT EXISTS shoe_enrichment_queue (
  queue_id INTEGER PRIMARY KEY,
  product_id INTEGER,
  status TEXT,
  locked_at TEXT,
  next_attempt_at TEXT,
  raw_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON shoe_enrichment_queue(status);

CREATE TABLE IF NOT EXISTS shoe_product_external_records (
  external_record_id INTEGER PRIMARY KEY,
  colorway_id INTEGER,
  source_id INTEGER,
  external_product_id TEXT,
  external_sku TEXT,
  source_url TEXT,
  match_method TEXT,
  match_confidence REAL,
  source_updated_at TEXT,
  last_seen_at TEXT,
  raw_data_json TEXT,
  created_at TEXT,
  updated_at TEXT,
  raw_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_external_product_id ON shoe_product_external_records(external_product_id);
CREATE INDEX IF NOT EXISTS idx_external_sku ON shoe_product_external_records(external_sku);

CREATE TABLE IF NOT EXISTS supabase_raw_rows (
  table_name TEXT NOT NULL,
  row_key TEXT NOT NULL,
  row_json TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(table_name, row_key)
);
CREATE INDEX IF NOT EXISTS idx_raw_rows_table ON supabase_raw_rows(table_name);

CREATE TABLE IF NOT EXISTS migration_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
