
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BACKEND_URL = 'http://10.0.0.71:4000';
const logoUrl = `${BACKEND_URL}/images/C-Otter.jpg`;

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
    color: "#f59e42",
  },
  {
    title: "Campus Safety Alert",
    desc: "Be aware of construction near Lot B",
    icon: "alert-circle",
    color: "#fbbf24",
  },
];

export function HomePage() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 32 }}>
        <Image source={{ uri: logoUrl }} style={styles.logoSmall} resizeMode="cover" />
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={styles.title}>C-Otter</Text>
          <Text style={styles.subtitle}>
            (Connection, Outreach, Transformation, Teaching, Empowerment & Resources)
          </Text>
        </View>
        <Image source={{ uri: logoUrl }} style={styles.logoSmall} resizeMode="cover" />
      </View>

      {/* AI Search bubble */}
      <View style={{ position: "absolute", top: 32, right: 24, flexDirection: "row", alignItems: "center", zIndex: 10 }}>
        <TouchableOpacity
          style={styles.aiBubble}
          onPress={() => router.push("/aisearch")}
          activeOpacity={0.8}
        >
          <Text style={styles.aiText}>AI search</Text>
        </TouchableOpacity>
        <Ionicons name="search" size={22} color="#2563eb" style={{ marginLeft: 8 }} />
      </View>

      {/* Mission Section */}
      <View style={{ alignItems: "center", marginTop: 24 }}>
        <Text style={styles.missionTitle}>Mission</Text>
        <Text style={styles.missionDesc}>
          C-OTTER empowers students through accessible support, community engagement, and academic growth by providing a unified digital platform designed to uplift, inform, and connect the campus community.
        </Text>
      </View>

      {/* Event/Alert Cards */}
      <View style={{ marginTop: 32, marginBottom: 24 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}>
          {eventCards.map((card, idx) => (
            <View key={idx} style={[styles.card, { backgroundColor: card.color }]}> 
              <Ionicons name={card.icon as any} size={32} color="#fff" style={{ marginBottom: 8 }} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDesc}>{card.desc}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  logoSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8,
    maxWidth: 320,
  },
  aiBubble: {
    backgroundColor: "#e0e7ff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#2563eb",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  aiText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 14,
  },
  missionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 6,
  },
  missionDesc: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 8,
  },
  card: {
    width: 220,
    borderRadius: 16,
    padding: 18,
    marginVertical: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
    textAlign: "center",
  },
  cardDesc: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
});
