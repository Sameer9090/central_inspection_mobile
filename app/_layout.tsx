
import { Buffer } from "buffer";
import { Stack } from "expo-router";
import { useEffect } from "react";
import "react-native-get-random-values";
import { initializeConsoleLogger } from "../services/consoleLogger";
import { NotificationProvider } from "../context/NotificationContext";
import {
  getOfflineDatabase,
  verifyOfflineTables,
} from "../services/offlineDatabase";

import { initializeApiServer } from "../services/api";
global.Buffer = Buffer;
export default function RootLayout() {


  useEffect(() => {
    initializeConsoleLogger();

    const initializeApp = async () => {
      try {
        // Initialize local database first.
        await getOfflineDatabase();

        const tables = await verifyOfflineTables();

        console.log("CIS Offline Database initialized successfully");
        console.log("Verified tables:", tables);

      } catch (error) {
        console.error("Offline Database initialization failed:", error);
      }

      // API initialization should not prevent offline app startup.
      initializeApiServer().catch((error) => {
        console.log("API server initialization skipped:", error);
      });
    };

    initializeApp();
  }, []);


  // Keep your existing return statement unchanged.

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
