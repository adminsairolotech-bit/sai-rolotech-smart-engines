-- SAI RoloTech CRM - Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  api_key VARCHAR(255),
  notes TEXT,
  rating INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  price DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'available',
  description TEXT,
  specifications JSONB DEFAULT '{}',
  image_url TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  source VARCHAR(100) DEFAULT 'Website',
  stage VARCHAR(50) DEFAULT 'new_lead',
  value DECIMAL(15,2) DEFAULT 0,
  machine_interest VARCHAR(255),
  assigned_to UUID REFERENCES app_users(id),
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  last_contact TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Tasks table
CREATE TABLE IF NOT EXISTS sales_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES app_users(id),
  lead_id UUID REFERENCES leads(id),
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE,
  lead_id UUID REFERENCES leads(id),
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_id UUID REFERENCES machines(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  service_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'scheduled',
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  notes TEXT,
  cost DECIMAL(15,2) DEFAULT 0,
  assigned_to UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buddy Conversations table
CREATE TABLE IF NOT EXISTS buddy_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES app_users(id),
  title VARCHAR(255),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Sequences table
CREATE TABLE IF NOT EXISTS sales_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  leads_enrolled INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo Schedules table
CREATE TABLE IF NOT EXISTS demo_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  machine_id UUID REFERENCES machines(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled',
  location VARCHAR(255),
  notes TEXT,
  assigned_to UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(100),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Content table
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50),
  body TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  target_audience VARCHAR(255),
  campaign VARCHAR(255),
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Templates table
CREATE TABLE IF NOT EXISTS outreach_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  template_type VARCHAR(50) DEFAULT 'email',
  variables JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES app_users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  updated_by UUID REFERENCES app_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for all tables (admin CRM - internal use only)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users (internal CRM)
CREATE POLICY "Allow all for anon" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON machines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sales_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON buddy_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sales_sequences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON demo_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON marketing_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON outreach_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user (credentials managed via env / onboarding)
INSERT INTO app_users (username, password_hash, name, email, phone, role) VALUES
  ('admin', '$2a$10$rQEY7GJz7Kj8vXyZm5e0/.OqKmkqQZ5rz1IJFnkqJ8jKz5RfJfIGC', 'Super Admin', 'admin@sairolotech.com', '+91 98765 43210', 'admin'),
  ('supplier1', '$2a$10$rQEY7GJz7Kj8vXyZm5e0/.OqKmkqQZ5rz1IJFnkqJ8jKz5RfJfIGC', 'Supplier User', 'supplier@sairolotech.com', '+91 87654 32109', 'supplier'),
  ('machine1', '$2a$10$rQEY7GJz7Kj8vXyZm5e0/.OqKmkqQZ5rz1IJFnkqJ8jKz5RfJfIGC', 'Machine User', 'machine@sairolotech.com', '+91 76543 21098', 'machine_user')
ON CONFLICT (username) DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (name, company, email, phone, city, state, status, api_key, rating, total_orders) VALUES
  ('Anita Patel', 'HydroForce India', 'anita@hydroforce.in', '+91 87654 32109', 'Ahmedabad', 'Gujarat', 'active', 'hfi-api-2024', 4, 12),
  ('Meena Iyer', 'SparkTech EDM', 'meena@sparktech.in', '+91 43210 98765', 'Coimbatore', 'Tamil Nadu', 'active', 'ste-api-2024', 5, 28),
  ('Priya Menon', 'MillPro Industries', 'priya@millpro.in', '+91 65432 10987', 'Bangalore', 'Karnataka', 'active', NULL, 3, 8),
  ('Rajesh Kumar', 'TurnMaster CNC', 'rajesh@turnmaster.in', '+91 78901 23456', 'Pune', 'Maharashtra', 'active', NULL, 4, 15),
  ('Vikram Singh', 'LaserCut Systems', 'vikram@lasercut.in', '+91 56789 01234', 'Delhi', 'Delhi', 'active', 'lcs-api-2024', 5, 32),
  ('Deepa Sharma', 'GrindTech Solutions', 'deepa@grindtech.in', '+91 34567 89012', 'Jaipur', 'Rajasthan', 'inactive', NULL, 2, 3)
ON CONFLICT DO NOTHING;

-- Insert sample machines
INSERT INTO machines (name, type, manufacturer, model, price, status, description) VALUES
  ('CNC Lathe Pro X500', 'CNC Lathe', 'Tata Machine Tools', 'TMT-X500', 2450000, 'available', 'High-precision CNC lathe for heavy-duty turning operations'),
  ('Milling Machine V3', 'Milling Machine', 'BFW Ltd', 'BFW-V3', 1850000, 'available', 'Vertical milling machine with 3-axis control'),
  ('Surface Grinder SG100', 'Surface Grinder', 'HMT', 'SG-100', 980000, 'available', 'Precision surface grinding machine'),
  ('Wire EDM WE-200', 'Wire EDM', 'SparkTech', 'WE-200', 3200000, 'available', 'Wire-cut EDM for complex shape cutting'),
  ('CNC Router CR-400', 'CNC Router', 'LaserCut', 'CR-400', 1650000, 'sold', 'Multi-axis CNC router for wood and metal'),
  ('Hydraulic Press HP-50', 'Hydraulic Press', 'HydroForce', 'HP-50T', 750000, 'available', '50-ton hydraulic press for forming operations'),
  ('Power Press PP-25', 'Power Press', 'MillPro', 'PP-25T', 520000, 'available', '25-ton mechanical power press'),
  ('Drilling Machine DM-40', 'Drilling Machine', 'TurnMaster', 'DM-40', 380000, 'maintenance', 'Radial drilling machine with auto-feed')
ON CONFLICT DO NOTHING;

-- Insert sample leads
INSERT INTO leads (name, email, phone, company, source, stage, value, machine_interest, priority) VALUES
  ('Rajesh Kumar', 'rajesh@tatacomp.in', '+91 98765 11111', 'Tata AutoComp', 'Google Ads', 'new_lead', 2450000, 'CNC Lathe', 'high'),
  ('Priya Nair', 'priya@godrej.in', '+91 98765 22222', 'Godrej Agrovet', 'Website', 'new_lead', 1800000, 'Hydraulic Press', 'high'),
  ('Sunita Reddy', 'sunita@mahindra.in', '+91 98765 33333', 'Mahindra CIE', 'Referral', 'contacted', 1650000, 'Milling Machine', 'medium'),
  ('Deepak Joshi', 'deepak@lnt.in', '+91 98765 44444', 'L&T Technology', 'Exhibition', 'contacted', 4500000, 'Wire EDM', 'high'),
  ('Kavitha Rao', 'kavitha@tvs.in', '+91 98765 55555', 'TVS Motors', 'Cold Call', 'quotation_sent', 980000, 'Surface Grinder', 'medium'),
  ('Mohan Das', 'mohan@ashok.in', '+91 98765 66666', 'Ashok Leyland', 'Google Ads', 'quotation_sent', 1200000, 'Power Press', 'low'),
  ('Ravi Shankar', 'ravi@hero.in', '+91 98765 77777', 'Hero MotoCorp', 'Website', 'negotiation', 1650000, 'CNC Router', 'high'),
  ('Amit Verma', 'amit@bajaj.in', '+91 98765 88888', 'Bajaj Auto', 'Referral', 'negotiation', 3200000, 'Wire EDM', 'high'),
  ('Neha Gupta', 'neha@maruti.in', '+91 98765 99999', 'Maruti Suzuki', 'Exhibition', 'won', 2450000, 'CNC Lathe', 'medium'),
  ('Sanjay Patel', 'sanjay@tata.in', '+91 98765 00000', 'Tata Motors', 'Google Ads', 'lost', 750000, 'Hydraulic Press', 'low')
ON CONFLICT DO NOTHING;

-- Insert sample sales tasks
INSERT INTO sales_tasks (title, description, priority, status, due_date) VALUES
  ('Follow up with Rajesh Kumar', 'Send CNC Lathe brochure and pricing details', 'high', 'pending', NOW() + INTERVAL '2 days'),
  ('Schedule demo for Priya Nair', 'Arrange Hydraulic Press demo at Godrej plant', 'high', 'in_progress', NOW() + INTERVAL '5 days'),
  ('Send quotation to Sunita Reddy', 'Prepare detailed quotation for Milling Machine', 'medium', 'pending', NOW() + INTERVAL '3 days'),
  ('Call Deepak Joshi', 'Discuss Wire EDM specifications and delivery timeline', 'high', 'completed', NOW() - INTERVAL '1 day'),
  ('Negotiate with Ravi Shankar', 'Final price negotiation for CNC Router', 'medium', 'in_progress', NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Insert sample quotations
INSERT INTO quotations (quote_number, items, subtotal, tax, total, status, valid_until) VALUES
  ('QT-2024-001', '[{"name": "CNC Lathe Pro X500", "qty": 1, "price": 2450000}]', 2450000, 441000, 2891000, 'sent', NOW() + INTERVAL '30 days'),
  ('QT-2024-002', '[{"name": "Surface Grinder SG100", "qty": 2, "price": 980000}]', 1960000, 352800, 2312800, 'sent', NOW() + INTERVAL '30 days'),
  ('QT-2024-003', '[{"name": "Wire EDM WE-200", "qty": 1, "price": 3200000}]', 3200000, 576000, 3776000, 'draft', NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Insert sample feedback
INSERT INTO feedback (customer_name, customer_email, rating, category, message, status) VALUES
  ('Neha Gupta', 'neha@maruti.in', 5, 'Product Quality', 'Excellent CNC Lathe quality. Very satisfied with performance.', 'resolved'),
  ('Ravi Shankar', 'ravi@hero.in', 4, 'Service', 'Good support team, but delivery was slightly delayed.', 'in_progress'),
  ('Amit Verma', 'amit@bajaj.in', 3, 'Pricing', 'Pricing is competitive but could be better for bulk orders.', 'new')
ON CONFLICT DO NOTHING;

SELECT 'All tables and sample data created successfully!' as result;
