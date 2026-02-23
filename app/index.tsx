import React, { useState, useEffect } from "react";
import "../global.css";
import { HomePage } from "@/components/HomePage";
import { Text, View, FlatList, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { HealthForm } from "@/components/Health";
import { FacultyForm } from "@/components/Faculty";
import Research from "@/components/Research";

// define supabase database types
import { supabase } from "@/db/supabase";
import { Tables } from "@/db/database.types";

// define database tables types
type hours_of_operation = Tables<"hours_of_operation">
type locations = Tables<"locations">

type NavigationItem = "home" | "research" | "community" | "health" | "faculty";

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<NavigationItem>("home");
  const [locations, setlocations] = useState<hours_of_operation[]>();
  const [loading, setLoading] = useState(true);
  async function getlocations() {
    try {
      const { data } = await supabase.from("hours_of_operation").select("*");
      if (data) {
        setlocations(data); 
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { // TODO: Try to use something other than useEffect here
    getlocations();
  }, []);

  // Navigation items configuration
  const navigationItems = [
    { id: "home" as NavigationItem, label: "Home", icon: "home", iconSet: "Ionicons" },
    { id: "research" as NavigationItem, label: "Research", icon: "flask", iconSet: "Ionicons" },
    { id: "community" as NavigationItem, label: "Community", icon: "people", iconSet: "Ionicons" },
    { id: "health" as NavigationItem, label: "Health", icon: "medical", iconSet: "Ionicons" },
    { id: "faculty" as NavigationItem, label: "Faculty", icon: "school", iconSet: "Ionicons" },
  ];

  // Render navigation icon based on icon set
  const renderIcon = (iconSet: string, iconName: string, color: string) => {
    const size = 24;
    if (iconSet === "Ionicons") {
      return <Ionicons name={iconName as any} size={size} color={color} />;
    } else if (iconSet === "MaterialIcons") {
      return <MaterialIcons name={iconName as any} size={size} color={color} />;
    } else if (iconSet === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
    }
    return null;
  };

  // Render page content based on current selection
  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "research":
        return <Research />;
      case "community":
        return (
          <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-bold text-gray-800">Community Service</Text>
            <Text className="text-gray-600 mt-2">Community service content coming soon</Text>
          </View>
        );
      case "health":
        return <HealthForm />;
      case "faculty":
        return <FacultyForm />;
      // Pictures tab removed
      default:
        return null;
    }
  };

  // Show splash screen
  if (showSplash) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Image
          source={require("@/assets/images/C-Otter.jpg")}
          style={{ width: 500, height: 500 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Page Content (don't wrap children in a plain ScrollView to avoid nested VirtualizedLists) */}
      <View className="flex-1">
        {renderPageContent()}
      </View>

      {/* Bottom Navigation Bar - raised higher */}
      <View style={{ backgroundColor: '#2563eb', paddingBottom: 18, paddingTop: 10, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#1e40af', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setCurrentPage(item.id)}
            style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 6, borderRadius: 8, flex: 1, backgroundColor: currentPage === item.id ? '#3b82f6' : 'transparent' }}
            activeOpacity={0.7}
          >
            {renderIcon(
              item.iconSet,
              item.icon,
              currentPage === item.id ? "#FFFFFF" : "#E0E7FF"
            )}
            <Text
              style={{ fontSize: 11, marginTop: 2, color: currentPage === item.id ? '#fff' : '#dbeafe', fontWeight: currentPage === item.id ? '600' : '400' }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
