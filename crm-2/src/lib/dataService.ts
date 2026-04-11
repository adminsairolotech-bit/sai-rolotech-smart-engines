import { supabase } from './supabase';
import type { Lead, Machine, SupplierMachine, QuotationRequest, FeedbackReport, MarketingContent, LeadTask, LeadActivity, BuddyRule, Showroom, BuddyPolicy, IntegrationSetting, User, AIUsageLog, LeadIntelligence, Demo, Meeting, SequenceHistory } from './supabase';

async function query<T>(table: string, options?: {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  filters?: Record<string, unknown>;
  eq?: [string, unknown][];
}): Promise<T[]> {
  let q = supabase.from(table).select(options?.select || '*');
  if (options?.eq) {
    for (const [col, val] of options.eq) {
      q = q.eq(col, val);
    }
  }
  if (options?.filters) {
    for (const [col, val] of Object.entries(options.filters)) {
      if (val !== undefined && val !== null && val !== '') {
        q = q.eq(col, val);
      }
    }
  }
  if (options?.order) {
    q = q.order(options.order.column, { ascending: options.order.ascending ?? false });
  }
  if (options?.limit) {
    q = q.limit(options.limit);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as T[];
}

async function insert<T>(table: string, row: Partial<T>): Promise<T> {
  const { data, error } = await supabase.from(table).insert([row]).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

async function update<T>(table: string, id: number, updates: Partial<T>): Promise<T> {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

async function remove(table: string, id: number): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

async function count(table: string, filters?: Record<string, unknown>): Promise<number> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filters) {
    for (const [col, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== '') {
        q = q.eq(col, val);
      }
    }
  }
  const { count: c, error } = await q;
  if (error) return 0;
  return c || 0;
}

export const users = {
  getAll: () => query<User>('users', { order: { column: 'created_at' } }),
  getById: async (id: number) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as User;
  },
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !data) throw new Error('Invalid email or password');
    return data as User;
  },
  create: (user: Partial<User>) => insert<User>('users', user),
  update: (id: number, updates: Partial<User>) => update<User>('users', id, updates),
  delete: (id: number) => remove('users', id),
  count: () => count('users'),
};

export const leads = {
  getAll: (filters?: Record<string, unknown>) => query<Lead>('leads', { order: { column: 'created_at' }, filters }),
  getById: async (id: number) => {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as Lead;
  },
  create: (lead: Partial<Lead>) => insert<Lead>('leads', lead),
  update: (id: number, updates: Partial<Lead>) => update<Lead>('leads', id, updates),
  delete: (id: number) => remove('leads', id),
  count: (filters?: Record<string, unknown>) => count('leads', filters),
  getByStage: (stage: string) => query<Lead>('leads', { eq: [['pipeline_stage', stage]], order: { column: 'created_at' } }),
  getRecent: (limit = 10) => query<Lead>('leads', { order: { column: 'created_at' }, limit }),
};

export const machines = {
  getAll: () => query<Machine>('machines', { order: { column: 'created_at' } }),
  getById: async (id: number) => {
    const { data, error } = await supabase.from('machines').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as Machine;
  },
  create: (machine: Partial<Machine>) => insert<Machine>('machines', machine),
  update: (id: number, updates: Partial<Machine>) => update<Machine>('machines', id, updates),
  delete: (id: number) => remove('machines', id),
  count: () => count('machines'),
};

export const supplierMachines = {
  getAll: () => query<SupplierMachine>('supplier_machines', { order: { column: 'created_at' } }),
  create: (sm: Partial<SupplierMachine>) => insert<SupplierMachine>('supplier_machines', sm),
  update: (id: number, updates: Partial<SupplierMachine>) => update<SupplierMachine>('supplier_machines', id, updates),
  delete: (id: number) => remove('supplier_machines', id),
  count: () => count('supplier_machines'),
};

export const quotations = {
  getAll: () => query<QuotationRequest>('quotation_requests', { order: { column: 'created_at' } }),
  getById: async (id: number) => {
    const { data, error } = await supabase.from('quotation_requests').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as QuotationRequest;
  },
  create: (q: Partial<QuotationRequest>) => insert<QuotationRequest>('quotation_requests', q),
  update: (id: number, updates: Partial<QuotationRequest>) => update<QuotationRequest>('quotation_requests', id, updates),
  delete: (id: number) => remove('quotation_requests', id),
  count: (filters?: Record<string, unknown>) => count('quotation_requests', filters),
};

export const feedbackReports = {
  getAll: () => query<FeedbackReport>('feedback_reports', { order: { column: 'created_at' } }),
  create: (f: Partial<FeedbackReport>) => insert<FeedbackReport>('feedback_reports', f),
  update: (id: number, updates: Partial<FeedbackReport>) => update<FeedbackReport>('feedback_reports', id, updates),
  delete: (id: number) => remove('feedback_reports', id),
  count: (filters?: Record<string, unknown>) => count('feedback_reports', filters),
};

export const marketingContent = {
  getAll: () => query<MarketingContent>('marketing_content', { order: { column: 'created_at' } }),
  create: (m: Partial<MarketingContent>) => insert<MarketingContent>('marketing_content', m),
  update: (id: number, updates: Partial<MarketingContent>) => update<MarketingContent>('marketing_content', id, updates),
  delete: (id: number) => remove('marketing_content', id),
  count: () => count('marketing_content'),
};

