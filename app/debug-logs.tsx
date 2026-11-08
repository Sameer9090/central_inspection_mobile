
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

export default function DebugLogs() {
  const [loading, setLoading] = useState(false);

  const exportLogs = async () => {
    try {
      setLoading(true);

      const file = `${FileSystem.documentDirectory}offline-debug.log`;
      const info = await FileSystem.getInfoAsync(file);

      if (!info.exists) {
        Alert.alert("No logs found", "The debug log file does not exist.");
        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(file);
      } else {
        Alert.alert("Sharing unavailable", "Cannot share logs on this device.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Offline Diagnostic Logs</Text>
      <Button
        title={loading ? "Preparing..." : "Export Debug Logs"}
        onPress={exportLogs}
        disabled={loading}
      />
    </View>
  );
}
