import React, { useState, useEffect } from "react";
import "../global.css";
import { UserForm } from "@/components/UserForm";
import { Text, View, FlatList, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { HealthForm } from "@/components/Health";
import { FacultyForm } from "@/components/Faculty";
import Research from "@/components/Research";
import Pictures from "@/components/Pictures";

// define supabase database types
import { supabase } from "@/db/supabase";
import { Tables } from "@/db/database.types";

// define database tables types
type hours_of_operation = Tables<"hours_of_operation">
type locations = Tables<"locations">

type NavigationItem = "home" | "research" | "community" | "health" | "faculty" | "pictures";

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
    { id: "pictures" as NavigationItem, label: "Pictures", icon: "images", iconSet: "Ionicons" },
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
        return (
          <View className="flex-1 bg-white items-center px-4 pt-16">
            <Text className="text-2xl font-bold text-blue-700 mb-6 text-center">
              Healthcare Location Finder
            </Text>
            <Text className="text-base text-gray-600 mb-4">
              Find healthcare services near you
            </Text>
            <UserForm />
            {loading ? (
              <Text>Loading...</Text>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => item.location_id?.toString() ?? item.id?.toString() ?? ''}
                renderItem={({ item }) => (
                  <Text className="text-gray-800" key={item.location_id ?? item.id}>
                    {item.created_at} , {item.open_time}
                  </Text>
                )}
              />
            )}
          </View>
        );
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
      case "pictures":
        return (
          // lazy-load the Pictures component to keep bundle size smaller
          <React.Suspense fallback={<View className="items-center justify-center py-8"><Text>Loading pictures...</Text></View>}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <Pictures />
          </React.Suspense>
        );
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

      {/* Bottom Navigation Bar */}
      <View className="bg-blue-700 pb-2 pt-2 px-1 border-t border-blue-600 flex-row justify-around items-center">
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setCurrentPage(item.id)}
            className={`items-center justify-center px-1 py-1 rounded-lg flex-1 ${
              currentPage === item.id ? "bg-blue-500" : "bg-transparent"
            }`}
            activeOpacity={0.7}
          >
            {renderIcon(
              item.iconSet,
              item.icon,
              currentPage === item.id ? "#FFFFFF" : "#E0E7FF"
            )}
            <Text
              className={`text-[10px] mt-0.5 ${
                currentPage === item.id ? "text-white font-semibold" : "text-blue-100"
              }`}
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
