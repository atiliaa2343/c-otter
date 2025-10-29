import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text, Image } from "react-native";

export function LandingForm() {
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

  const AVATAR_SIZE = 400;
  return ( 

    <View className="w-full px-4 space-y-4"> 
      <View className="items-center"> 
        <View style={{ height: 30 }} />
        <Text className="text-3xl font-bold text-blue-1000 mb-2">C Otter</Text> 

        <View style={{ height: 70 }} />
        <Image 
          style={{width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, marginBottom:12}}
          source={require('../assets/images/C-Otter.jpg')}
          className="w-14 h-4 rounded-lg mb-4"
          accessibilityLabel="C-Otter"
          resizeMode="cover"
        />
      </View>

      
    </View>
  );
}
