import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, Modal, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_CONTENT_API || '';
const fitnessApps = [
  {
    title: 'Nike Training Club',
    image: require('../../assets/images/fitness/nike-training-club.png'),
  },
  {
    title: 'Strong Workout Tracker Gym Log',
    image: require('../../assets/images/fitness/strong-workout-tracker.png'),
  },
  {
    title: 'Gymshark Training and Fitness',
    image: require('../../assets/images/fitness/gymshark.png'),
  },
  {
    title: 'FitOn',
    image: require('../../assets/images/fitness/Fiton.png'),
  },
  {
    title: 'Burn.Fit',
    image: require('../../assets/images/fitness/BurnFit.png'),
  },
  {
    title: 'Jefit',
    image: require('../../assets/images/fitness/jefit.png'),
  },
  {
    title: 'Workout for Women',
    image: require('../../assets/images/fitness/workoutforwomen.png'),
  },
  {
    title: 'Fitness Buddy Home Gym Workout',
    image: require('../../assets/images/fitness/fitness-buddy-home-gym.png'),
  },
  {
    title: '30 Day Fitness at Home',
    image: require('../../assets/images/fitness/30-day-fitness.png'),
  },
  {
    title: 'Freeletics: HIIT Fitness Coach',
    image: require('../../assets/images/fitness/freeletics.jpg'),
  },
];

export default function DomainPage() {
  const params = useLocalSearchParams() as { domain?: string };
  const domain = params.domain ?? 'general';
  const showFitnessApps = domain === 'fitness';

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackTitle: 'Categories', headerShown: true }} />
      <View className="flex-1 bg-white p-4">

      <Text className="text-lg font-semibold mt-2 mb-1 text-center">Latest apps</Text>
      <FlatList
        data={fitnessApps}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Image
              source={item.image}
              style={{ width: 48, height: 48, marginRight: 16, borderRadius: 8, backgroundColor: '#fff' }}
              resizeMode="contain"
            />
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <>
            <Text className="text-lg font-semibold mt-4 mb-1 text-center">Latest Articles</Text>
            <FlatList
              data={[] as { title: string }[]} // Replace with your articles array
              keyExtractor={(item, idx) => item.title || String(idx)}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                  {/* If you have article images, add <Image ... /> here */}
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={{ textAlign: 'center', color: '#888', marginVertical: 8 }}>No articles found</Text>
              )}
            />
          </>
        )}
      />
    </View>
    </>
  );
}
