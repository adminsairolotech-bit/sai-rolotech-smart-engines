import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

function createUnavailableQuery() {
  const query = {
    data: null,
    error: { message: 'Supabase is not configured on this server' },
    select() { return query; },
    insert() { return query; },
    update() { return query; },
    delete() { return query; },
    eq() { return query; },
    order() { return query; },
    limit() { return query; },
    single() { return query; },
  };
  return query;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : {
      from() {
        return createUnavailableQuery();
      },
    };
