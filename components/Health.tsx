import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Image } from "react-native";

interface TopicCard {
  id: string;
  title: string;
  color: string;
  icon?: string;
  image?: any;
  size: 'small' | 'large';
}

export function HealthForm() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics: TopicCard[] = [
    { id: '1', title: 'Mental Health', color: '#8B7FE8', image: require('../assets/images/mental.png'), size: 'small' },
    { id: '2', title: 'Fitness', color: '#FF6B6B', image: require('../assets/images/fitness.png') , size: 'small' },
    { id: '3', title: 'Addiction & Recovery', color: '#FFB088', image: require('../assets/images/drugs.png'), size: 'small' },
    { id: '4', title: 'Nutrition', color: '#FFC857', image: require('../assets/images/food.png'), size: 'small' },
    { id: '5', title: 'Emotional, Social, & Spiritual Health', color: '#6BCF7F', image: require('../assets/images/social.png'), size: 'small' },
    { id: '6', title: 'Occupational & Financial Health', color: '#4A5568', image: require('../assets/images/money.png'), size: 'small' },
  ];

  const handleTopicPress = (topicId: string, topicTitle: string) => {
    setSelectedTopic(topicId);
    console.log(`Selected topic: ${topicTitle}`);
    // TODO: Navigate to specific topic content or update state
  };

  const renderTopicCard = (topic: TopicCard, index: number) => {
    const isSelected = selectedTopic === topic.id;
    const cardHeight = topic.size === 'large' ? 180 : 180;
    
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
        {topic.image ? (
          <Image 
            source={topic.image} 
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
          <Text className="text-2xl font-bold text-gray-900 mb-1 text-center">
            Health Education
          </Text>
          <Text className="text-sm text-gray-500 mt-1 text-center">
            Choose a topic to learn more about resources
          </Text>
        </View>

        {/* Topic Cards Grid */}
        {renderStaggeredGrid()}

        {/* Selected Topic Display */}
        {selectedTopic && (
          <View className="mt-6 p-4 bg-blue-100 rounded-lg">
            <Text className="text-blue-900 font-medium">
              Selected: {topics.find(t => t.id === selectedTopic)?.title}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
