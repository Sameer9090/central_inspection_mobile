import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { API } from "../services/api";

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    loadUser();
    loadDashboard();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("TOKEN:", token);
      const response = await API.get("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.user);
    } catch (error) {
      console.log(error);
    }
  };
  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await API.get("/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQueueCount(response.data.applications_in_queue);
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.post(
        "/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      router.replace("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {user && (
        <>
          <Text>
            Welcome {user.firstname} {user.lastname}
          </Text>

          <Text>Username: {user.username}</Text>

          <Text>Role: {user.role_id}</Text>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/applications")}
          >
            <Text style={styles.cardTitle}>Applications In Queue</Text>

            <Text style={styles.cardCount}>{queueCount}</Text>

            <Text style={{ marginTop: 10 }}>Tap to View</Text>
          </TouchableOpacity>
        </>
      )}

      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
    elevation: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  cardCount: {
    fontSize: 40,
    fontWeight: "bold",
    marginTop: 10,
  },
});
