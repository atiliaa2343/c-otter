
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
      {/* AI Search bubble stays at the top */}
      <View style={{ position: "absolute", top: 64, right: 24, flexDirection: "row", alignItems: "center", zIndex: 10 }}>
        <Ionicons name="search" size={32} color="#2563eb" style={{ marginRight: 14 }} />
        <TouchableOpacity
          style={[styles.aiBubble, { paddingVertical: 12, paddingHorizontal: 22 }]}
          onPress={() => router.push("/aisearch")}
          activeOpacity={0.8}
        >
          <Text style={[styles.aiText, { fontSize: 20 }]}>AI search</Text>
        </TouchableOpacity>
      </View>

      {/* All other content shifted further down */}
      <View style={{ marginTop: 180 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
          <Image source={{ uri: logoUrl }} style={styles.logoSmall} resizeMode="cover" />
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.title}>C-Otter</Text>
            <Text style={styles.subtitle}>
              (Connection, Outreach, Transformation, Teaching, Empowerment & Resources)
            </Text>
          </View>
          <Image source={{ uri: logoUrl }} style={styles.logoSmall} resizeMode="cover" />
        </View>

        {/* Mission Section */}
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 40 }}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionDesc}>
            C-OTTER empowers students through accessible support, community engagement, and academic growth by providing a unified digital platform designed to uplift, inform, and connect the campus community.
          </Text>
        </View>

        {/* Event/Alert Cards */}
        <View style={{ marginTop: 32, marginBottom: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}>
            {eventCards.map((card, idx) => (
              <View key={idx} style={[styles.cardLarge, { backgroundColor: card.color }]}> 
                <Ionicons name={card.icon as any} size={36} color="#fff" style={{ marginBottom: 10 }} />
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDesc}>{card.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardLarge: {
    width: 220,
    borderRadius: 18,
    padding: 20,
    marginVertical: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
    missionTitle: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#2563eb",
      marginBottom: 8,
      textAlign: "center",
    },
  // ...existing code...
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
    textAlign: "center",
    marginBottom: 4,
  },
  // ...existing code...
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
  },
  logoSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "#fff",
  },
  subtitle: {
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8,
    maxWidth: 320,
  },
  missionDesc: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 8,
  },
  card: {
    width: 200,
    borderRadius: 18,
    padding: 16,
    marginVertical: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
    textAlign: "center",
  },
  // ...existing code...
  aiText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 14,
  },
  cardDesc: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
});
