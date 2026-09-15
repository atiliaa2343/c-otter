import { Stack } from "expo-router";
import { ThemeProvider } from "@/hooks/ThemeContext";
import { AdminAuthProvider } from "@/app/admin/context/AdminAuthContext";
import { AuthProvider } from "@/app/sign-in/AuthContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <AuthProvider>
           <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} ></Stack.Screen>
            <Stack.Screen name="aisearch" options={{ headerShown: false }} ></Stack.Screen>
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
