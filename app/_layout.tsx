import { Stack } from "expo-router";
import "react-native-get-random-values";
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="track" />
      <Stack.Screen name="track-history" />
      <Stack.Screen name="notifications/index" />
    </Stack>
  );
}