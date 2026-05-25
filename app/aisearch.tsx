import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BACKEND_URL } from '@/constants/BackendConfig';

interface HealthcareResult {
  id: string;
  title: string;
  description: string;
  address?: string;
  phone?: string;
  specialties?: string[];
  hours?: string;
}

interface AiResponse {
  query: string;
  response: string;
  results: HealthcareResult[];
}

export default function AiSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AiResponse | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchResult(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      setSearchResult(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchResult({
        query,
        response: `Unable to connect to the search service. Please ensure:\n1. Your computer and phone are on the same WiFi network\n2. The backend server is running\n3. Error: ${err.message || 'Network error'}`,
        results: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, padding: 16, paddingTop: 24 }}>
        {/* Header with Back Button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={primaryColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor }}>AI Search</Text>
        </View>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor, marginBottom: 4 }}>
            Healthcare AI Assistant
          </Text>
          <Text style={{ color: textSecondary }}>
            Describe your symptoms or condition to find relevant healthcare resources in Petersburg, VA
          </Text>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TextInput
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              paddingHorizontal: 16,
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: 1,
              color: textColor,
              marginRight: 8,
            }}
            placeholder="e.g., opioid addiction, anxiety, withdrawal..."
            placeholderTextColor={textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: primaryColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSearch}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {searchResult && (
          <ScrollView style={{ flex: 1 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, color: textColor, lineHeight: 22 }}>
                {searchResult.response}
              </Text>
            </View>

            {searchResult.results && searchResult.results.length > 0 && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary, marginBottom: 8 }}>
                  Recommended Healthcare Organizations
                </Text>
                {searchResult.results.map((result) => (
                  <View 
                    key={result.id}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: cardBorder,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 4 }}>
                      {result.title}
                    </Text>
                    
                    {result.specialties && result.specialties.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {result.specialties.map((spec, idx) => (
                          <View 
                            key={idx} 
                            style={{ 
                              backgroundColor: `${primaryColor}20`, 
                              paddingHorizontal: 8, 
                              paddingVertical: 2, 
                              borderRadius: 4, 
                              marginRight: 4, 
                              marginBottom: 4 
                            }}
                          >
                            <Text style={{ fontSize: 12, color: primaryColor }}>{spec}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {result.description && (
                      <Text style={{ fontSize: 14, color: textSecondary, marginBottom: 8 }}>
                        {result.description}
                      </Text>
                    )}
                    
                    {result.address && (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Ionicons name="location-outline" size={14} color={textSecondary} style={{ marginRight: 4, marginTop: 2 }} />
                        <Text style={{ fontSize: 13, color: textSecondary, flex: 1 }}>{result.address}</Text>
                      </View>
                    )}
                    
                    {result.hours && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="time-outline" size={14} color={textSecondary} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 13, color: textSecondary }}>{result.hours}</Text>
                      </View>
                    )}
                    
                    {result.phone && (
                      <TouchableOpacity 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          backgroundColor: primaryColor,
                          alignSelf: 'flex-start',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                        onPress={() => handleCall(result.phone!)}
                      >
                        <Ionicons name="call" size={14} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 13, color: '#fff', fontWeight: '500' }}>Call {result.phone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {searchResult.results && searchResult.results.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: textSecondary, textAlign: 'center' }}>
                  No specific healthcare organizations found. Try searching for terms like "opioid addiction", "mental health", or "substance abuse".
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {!searchResult && !isLoading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="medical-outline" size={64} color={primaryColor} />
            <Text style={{ fontSize: 16, color: textSecondary, marginTop: 16, textAlign: 'center' }}>
              Describe your symptoms or condition to find relevant healthcare resources in Petersburg, VA
            </Text>
            <Text style={{ fontSize: 13, color: textSecondary, marginTop: 8, textAlign: 'center' }}>
              Examples: "opioid addiction", "withdrawal symptoms", "mental health counseling"
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}