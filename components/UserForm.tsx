import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";

export function UserForm() {
  const [ [name, city_zip_code], setName] = useState("");

  const handleSubmit = () => {
    Alert.alert(`The name you entered was: ${name}`);
  };

  return (
    <View>
      <Text></Text>
      <TextInput
        value={city_zip_code}
        onChangeText={setName}
        placeholder="Enter your zip code or city"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
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
        }}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
