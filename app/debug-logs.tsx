import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type LogLevel = "LOG" | "WARN" | "ERROR";
type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details: string;
};

type LevelFilter = "ALL" | LogLevel;
const LOG_FILE = `${FileSystem.documentDirectory}offline-debug.log`;
const FILTERS: LevelFilter[] = ["ALL", "ERROR", "WARN", "LOG"];

const getLevelColor = (level: LogLevel) =>
  level === "ERROR" ? "#DC2626" : level === "WARN" ? "#D97706" : "#15803D";

const parseLogFile = (content: string): LogEntry[] => {
  const entries: LogEntry[] = [];
  const lines = content.split(/\r?\n/);
  let current: LogEntry | null = null;

  for (const line of lines) {
    const match = line.match(/^\[([^\]]+)\]\s+\[(LOG|WARN|ERROR)\]\s+(.*)$/);

    if (match) {
      if (current) entries.push(current);
      current = {
        id: `${entries.length}-${match[1]}`,
        timestamp: match[1],
        level: match[2] as LogLevel,
        message: match[3],
        details: "",
      };
    } else if (current && line.trim()) {
      current.details += `${current.details ? "\n" : ""}${line}`;
    }
  }

  if (current) entries.push(current);
  return entries.reverse();
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function DebugLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(LOG_FILE);
      if (!info.exists) {
        setLogs([]);
        return;
      }
      const content = await FileSystem.readAsStringAsync(LOG_FILE);
      setLogs(parseLogFile(content));
    } catch (error) {
      Alert.alert(
        "Unable to load logs",
        error instanceof Error ? error.message : "Could not read the local log file."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
      const searchable = `${log.message} ${log.details}`.toLowerCase();
      return matchesLevel && (!term || searchable.includes(term));
    });
  }, [logs, levelFilter, search]);

  const counts = useMemo(
    () => ({
      total: logs.length,
      errors: logs.filter((log) => log.level === "ERROR").length,
      warnings: logs.filter((log) => log.level === "WARN").length,
    }),
    [logs]
  );

  const exportLogs = async () => {
    try {
      setExporting(true);
      const info = await FileSystem.getInfoAsync(LOG_FILE);
      if (!info.exists) {
        Alert.alert("No logs found", "The debug log file does not exist.");
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(LOG_FILE, {
          mimeType: "text/plain",
          dialogTitle: "Export CIS diagnostic logs",
          UTI: "public.plain-text",
        });
      } else {
        Alert.alert("Sharing unavailable", "Cannot share logs on this device.");
      }
    } catch (error) {
      Alert.alert(
        "Export failed",
        error instanceof Error ? error.message : "Unable to export logs."
      );
    } finally {
      setExporting(false);
    }
  };

  const renderLog = ({ item }: { item: LogEntry }) => (
    <Pressable style={styles.logCard} onPress={() => setSelectedLog(item)}>
      <View style={styles.logHeader}>
        <View style={[styles.levelBadge, { backgroundColor: `${getLevelColor(item.level)}18` }]}>
          <Text style={[styles.levelText, { color: getLevelColor(item.level) }]}>{item.level}</Text>
        </View>
        <Text style={styles.logDate} numberOfLines={1}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.logMessage} numberOfLines={2}>{item.message}</Text>
      <Text style={styles.viewDetails}>Tap to view details</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Application Logs</Text>
          <Text style={styles.subtitle}>Local device diagnostics</Text>
        </View>
        <Pressable
          style={[styles.exportButton, exporting && styles.disabledButton]}
          onPress={exportLogs}
          disabled={exporting}
        >
          <Text style={styles.exportButtonText}>{exporting ? "Preparing..." : "Export"}</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total logs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#DC2626" }]}>{counts.errors}</Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#D97706" }]}>{counts.warnings}</Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search log messages or details..."
        placeholderTextColor="#888"
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((filter) => {
          const active = levelFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setLevelFilter(filter)}
              style={[styles.filterButton, active && styles.activeFilter]}
            >
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A1A4E" />
          <Text style={styles.emptyText}>Loading logs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          contentContainerStyle={filteredLogs.length ? styles.listContent : styles.emptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadLogs();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No logs found</Text>
              <Text style={styles.emptyText}>There are no matching entries in this device's log file.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={selectedLog !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log details</Text>
              <Pressable onPress={() => setSelectedLog(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </Pressable>
            </View>
            {selectedLog && (
              <ScrollView>
                <Text style={styles.detailLabel}>Level</Text>
                <Text style={[styles.detailValue, { color: getLevelColor(selectedLog.level) }]}>{selectedLog.level}</Text>
                <Text style={styles.detailLabel}>Date and time</Text>
                <Text style={styles.detailValue}>{formatDate(selectedLog.timestamp)}</Text>
                <Text style={styles.detailLabel}>Message</Text>
                <Text style={styles.detailValue}>{selectedLog.message}</Text>
                <Text style={styles.detailLabel}>Additional details</Text>
                <Text style={styles.detailsBlock}>{selectedLog.details || "No additional details available."}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  header: { paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#1A1A4E", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "700" },
  subtitle: { color: "#D7D9F0", fontSize: 12, marginTop: 4 },
  exportButton: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  exportButtonText: { color: "#1A1A4E", fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
  statsRow: { flexDirection: "row", gap: 10, padding: 14 },
  statCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 10, padding: 13, elevation: 1 },
  statNumber: { color: "#1A1A4E", fontSize: 22, fontWeight: "700" },
  statLabel: { color: "#687083", fontSize: 12, marginTop: 4 },
  searchInput: { backgroundColor: "#FFFFFF", marginHorizontal: 14, borderRadius: 9, borderWidth: 1, borderColor: "#E0E4EC", paddingHorizontal: 13, paddingVertical: 11, color: "#202633" },
  filterRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  filterButton: { borderWidth: 1, borderColor: "#D5DAE5", borderRadius: 20, paddingHorizontal: 17, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  activeFilter: { backgroundColor: "#1A1A4E", borderColor: "#1A1A4E" },
  filterText: { color: "#4B5563", fontWeight: "600", fontSize: 12 },
  activeFilterText: { color: "#FFFFFF" },
  listContent: { paddingHorizontal: 14, paddingBottom: 24 },
  logCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E9ECF2" },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9, gap: 8 },
  levelBadge: { borderRadius: 5, paddingHorizontal: 9, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: "800" },
  logDate: { color: "#778094", fontSize: 11, flexShrink: 1 },
  logMessage: { color: "#202633", fontSize: 14, fontWeight: "600" },
  viewDetails: { color: "#303F8F", fontSize: 11, fontWeight: "600", marginTop: 9 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyList: { flexGrow: 1 },
  emptyTitle: { color: "#202633", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#778094", fontSize: 13, marginTop: 8, textAlign: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "82%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { color: "#202633", fontSize: 18, fontWeight: "700" },
  closeButton: { color: "#303F8F", fontWeight: "700" },
  detailLabel: { color: "#778094", fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 5, textTransform: "uppercase" },
  detailValue: { color: "#202633", fontSize: 14, lineHeight: 21 },
  detailsBlock: { color: "#202633", fontSize: 12, lineHeight: 19, backgroundColor: "#F4F6FA", borderRadius: 8, padding: 12, marginBottom: 20 },
});
