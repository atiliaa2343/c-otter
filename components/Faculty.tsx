import React from "react";
import { View, Text, Image, ScrollView } from "react-native";

export function FacultyForm() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-full px-5 py-10">
        {/* Header */}
        <View className="mb-6 items-center">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Faculty
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Meet our research team
          </Text>
        </View>

         {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Larry.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Larry Keen II, Ph.D
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Associate Professor in Psychology; PNIRD Lab Director
            </Text>

            {/* Email */}
            <Text className="text-sm text-blue-600 mb-1">
              LKeen@vsu.edu
            </Text>

            {/* Phone */}
            <Text className="text-sm text-gray-700 mb-3">
              (804) 524-5523
            </Text>
          </View>
        </View>

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Kimberly.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Kimberly Lawrence, Ph.D.
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Associate Professor in Psychology
            </Text>

            {/* Email */}
            <Text className="text-sm text-blue-600 mb-1">
              KLawrence@vsu.edu
            </Text>

            {/* Phone */}
            <Text className="text-sm text-gray-700 mb-3">
             (804) 524-5447
            </Text>
          </View>
        </View> 

         {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Arlener.png")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Arlener D. Turner, Ph.D
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Associate Professor 
            </Text> 
             <Text className="text-sm text-gray-700 mb-1">
              Department of Psychiatry and Behavioral Sciences 
            </Text> 
             <Text className="text-sm text-gray-700 mb-1">
              University of Miami
            </Text>

            {/* Email */}
            <Text className="text-sm text-blue-600 mb-1">
              adanielleturner@gmail.com
            </Text>

            {/* Phone */}
            <Text className="text-sm text-gray-700 mb-3">
              (773) 339-1797
            </Text>
          </View>
        </View> 

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Alexis.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Alexis Morris, M.S.
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Graduate Research Assistant 
            </Text> 
          </View>
        </View> 

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Diamond.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Diamond Adams
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Graduate Research Assistant 
            </Text> 
          </View>
        </View> 

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Corrina.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Corrina Stevenson
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Graduate Research Assistant 
            </Text> 
          </View>
        </View> 

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Ayanna.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Ayanna Reid
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Graduate Research Assistant 
            </Text> 
          </View>
        </View> 

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Manuelene.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Manuelene Deigh
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
              Graduate Research Assistant 
            </Text> 
          </View>
        </View> 

        {/* Faculty Profile */}
        <View className="flex-row mb-6">
          {/* Profile Image */}
          <View className="mr-4">
            <Image
              source={require("../assets/images/Davian.jpeg")}
              style={{ width: 120, height: 150, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          {/* Profile Information */}
          <View className="flex-1">
            {/* Name - Bold and Underlined */}
            <Text className="text-lg font-bold underline text-gray-900 mb-2">
              Davian Clifton
            </Text>

            {/* Title */}
            <Text className="text-sm text-gray-700 mb-1">
                Research Assistant 
            </Text> 
          </View>
        </View>
      </View> 
    </ScrollView>
  );
}
