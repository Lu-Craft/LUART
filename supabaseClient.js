// LUART Supabase Initialization (Vanilla UMD Global)
// Because the page runs outside a bundler (and often locally via file://), 
// we use the UMD build attached to the window object to prevent CORS issues.

const SUPABASE_URL = 'https://kvtietlcmyubphenthfo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kga3Sfs-cHrI5WMhgnWasQ_L_BnlbaO';

// The 'supabase' object is globally available from the CDN script in index.html
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
