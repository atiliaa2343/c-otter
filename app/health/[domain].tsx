import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useLatestContent } from '@/hooks/useLatestContent';
import { ContentCard } from '@/components/ContentCard';
import { WebView } from 'react-native-webview';

export default function DomainPage() {
  const params = useLocalSearchParams() as { domain?: string };
  const domain = params.domain ?? 'general';
  const { data, loading, error, refresh } = useLatestContent(domain);
  const [selected, setSelected] = useState<any | null>(null);

  const apps = (data || []).filter((d: any) => String(d.type).toLowerCase() === 'app');
  const articles = (data || []).filter((d: any) => String(d.type).toLowerCase() !== 'app');

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackTitle: 'Categories', headerShown: true }} />
      <View className="flex-1 bg-white p-4">

      {error ? <Text className="text-red-600 text-center">{error}</Text> : null}

      <Text className="text-lg font-semibold mt-2 mb-1 text-center">Latest apps</Text>
      <FlatList
        data={apps}
        keyExtractor={(item) => item._id ?? item.url ?? item.title}
        renderItem={({ item }) => (
          <ContentCard item={item} onPress={(it) => setSelected(it)} />
        )}
        ListEmptyComponent={() => (
          <View className="items-center mt-2">
            {loading ? <ActivityIndicator /> : <Text className="text-gray-500">No apps found</Text>}
          </View>
        )}
      />

  <Text className="text-lg font-semibold mt-4 mb-1 text-center">Articles</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item._id ?? item.url ?? item.title}
        renderItem={({ item }) => (
          <ContentCard item={item} onPress={(it) => setSelected(it)} />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
        ListEmptyComponent={() => (
          <View className="items-center mt-2">
            {loading ? <ActivityIndicator /> : <Text className="text-gray-500">No articles found</Text>}
          </View>
        )}
      />

      <Modal visible={!!selected} onRequestClose={() => setSelected(null)}>
        {selected ? (
          <View className="flex-1">
            <WebView source={{ uri: selected.url }} startInLoadingState />
          </View>
        ) : null}
      </Modal>
    </View>
    </>
  );
}
