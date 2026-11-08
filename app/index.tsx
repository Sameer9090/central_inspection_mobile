
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { hasOfflineCredentials, getOfflineUser } from "../services/offlineAuth";

export default function Index() {
  useEffect(() => {
    let mounted = true;

    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const user = await AsyncStorage.getItem("user");

        console.log("ROOT ROUTE CHECK:", {
          tokenExists: !!token,
          userExists: !!user,
        });

        if (token && user) {
          console.log("ROOT ROUTE: Online session found");

          if (mounted) router.replace("/dashboard");
          return;
        }

        const offlineAvailable = await hasOfflineCredentials();
        const offlineUser = offlineAvailable
          ? await getOfflineUser()
          : null;

        if (offlineAvailable && offlineUser) {
          console.log("ROOT ROUTE: Offline credentials available");

          if (mounted) router.replace("/login");
          return;
        }

        console.log("ROOT ROUTE: No saved session");

        if (mounted) router.replace("/login");
      } catch (error) {
        console.log("Authentication storage error:", error);

        if (mounted) router.replace("/login");
      }
    };

    checkLogin();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
