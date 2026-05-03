
import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

const LOCAL_LOGO = require("../assets/images/Ce Otter.png");
const BACKGROUND_IMAGE = require("../assets/images/Ce Otter.png");

const eventCards = [
  {
    title: "Upcoming Blood Drive",
    desc: "Hunter McDaniel, March 18th 2pm-4pm",
    icon: "water",
    color: "#ef4444",
  },
  {
    title: "Mental Health Workshop",
    desc: "Student Center, March 22nd 1pm-3pm",
    icon: "happy",
    color: "#6366f1",
  },
  {
    title: "Career Fair",
    desc: "Gymnasium, March 25th 10am-2pm",
    icon: "briefcase",
    color: "#f59e0b",
  },
  {
    title: "Campus Safety Alert",
    desc: "Be aware of construction near Lot B",
    icon: "alert-circle",
    color: "#eab308",
  },
];

export function HomePage() {
  const router = useRouter();
  
  // Use local logo
  const logoSource = LOCAL_LOGO;
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const backgroundPrimary = useThemeColor({}, 'backgroundPrimary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  return (
    <ImageBackground 
      source={BACKGROUND_IMAGE} 
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} 
        style={{ backgroundColor: 'transparent' }}
      >
        {/* AI Search bubble stays at the top */}
        <View style={styles.aiSearchContainer}>
        <TouchableOpacity
          style={[styles.aiBubble, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={() => router.push("/aisearch")}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color={primaryColor} style={{ marginRight: 8 }} />
          <Text style={[styles.aiText, { color: primaryColor }]}>AI search</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Logo and Title Section */}
        <View style={styles.titleSection}>
          <Image
            source={logoSource}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <Text style={[styles.title, { color: primaryColor }]}>CE - OTTER</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Connection, Outreach, Transformation, Teaching, Empowerment & Resources
          </Text>
        </View>

        {/* Mission Section */}
        <View style={[styles.missionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.missionHeader}>
            <Ionicons name="heart" size={24} color={primaryColor} />
            <Text style={[styles.missionTitle, { color: textColor }]}>Our Mission</Text>
          </View>
          <Text style={[styles.missionDesc, { color: textSecondary }]}>
            C-OTTER empowers students through accessible support, community engagement, and academic growth by providing a unified digital platform designed to uplift, inform, and connect the campus community.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => router.push("/aisearch")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="chatbubbles" size={24} color="#2563eb" />
              </View>
              <Text style={[styles.quickActionText, { color: textColor }]}>AI Assistant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => router.push('/health/mental-health')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#fdf2f8' }]}>
                <Ionicons name="heart" size={24} color="#db2777" />
              </View>
              <Text style={[styles.quickActionText, { color: textColor }]}>Mental Health</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => router.push('/health/fitness')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="fitness" size={24} color="#dc2626" />
              </View>
              <Text style={[styles.quickActionText, { color: textColor }]}>Fitness</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => router.push('/health/nutrition')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#fefce8' }]}>
                <Ionicons name="restaurant" size={24} color="#ca8a04" />
              </View>
              <Text style={[styles.quickActionText, { color: textColor }]}>Nutrition</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event/Alert Cards */}
        <View style={styles.eventsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.eventsScrollContent}
          >
            {eventCards.map((card, idx) => (
              <View key={idx} style={[styles.eventCard, { backgroundColor: card.color }]}> 
                <Ionicons name={card.icon as any} size={32} color="#fff" style={{ marginBottom: 8 }} />
                <Text style={styles.eventTitle}>{card.title}</Text>
                <Text style={styles.eventDesc}>{card.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Crisis Hotline Banner */}
        <TouchableOpacity 
          style={[styles.crisisBanner, { backgroundColor: '#fef2f2' }]}
          activeOpacity={0.8}
        >
          <View style={styles.crisisContent}>
            <Ionicons name="warning" size={24} color="#dc2626" />
            <View style={styles.crisisTextContainer}>
              <Text style={[styles.crisisTitle, { color: '#dc2626' }]}>Need Help?</Text>
              <Text style={[styles.crisisText, { color: '#991b1b' }]}>
                If you're in crisis, call or text 988
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.1,
    resizeMode: 'cover',
  },
  aiSearchContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  aiBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  aiText: {
    fontWeight: '600',
    fontSize: 14,
  },
  mainContent: {
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: 320,
  },
  missionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  missionDesc: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventsSection: {
    marginBottom: 24,
  },
  eventsScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  eventCard: {
    width: 180,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  eventTitle: {
    color: "#fff",
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  eventDesc: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  crisisContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crisisTextContainer: {
    marginLeft: 12,
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  crisisText: {
    fontSize: 14,
    marginTop: 2,
  },
});
