import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useContentBlocks } from "@/hooks/useContentBlocks";
import { useHealthTopics } from "@/hooks/useHealthTopics";
import { slugifyTopic } from "@/hooks/useHealthTopicContent";

interface TopicCard {
  id: string;
  title: string;
  color: string;
  icon?: string;
  imageSource: any;
  description: string;
}

const FALLBACK_TOPICS: TopicCard[] = [
  {
    id: '1',
    title: 'Cannabis',
    color: '#8B7FE8',
    imageSource: require('@/assets/images/cannabis.png'),
    description: 'Resources and support for cannabis use',
  },
  {
    id: '2',
    title: 'Opioids',
    color: '#FFB088',
    imageSource: require('@/assets/images/drugs.png'),
    description: 'Resources and support for opioid use',
  },
  {
    // Slugifies to "health-and-wellness", which app/health/[domain].tsx
    // redirects to the smartwatch / Health Connect screen.
    id: '3',
    title: 'Health & Wellness',
    color: '#85DDA2',
    imageSource: require('@/assets/images/drugs.png'),
    description: 'Resources for your health and wellness based on wearable data',
  },
];

const FALLBACK_IMAGE_BY_TITLE: Record<string, any> = {
  Cannabis: require('@/assets/images/cannabis.png'),
  Opioids: require('@/assets/images/drugs.png'),
  'Health & Wellness': require('@/assets/images/drugs.png'),
};

export function HealthForm() {
  const router = useRouter();
  const { blocks } = useContentBlocks('health');
  const { topics: dbTopics, loading, error } = useHealthTopics();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const topics: TopicCard[] = dbTopics.length > 0
    ? dbTopics.map((db) => ({
        id: db.id,
        title: db.title,
        color: db.color,
        imageSource: db.image_url
          ? { uri: db.image_url }
          : FALLBACK_IMAGE_BY_TITLE[db.title] ?? FALLBACK_TOPICS[0].imageSource,
        description: db.description ?? '',
      }))
    : FALLBACK_TOPICS;

  const handleTopicPress = (topicId: string, topicTitle: string) => {
    const slug = slugifyTopic(topicTitle);
    router.push(`/health/${slug}`);
  };

  const renderTopicCard = (topic: TopicCard, index: number) => {
    return (
      <TouchableOpacity
        key={topic.id}
        onPress={() => handleTopicPress(topic.id, topic.title)}
        style={[styles.topicCard, { backgroundColor: topic.color }]}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <Image 
            source={topic.imageSource}
            style={styles.topicImage}
            resizeMode="contain"
          />
          <View style={styles.topicTextContainer}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
        </View>
      </TouchableOpacity>
    );
  };

  // Create pairs for aligned layout
  const renderStaggeredGrid = () => {
    const leftColumn: TopicCard[] = [];
    const rightColumn: TopicCard[] = [];

    topics.forEach((topic, index) => {
      if (index % 2 === 0) {
        leftColumn.push(topic);
      } else {
        rightColumn.push(topic);
      }
    });

    return (
      <View style={styles.gridContainer}>
        <View style={styles.column}>
          {leftColumn.map((topic, index) => renderTopicCard(topic, index * 2))}
        </View>
        <View style={styles.column}>
          {rightColumn.map((topic, index) => renderTopicCard(topic, index * 2 + 1))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>{blocks.page_title ?? 'Health Education'}</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          {blocks.page_subtitle ?? 'Explore topics to learn about resources and support'}
        </Text>
      </View>

      {error && (
        <Text style={[styles.errorText, { color: '#ef4444' }]}>
          Could not load health topics from the database — showing the built-in list.
        </Text>
      )}

      {/* Topic Cards Grid */}
      {loading && dbTopics.length === 0 ? (
        <ActivityIndicator size="large" color={textColor} style={styles.loader} />
      ) : (
        renderStaggeredGrid()
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  column: {
    width: '48%',
  },
  topicCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    minHeight: 140,
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicImage: {
    width: 50,
    height: 50,
    marginRight: 8,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  topicDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
});
