import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://fvzhybddmulufmfjuvwl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2emh5YmRkbXVsdWZtZmp1dndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTM4MDEsImV4cCI6MjA3Mzg4OTgwMX0.mCNaEV4e0TjswSFctS3JrHKwzzhxLv_yw_uW3LWATDo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
