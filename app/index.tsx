import { UserForm } from "@/components/UserForm";
import { Text, View } from "react-native";

import "../global.css";


export default function Index() {
  return (
    <View className="flex-1 bg-white items-center px-4 pt-16">

      <Text className="text-2xl font-bold text-blue-700 mb-6">
        Healthcare Location Finder
      </Text>

      <Text className="text-base text-gray-600 mb-4">
        Find healthcare services near you
      </Text>
      <UserForm />
    </View>
  );
}
