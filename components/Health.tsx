import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Image } from "react-native";
import { useRouter } from 'expo-router';

// Backend base URL for phone access
const BACKEND_URL = 'http://10.0.0.71:4000';

interface TopicCard {
  id: string;
  title: string;
  color: string;
  icon?: string;
  imageFilename?: string;
  size: 'small' | 'large';
}

export function HealthForm() {
  // no selected UI state desired — clicking navigates only
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Use available images for health topics (fallbacks if needed)
  const topics: TopicCard[] = [
    { id: '1', title: 'Mental Health', color: '#8B7FE8', imageFilename: 'mental.png', size: 'small' },
    { id: '2', title: 'Fitness', color: '#FF6B6B', imageFilename: 'fitness.png', size: 'small' },
    { id: '3', title: 'Addiction & Recovery', color: '#FFB088', imageFilename: 'drugs.png', size: 'small' },
    { id: '4', title: 'Nutrition', color: '#FFC857', imageFilename: 'food.png', size: 'small' },
    { id: '5', title: 'Emotional, Social, & Spiritual Health', color: '#6BCF7F', imageFilename: 'social.png', size: 'small' },
    { id: '6', title: 'Occupational & Financial Health', color: '#4A5568', imageFilename: 'money.png', size: 'small' },
  ];

  // Use require for health images
  // Use require for health images except fitness, which uses backend
  const getHealthImageSource = (filename: string) => {
    switch (filename) {
      case 'mental.png':
        return require('../assets/images/mental.png');
      case 'fitness.png':
        return require('../assets/images/fitness.png');
      case 'drugs.png':
        return require('../assets/images/drugs.png');
      case 'food.png':
        return require('../assets/images/food.png');
      case 'social.png':
        return require('../assets/images/social.png');
      case 'money.png':
        return require('../assets/images/money.png');
      default:
        return undefined;
    }
  };

  const router = useRouter();

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleTopicPress = (topicId: string, topicTitle: string) => {
    // navigate to dynamic domain route (no selected UI)
    const slug = slugify(topicTitle);
    router.push(`/health/${slug}`);
  };

  const renderTopicCard = (topic: TopicCard, index: number) => {
    const isSelected = selectedTopic === topic.id;
    const cardHeight = topic.size === 'large' ? 180 : 180;
    // Use local require for health images
    const imageSource = topic.imageFilename ? getHealthImageSource(topic.imageFilename) : undefined;
    return (
      <TouchableOpacity
        key={topic.id}
        onPress={() => handleTopicPress(topic.id, topic.title)}
        className={`rounded-2xl p-6 justify-end mb-3 ${isSelected ? 'opacity-80' : ''}`}
        style={{
          backgroundColor: topic.color,
          height: cardHeight,
          width: '100%',
        }}
        activeOpacity={0.7}
      >
        {imageSource ? (
          <Image 
            source={imageSource}
            style={{ width: 80, height: 80, marginBottom: 12 }}
            resizeMode="contain"
          />
        ) : (
          <Text className="text-4xl mb-3">{topic.icon}</Text>
        )}
        <Text className="text-white font-semibold text-base">
          {topic.title}
        </Text>
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
      <View className="flex-row justify-between">
        <View style={{ width: '48%' }}>
          {leftColumn.map((topic, index) => renderTopicCard(topic, index * 2))}
        </View>
        <View style={{ width: '48%' }}>
          {rightColumn.map((topic, index) => renderTopicCard(topic, index * 2 + 1))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-full px-5 py-10">
        {/* Header */}
        <View className="mb-6 items-center">
          <Text style={{ marginTop: 40 }} className="text-2xl font-bold text-gray-900 mb-1 text-center">
            Health Education
          </Text>
          <Text className="text-sm text-gray-500 mt-1 text-center">
            Choose a topic to learn more about resources
          </Text>
        </View>

        {/* Topic Cards Grid */}
        {renderStaggeredGrid()}

        {/* no selected topic UI by design */}
      </View>
    </ScrollView>
  );
}
