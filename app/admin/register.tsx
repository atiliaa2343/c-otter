import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading: authIsLoading } = useAdminAuth();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const handleSubmit = async () => {
    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      await register(email, username, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authIsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor, padding: 24 }}>
      <View style={{ marginBottom: 32 }}>
        <Ionicons name="person-add" size={48} color={primaryColor} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: textColor }}>
          Admin Registration
        </Text>
      </View>

      {error && (
        <View style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <Text style={{ color: '#991b1b', textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      <TextInput
        style={[
          styles.input,
          { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }
        ]}
        placeholder="Email"
        placeholderTextColor={textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }
        ]}
        placeholder="Username"
        placeholderTextColor={textSecondary}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }
        ]}
        placeholder="Password"
        placeholderTextColor={textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }
        ]}
        placeholder="Confirm Password"
        placeholderTextColor={textSecondary}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: primaryColor }
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Registering...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 16 }}
        onPress={() => router.push('/admin/login')}
      >
        <Text style={{ color: textSecondary, textAlign: 'center', fontSize: 14 }}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};