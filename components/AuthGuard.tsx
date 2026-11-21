import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }
      } catch (error) {
        // If local storage cannot be read, fail closed and return to login.
        router.replace("/login");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    checkAuth();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
