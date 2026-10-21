import { useEffect } from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "@/hooks/ThemeContext";
import { AdminAuthProvider } from "@/app/admin/context/AdminAuthContext";
import { AuthProvider } from "@/app/sign-in/AuthContext";
import { HealthService } from "@/services/health";

const healthService = new HealthService();

export default function RootLayout() {
  // Log any finished days (usually yesterday) to the database on every open.
  useEffect(() => {
    healthService.syncOnLaunch().catch((error) => console.error("syncOnLaunch failed:", error));
  }, []);

  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <AuthProvider>
           <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} ></Stack.Screen>
            <Stack.Screen name="aisearch" options={{ headerShown: false }} ></Stack.Screen>
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen
              name="coloring"
              options={{
                headerShown: false
              }}
            />
          </Stack>
        </AuthProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
