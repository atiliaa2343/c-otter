import { Stack } from "expo-router";
import { ThemeProvider } from "@/hooks/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} ></Stack.Screen>
      </Stack>
    </ThemeProvider>
  );
}
