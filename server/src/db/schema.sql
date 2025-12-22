-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  avatar TEXT,
  display_name VARCHAR(255),
  gender VARCHAR(20),
  membership_tier VARCHAR(50) DEFAULT 'free',
  membership_expiry TIMESTAMP,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bars table
CREATE TABLE IF NOT EXISTS bars (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  district_id VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  image TEXT NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.0,
  drinks TEXT[] NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active passes table
CREATE TABLE IF NOT EXISTS passes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bar_id VARCHAR(255) NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  bar_name VARCHAR(255) NOT NULL,
  person_count INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  bar_payment DECIMAL(10, 2) NOT NULL,
  purchase_time TIMESTAMP NOT NULL,
  expiry_time TIMESTAMP NOT NULL,
  qr_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  transaction_id VARCHAR(255),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
  id VARCHAR(255) PRIMARY KEY,
  host_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_name VARCHAR(255) NOT NULL,
  host_display_name VARCHAR(255),
  host_avatar TEXT,
  pass_id VARCHAR(255) NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
  bar_id VARCHAR(255) NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  bar_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  max_female_guests INTEGER NOT NULL,
  party_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Party members table
CREATE TABLE IF NOT EXISTS party_members (
  id SERIAL PRIMARY KEY,
  party_id VARCHAR(255) NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar TEXT,
  gender VARCHAR(20) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(party_id, user_id)
);

-- Payment settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id SERIAL PRIMARY KEY,
  platform_fee_percentage DECIMAL(3, 2) DEFAULT 0.5,
  min_person_count INTEGER DEFAULT 1,
  max_person_count INTEGER DEFAULT 10,
  pass_valid_days INTEGER DEFAULT 7,
  stripe_enabled BOOLEAN DEFAULT true,
  payme_enabled BOOLEAN DEFAULT true,
  fps_enabled BOOLEAN DEFAULT true,
  alipay_enabled BOOLEAN DEFAULT false,
  wechat_enabled BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT true,
  payme_qr_code TEXT,
  fps_qr_code TEXT,
  alipay_qr_code TEXT,
  wechat_qr_code TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment settings
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON passes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_bar_id ON passes(bar_id);
CREATE INDEX IF NOT EXISTS idx_passes_expiry ON passes(expiry_time);
CREATE INDEX IF NOT EXISTS idx_parties_host_id ON parties(host_id);
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_party_members_user_id ON party_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bars_district_id ON bars(district_id);
