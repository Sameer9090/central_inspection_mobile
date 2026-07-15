import { Buffer } from 'buffer';
import { Stack } from "expo-router";
import "react-native-get-random-values";
import { NotificationProvider } from "../context/NotificationContext";
global.Buffer = Buffer;

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="track" />
        <Stack.Screen name="track-history" />
        <Stack.Screen name="notifications/index" />
      </Stack>
    </NotificationProvider>
  );
}
