import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text } from "react-native";

export function UserForm() {
  const [name, setName] = useState("");
  const [city_zip_code, setCity] = useState("");

  const handleSubmit = () => {
    Alert.alert(
      "Submission",
      `The name you entered was: ${name} and the zip code/city you entered is ${city_zip_code}`
    );
    console.log(`The name you entered was: ${name} and the zip code/city you entered is ${city_zip_code}`);
    // TODO: Submit to backend
  };

  return (
    <View className="w-full px-4 space-y-4">
      <TextInput
        keyboardType="numeric"
        maxLength = {5}
        value={city_zip_code}
        onChangeText={setCity}
        placeholder="Enter your zip code or city"
        className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-white text-base"
        placeholderTextColor="#999"
      />

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Search by name or healthcare type"
        className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-white text-base"
        placeholderTextColor="#999"
      />

      <View className="w-full">
        <Button title="Submit" onPress={handleSubmit} color="#2563eb" />
      </View>
    </View>
  );
}
