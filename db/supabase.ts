import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Database } from './database.types'

// Without an explicit storage adapter, supabase-js has nowhere to persist a
// session in React Native (there's no window.localStorage) — it falls back
// to an in-memory session that's lost the moment the app process restarts.
// That silently logs everyone out on every relaunch, which also means every
// recordConnection/syncDailySummary/submitQuestionnaire call quietly no-ops
// instead of saving anything, since none of them have a session to attach to.
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)