export const leadTasks = {
  getAll: (filters?: Record<string, unknown>) => query<LeadTask>('lead_tasks', { order: { column: 'created_at' }, filters }),
  create: (t: Partial<LeadTask>) => insert<LeadTask>('lead_tasks', t),
  update: (id: number, updates: Partial<LeadTask>) => update<LeadTask>('lead_tasks', id, updates),
  delete: (id: number) => remove('lead_tasks', id),
  count: (filters?: Record<string, unknown>) => count('lead_tasks', filters),
};

export const leadActivities = {
  getAll: (leadId?: number) => leadId
    ? query<LeadActivity>('lead_activities', { eq: [['lead_id', leadId]], order: { column: 'created_at' } })
    : query<LeadActivity>('lead_activities', { order: { column: 'created_at' } }),
  create: (a: Partial<LeadActivity>) => insert<LeadActivity>('lead_activities', a),
  count: () => count('lead_activities'),
};

export const buddyRules = {
  getAll: () => query<BuddyRule>('buddy_rules', { order: { column: 'priority', ascending: true } }),
  create: (r: Partial<BuddyRule>) => insert<BuddyRule>('buddy_rules', r),
  update: (id: number, updates: Partial<BuddyRule>) => update<BuddyRule>('buddy_rules', id, updates),
  delete: (id: number) => remove('buddy_rules', id),
};

export const buddyPolicy = {
  get: async () => {
    const { data } = await supabase.from('buddy_policy').select('*').limit(1).single();
    return data as BuddyPolicy | null;
  },
  update: (id: number, updates: Partial<BuddyPolicy>) => update<BuddyPolicy>('buddy_policy', id, updates),
};

export const showrooms = {
  getAll: () => query<Showroom>('showrooms', { order: { column: 'created_at' } }),
  create: (s: Partial<Showroom>) => insert<Showroom>('showrooms', s),
  update: (id: number, updates: Partial<Showroom>) => update<Showroom>('showrooms', id, updates),
  delete: (id: number) => remove('showrooms', id),
};

export const integrationSettings = {
  getAll: () => query<IntegrationSetting>('integration_settings', { order: { column: 'platform', ascending: true } }),
  update: (id: number, updates: Partial<IntegrationSetting>) => update<IntegrationSetting>('integration_settings', id, updates),
};

export const aiUsageLogs = {
  getAll: (limit = 50) => query<AIUsageLog>('ai_usage_logs', { order: { column: 'created_at' }, limit }),
  create: (log: Partial<AIUsageLog>) => insert<AIUsageLog>('ai_usage_logs', log),
};

export const leadIntelligence = {
  getByLead: (leadId: number) => query<LeadIntelligence>('lead_intelligence', { eq: [['lead_id', leadId]] }),
  create: (li: Partial<LeadIntelligence>) => insert<LeadIntelligence>('lead_intelligence', li),
};

export const demos = {
  getAll: (filters?: Record<string, unknown>) => query<Demo>('demos', { order: { column: 'demo_date', ascending: false } as { column: string; ascending: boolean }, filters }),
  getById: async (id: number) => {
    const { data, error } = await supabase.from('demos').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as Demo;
  },
  create: (demo: Partial<Demo>) => insert<Demo>('demos', demo),
  update: (id: number, updates: Partial<Demo>) => update<Demo>('demos', id, updates),
  delete: (id: number) => remove('demos', id),
  count: (filters?: Record<string, unknown>) => count('demos', filters),
};

export const meetings = {
  getAll: (filters?: Record<string, unknown>) => query<Meeting>('meetings', { order: { column: 'slot_date', ascending: false } as { column: string; ascending: boolean }, filters }),
  getById: async (id: number) => {
    const { data, error } = await supabase.from('meetings').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as Meeting;
  },
  create: (meeting: Partial<Meeting>) => insert<Meeting>('meetings', meeting),
  update: (id: number, updates: Partial<Meeting>) => update<Meeting>('meetings', id, updates),
  delete: (id: number) => remove('meetings', id),
  count: (filters?: Record<string, unknown>) => count('meetings', filters),
};

export const sequenceHistory = {
  getAll: (filters?: Record<string, unknown>) => query<SequenceHistory>('sequence_history', { order: { column: 'sent_at', ascending: false } as { column: string; ascending: boolean }, filters }),
  getByLead: (leadId: number) => query<SequenceHistory>('sequence_history', { eq: [['lead_id', leadId]] }),
  create: (record: Partial<SequenceHistory>) => insert<SequenceHistory>('sequence_history', record),
  delete: (id: number) => remove('sequence_history', id),
};

export async function getDashboardStats() {
  const [totalMachines, totalLeads, totalSuppliers, newLeads, wonLeads, allLeads] = await Promise.all([
    machines.count(),
    leads.count(),
    supplierMachines.count(),
    leads.count({ status: 'New' }),
    leads.count({ pipeline_stage: 'won' }),
    leads.getAll(),
  ]);

  const pipelineValue = allLeads.reduce((sum, l) => {
    const val = typeof l.budget === 'string' ? parseFloat(l.budget.replace(/[^\d.]/g, '')) || 0 : 0;
    return sum + val;
  }, 0);

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100) : 0;

  return {
    totalMachines,
    totalLeads,
    totalSuppliers,
    newLeads,
    wonLeads,
    pipelineValue,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}
