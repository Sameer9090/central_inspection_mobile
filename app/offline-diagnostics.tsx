
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { getOfflineDatabase } from "../services/offlineDatabase";
import { getApplicationQueue } from "../services/offlineStorage";

export default function OfflineDiagnostics() {
  const [results, setResults] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const output: string[] = [];

    try {
      const network = await NetInfo.fetch();
      output.push(
        `Internet: ${network.isConnected ? "Connected" : "Disconnected"}`
      );
    } catch {
      output.push("Internet: Check failed");
    }

    try {
      const token = await AsyncStorage.getItem("token");
      output.push(`Authentication: ${token ? "Token available" : "No token"}`);
    } catch {
      output.push("Authentication: Check failed");
    }

    try {
      const db = await getOfflineDatabase();
      output.push("SQLite: Database opened");

      const drafts = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM inspection_drafts"
      );
      output.push(`Inspection drafts: ${drafts?.count ?? 0}`);

      const pending = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'"
      );
      output.push(`Pending sync items: ${pending?.count ?? 0}`);

      const cached = await getApplicationQueue();
      output.push(
        `Application cache: ${
          Array.isArray(cached) ? `${cached.length} applications` : "No cache"
        }`
      );
    } catch (error: any) {
      output.push(`SQLite/cache error: ${error?.message ?? "Unknown error"}`);
    }

    setResults(output);
    setChecking(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>CIS Offline Diagnostics</Text>

      <Button
        title={checking ? "Checking..." : "Run Diagnostics"}
        onPress={runChecks}
        disabled={checking}
      />

      {results.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 15 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  item: { padding: 14, backgroundColor: "#eeeeee", borderRadius: 8 },
});
