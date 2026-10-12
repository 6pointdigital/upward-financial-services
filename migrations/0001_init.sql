-- Upward Financial Services equipment inventory

CREATE TABLE dealerships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dealer')),
  dealership_id INTEGER REFERENCES dealerships(id),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dealership_id INTEGER NOT NULL REFERENCES dealerships(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  condition TEXT NOT NULL DEFAULT 'used' CHECK (condition IN ('new', 'used')),
  price_cents INTEGER,
  hours INTEGER,
  mileage INTEGER,
  serial_number TEXT,
  stock_number TEXT,
  location_city TEXT,
  location_state TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'sold')),
  financing_eligible INTEGER NOT NULL DEFAULT 1,
  review_note TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_dealership ON assets(dealership_id);
CREATE INDEX idx_assets_category ON assets(category);

CREATE TABLE asset_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_photos_asset ON asset_photos(asset_id);

CREATE TABLE financing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  state TEXT,
  down_payment_cents INTEGER,
  term_months INTEGER,
  years_in_business TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_requests_status ON financing_requests(status);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES
  ('estimator_apr', '9.99'),
  ('estimator_terms', '24,36,48,60,72'),
  ('estimator_default_down_pct', '10'),
  ('notification_email', '');
