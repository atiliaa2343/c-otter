import { Stack } from "expo-router";
import { ThemeProvider } from "@/hooks/ThemeContext";
import { AdminAuthProvider } from "@/app/admin/context/AdminAuthContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} ></Stack.Screen>
        </Stack>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
