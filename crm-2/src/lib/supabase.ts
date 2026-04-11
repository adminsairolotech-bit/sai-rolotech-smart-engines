import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  role: 'admin' | 'supplier' | 'machine_user';
  company: string | null;
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  city: string;
  source: string;
  machine_interest: string;
  budget: string | null;
  urgency: string | null;
  status: string;
  quality: string;
  notes: string | null;
  external_id: string | null;
  raw_data: unknown;
  last_follow_up: string | null;
  next_follow_up: string | null;
  pipeline_stage: string;
  lead_score: number;
  assigned_to: string | null;
  latitude: number | null;
  longitude: number | null;
  ai_memory_summary: string | null;
  call_notes: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: number;
  name: string;
  model: string;
  category: string;
  capacity: string | null;
  power: string | null;
  speed: string | null;
  price: string | null;
  description: string | null;
  weight: string | null;
  dimensions: string | null;
  rollers: string | null;
  color: string | null;
  detailed_description: string | null;
  warranty: string | null;
  tags: string[];
  specs: unknown[];
  features: unknown[];
  applications: unknown[];
  accessories: unknown[];
  images: unknown[];
  videos: unknown[];
  pdf_documents: unknown[];
  created_at: string;
  updated_at: string;
}

export interface SupplierMachine {
  id: number;
  supplier_name: string;
  machine_name: string;
  category: string | null;
  price: string | null;
  description: string | null;
  specs: Record<string, unknown>;
  contact_info: Record<string, unknown>;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationRequest {
  id: number;
  lead_id: number | null;
  machine_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_city: string | null;
  machine_name: string | null;
  quantity: number;
  special_requirements: string | null;
  status: string;
  quoted_price: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackReport {
  id: number;
  user_id: number | null;
  type: string;
  subject: string;
  message: string;
  status: string;
  priority: string | null;
  admin_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingContent {
  id: number;
  content_type: string;
  title: string;
  content: string;
  target_audience: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LeadTask {
  id: number;
  lead_id: number;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  type: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BuddyRule {
  id: number;
  rule_key: string;
  rule_name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  rule_type: string;
  parameters: Record<string, unknown>;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Showroom {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  images: unknown[];
  working_hours: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuddyPolicy {
  id: number;
  is_enabled: boolean;
  allow_ai: boolean;
  allow_messaging: boolean;
  allow_email: boolean;
  allow_automation: boolean;
  max_ai_requests_per_hour: number;
  max_messages_per_hour: number;
  max_emails_per_hour: number;
  max_automations_per_hour: number;
  max_monthly_cost_cents: number;
  alert_threshold_percent: number;
  allowed_ai_providers: unknown[];
  blocked_ai_providers: unknown[];
  created_at: string;
  updated_at: string;
}

export interface IntegrationSetting {
  id: number;
  platform: string;
  api_key: string | null;
  api_secret: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  last_sync_status: string | null;
  total_imported: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  applicable_machines: unknown[];
  created_at: string;
  updated_at: string;
}

export interface AdminSettings {
  id: number;
  machine_id: number | null;
  enable_2d_view: boolean;
  enable_3d_view: boolean;
  enable_animation: boolean;
  enable_part_highlight: boolean;
  enable_drawing_download: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIUsageLog {
  id: number;
  provider: string;
  model: string | null;
  operation: string;
  tokens_used: number;
  cost_cents: number;
  duration_ms: number;
  status: string;
  error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LeadIntelligence {
  id: number;
  lead_id: number;
  intelligence_type: string;
  data: Record<string, unknown>;
  confidence: number;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Demo {
  id: number;
  lead_id: number | null;
  company_name: string;
  contact_name: string;
  phone: string;
  machine_interest: string;
  demo_date: string;
  demo_time: string;
  demo_type: "factory" | "customer" | "video";
  location_detail: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  completed_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: number;
  lead_id: number | null;
  lead_name: string;
  phone: string;
  slot_date: string;
  slot_time: string;
  meeting_type: "video" | "factory" | "customer";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  booked_by: string;
  notes: string | null;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceHistory {
  id: number;
  sequence_id: number | null;
  lead_id: number | null;
  step_template: string;
  message_sent: string;
  channel: "whatsapp" | "email" | "phone";
  status: "pending" | "sent" | "delivered" | "failed";
  sent_at: string;
  created_at: string;
}
