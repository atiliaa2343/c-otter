import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import type { ContentItem } from '@/services/contentApi';

export function ContentCard({ item, onPress }: { item: ContentItem; onPress?: (item: ContentItem) => void }) {
  return (
    <Pressable onPress={() => onPress?.(item)} className="p-4 bg-white rounded-lg mb-3 border">
      <View>
        <Text className="font-semibold text-base mb-1">{item.title}</Text>
        {item.source ? <Text className="text-xs text-gray-500">{item.source}</Text> : null}
        {item.published_at ? <Text className="text-xs text-gray-400 mt-1">{new Date(item.published_at).toLocaleDateString()}</Text> : null}
        {item.type ? <Text className="text-xs text-indigo-600 mt-1">{item.type}</Text> : null}
      </View>
    </Pressable>
  );
}
