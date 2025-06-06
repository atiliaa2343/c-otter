import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { Dimensions } from 'react-native';

export function UserForm() {
  const [name, setName] = useState("");
  const [city_zip_code, setCity] = useState("");

  const windowWidth = Dimensions.get('window').width;

  const handleSubmit = () => {
    console.log(`The name you entered was: ${name} and the zip code/city you entered is ${city_zip_code}`);
    Alert.alert("Submission", `The name you entered was: ${name} and the zip code/city you entered is ${city_zip_code}`);
    // TODO:
    // Enter submit logic backend here using the supabase
  };
  

  return (
    <View>
      <Text></Text>
      <TextInput
        value={city_zip_code}
        onChangeText={setCity}
        placeholder="Enter your zip code or city"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          width: windowWidth
        }}
      />

    <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Search By Name or HealthCare Type"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          width: windowWidth
        }}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
