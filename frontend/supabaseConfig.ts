import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhikbbrgiafwaqbbckhw.supabase.co';
// Publishable (anon) key — safe to use in frontend
const SUPABASE_ANON_KEY = 'sb_publishable_up2J9pcjrRe8sv2bVHeVIQ_vjeKAbV3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
