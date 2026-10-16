import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '@/db/supabase';

// Landing route for the email confirmation link (see emailRedirectTo in AuthContext).
// Supabase appends the session either as #access_token=...&refresh_token=... (implicit flow)
// or ?code=... (PKCE flow), or #error_description=... if the link is bad/expired.
function parseParams(url: string) {
  const params: Record<string, string> = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  for (const part of [query, hash]) {
    new URLSearchParams(part).forEach((value, key) => {
      params[key] = value;
    });
  }
  return params;
}

export default function AuthCallback() {
  const router = useRouter();
  const url = Linking.useURL();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    const finish = async () => {
      const params = parseParams(url);

      if (params.error_description || params.error) {
        setError((params.error_description || params.error).replace(/\+/g, ' '));
        return;
      }

      if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) return setError(error.message);
      } else if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) return setError(error.message);
      }

      // Email is confirmed at this point even if no session came back; send them into the app.
      router.replace('/');
    };

    finish();
  }, [url]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {error ? (
        <>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Couldn't confirm your email</Text>
          <Text style={{ textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Back to app</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Confirming your email…</Text>
        </>
      )}
    </View>
  );
}
