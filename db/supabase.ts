import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { Database } from './database.types'

// Without an explicit storage adapter, supabase-js has nowhere to persist a
// session in React Native (there's no window.localStorage) — it falls back
// to an in-memory session that's lost the moment the app process restarts.
// That silently logs everyone out on every relaunch, which also means every
// recordConnection/syncDailySummary/submitAnswers call quietly no-ops
// instead of saving anything, since none of them have a session to attach to.
//
// Expo's static web output also evaluates this module in Node during
// server rendering, where AsyncStorage's web build touches `window` and
// crashes — so skip storage/persistence there.
const isServer = Platform.OS === 'web' && typeof window === 'undefined'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: isServer ? undefined : AsyncStorage,
      persistSession: !isServer,
      autoRefreshToken: !isServer,
      detectSessionInUrl: false,
    },
  },
)
