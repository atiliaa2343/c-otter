import { UserForm } from "@/components/UserForm";
import { Text, View, FlatList } from "react-native";
import "../global.css";
import { supabase } from "@/db/supabase";
import React, { useState, useEffect } from "react";

export default function Index() {
  const [locations, setlocations] = useState([]);
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

  useEffect(() => { // TODO: Don't use useEffect use something else
    getlocations();
  }, []);

  return (
    <View className="flex-1 bg-white items-center px-4 pt-16">
      <Text className="text-2xl font-bold text-blue-700 mb-6">
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
          keyExtractor={(item) => item.location_id.toString()}
          renderItem={({ item }) => (
            <Text className="text-gray-800" key={item.location_id}>
              {item.created_at}
            </Text>
          )}
        />
      )}
    </View>
  );
}
