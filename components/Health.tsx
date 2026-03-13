import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from "react-native";
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { getImageUrl } from "@/constants/BackendConfig";

interface TopicCard {
  id: string;
  title: string;
  color: string;
  icon?: string;
  imageFilename: string;
  description: string;
}

export function HealthForm() {
  const router = useRouter();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const topics: TopicCard[] = [
    { 
      id: '1', 
      title: 'Mental Health', 
      color: '#8B7FE8', 
      imageFilename: 'mental.png', 
      description: 'Mind, mood & psychological wellness',
    },
    { 
      id: '2', 
      title: 'Fitness', 
      color: '#FF6B6B', 
      imageFilename: 'fitness.png', 
      description: 'Physical activity & exercise',
    },
    { 
      id: '3', 
      title: 'Addiction & Recovery', 
      color: '#FFB088', 
      imageFilename: 'drugs.png', 
      description: 'Support for substance use',
    },
    { 
      id: '4', 
      title: 'Nutrition', 
      color: '#FFC857', 
      imageFilename: 'food.png', 
      description: 'Healthy eating & diet',
    },
    { 
      id: '5', 
      title: 'Emotional & Social', 
      color: '#6BCF7F', 
      imageFilename: 'social.png', 
      description: 'Relationships & community',
    },
    { 
      id: '6', 
      title: 'Financial Health', 
      color: '#4A5568', 
      imageFilename: 'money.png', 
      description: 'Money management & career',
    },
  ];

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleTopicPress = (topicId: string, topicTitle: string) => {
    const slug = slugify(topicTitle);
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
            source={{ uri: getImageUrl(topic.imageFilename) }}
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
        <Text style={[styles.title, { color: textColor }]}>Health Education</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Explore topics to learn about resources and support
        </Text>
      </View>

      {/* Topic Cards Grid */}
      {renderStaggeredGrid()}
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
