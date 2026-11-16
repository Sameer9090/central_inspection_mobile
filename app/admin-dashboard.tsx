import { Feather, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Href, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    ImageBackground,
    Modal as RNModal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import { API } from "../services/api";


const Icons = {
  Users: () => <Feather name="users" size={22} color="rgba(255,255,255,0.8)" />,
  BarChart: () => (
    <Feather name="bar-chart-2" size={22} color="rgba(255,255,255,0.8)" />
  ),
  FileText: () => (
    <Feather name="file-text" size={22} color="rgba(255,255,255,0.8)" />
  ),
  Settings: () => (
    <Feather name="settings" size={22} color="rgba(255,255,255,0.8)" />
  ),
  Shield: () => (
    <Feather name="shield" size={22} color="rgba(255,255,255,0.8)" />
  ),
  Activity: () => (
    <Feather name="activity" size={22} color="rgba(255,255,255,0.8)" />
  ),
  ChevronRight: () => (
    <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
  ),
  User: () => <Feather name="user" size={14} color="#8ab4d9" />,
  Building2: () => <FontAwesome5 name="building" size={14} color="#8ab4d9" />,
  Clock: () => <Feather name="clock" size={14} color="#8ab4d9" />,
  Calendar: () => <Feather name="calendar" size={14} color="#8ab4d9" />,
  LogOut: () => <Feather name="log-out" size={22} color="#fff" />,
};

interface AdminCard {
  title: string;
  value: number | string;
  icon: () => React.ReactNode;
  color: string;
  route: string;
}

export default function AdminDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total_users: 0,
    total_offices: 0,
    total_applications: 0,
    pending_approvals: 0,
    inspections_today: 0,
    reports_generated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const loadDashboard = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");

      if (!token) {
        router.replace("/login");
        return;
      }

      // Verify user is admin
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role_id !== 1) {
          Alert.alert("Access Denied", "You do not have admin privileges.");
          router.replace("/dashboard");
          return;
        }
        setUser(parsedUser);
      }

      const response = await API.get("/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const data = response.data.data || {};
        setStats({
          total_users: data.total_users || 0,
          total_offices: data.total_offices || 0,
          total_applications: data.total_applications || 0,
          pending_approvals: data.pending_approvals || 0,
          inspections_today: data.inspections_today || 0,
          reports_generated: data.reports_generated || 0,
        });
      }
    } catch (error: any) {
      console.log("Admin API Error:", error?.response?.status, error?.response?.data);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || "Failed to load admin dashboard";

      if (status === 403) {
        Alert.alert("Access Denied", "Admin access only.");
        router.replace("/dashboard");
      } else if (status === 401) {
        Alert.alert("Session Expired", "Please login again.");
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        router.replace("/login");
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const loadDebugLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError("");

    try {
      const logFile = `${FileSystem.documentDirectory}offline-debug.log`;
      const fileInfo = await FileSystem.getInfoAsync(logFile);

      if (!fileInfo.exists) {
        setDebugLogs([]);
        return;
      }

      const contents = await FileSystem.readAsStringAsync(logFile);
      const entries = contents
        .split(/\n\s*\n/)
        .map((entry) => entry.trim())
        .filter(Boolean);

      // The logger appends entries, so show the newest entries first.
      setDebugLogs(entries.slice(-20).reverse());
    } catch (error: any) {
      console.log("Unable to read application logs:", error);
      setLogsError(error?.message || "Unable to read application logs.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebugLogs();
  }, [loadDebugLogs]);

  const logout = async () => {
    try {
      setLogoutModalVisible(false);
      const token = await AsyncStorage.getItem("token");
      await API.post("/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const getAdminCards = (): AdminCard[] => {
    const allCards: AdminCard[] = [
      { title: "TOTAL USERS", value: stats.total_users, icon: Icons.Users, color: "#4A90D9", route: "/admin/users" },
      { title: "TOTAL OFFICES", value: stats.total_offices, icon: Icons.Shield, color: "#7B68EE", route: "/admin/offices" },
      { title: "ALL APPLICATIONS", value: stats.total_applications, icon: Icons.FileText, color: "#2563EB", route: "/admin/applications" },
      { title: "PENDING APPROVALS", value: stats.pending_approvals, icon: Icons.Activity, color: "#E74C3C", route: "/admin/approvals" },
      { title: "INSPECTIONS TODAY", value: stats.inspections_today, icon: Icons.BarChart, color: "#27AE60", route: "/admin/inspections" },
      { title: "REPORTS", value: stats.reports_generated, icon: Icons.FileText, color: "#F39C12", route: "/admin/reports" },
    ];

    return allCards.filter((card) => {
      if (card.route === "/admin/reports") return true;
      return typeof card.value === "number" && card.value >= 0;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
        <ActivityIndicator size="large" color="#1a1a4e" />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const adminCards = getAdminCards();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <AppHeader />
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a4e" />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Admin welcome panel - matched to the Inspector Dashboard */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeLabel}>ADMIN DASHBOARD</Text>
                <Text style={styles.welcomeGreeting}>Welcome back!</Text>
                <Text
                  style={styles.welcomeName}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {user?.firstname} {user?.lastname}
                </Text>
                <Text style={styles.welcomeRole}>
                  {user?.role_name || "Administrator"}
                </Text>
              </View>
              <View style={styles.profileIcon}>
                <Feather name="shield" size={25} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.welcomeInfo}>
              <View style={styles.infoItem}>
                <View style={styles.infoLabelRow}>
                  <Icons.Building2 />
                  <Text style={styles.infoLabel}>OFFICE</Text>
                </View>
                <Text style={styles.infoValue}>
                  {user?.office_name || "System Administration"}
                </Text>
              </View>

              <View style={styles.dateTimeRow}>
                <View style={styles.infoItem}>
                  <View style={styles.infoLabelRow}>
                    <Icons.Calendar />
                    <Text style={styles.infoLabel}>DATE</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatDate(currentTime)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoLabelRow}>
                    <Icons.Clock />
                    <Text style={styles.infoLabel}>CURRENT TIME</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatTime(currentTime)}</Text>
                </View>
              </View>
            </View>
          </View>

          <ImageBackground
            source={require("../assets/images/assam-dashboard-bg.png")}
            style={styles.assamBanner}
            imageStyle={styles.assamBackground}
            resizeMode="stretch"
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>ADMIN OVERVIEW</Text>
            </View>
          </ImageBackground>

          {adminCards.length > 0 ? (
            <View style={styles.statsGrid}>
              {adminCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.statCard, { borderLeftColor: card.color }]}
                  onPress={() => router.push(card.route as Href)}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardMain}>
                    <View style={[styles.cardIconWrap, { backgroundColor: `${card.color}18` }]}>
                      <View style={[styles.cardIconAccent, { backgroundColor: card.color }]}>
                        <card.icon />
                      </View>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      <Text style={styles.cardValue}>{card.value}</Text>
                    </View>
                    <View style={styles.cardArrow}>
                      <Icons.ChevronRight />
                    </View>
                  </View>
                  <View style={styles.cardFooterSection}>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardLink}>Manage</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No Data Available</Text>
              <Text style={styles.emptySubtitle}>Admin statistics will appear here.</Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { borderLeftColor: "#4A90D9" }]}
              onPress={() => router.push("/admin/users" as Href)}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#4A90D918" }]}>
                <Feather name="users" size={21} color="#4A90D9" />
              </View>
              <Text style={styles.actionText}>Manage Users</Text>
              <Icons.ChevronRight />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { borderLeftColor: "#27AE60" }]}
              onPress={() => router.push("/admin/reports" as Href)}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#27AE6018" }]}>
                <Feather name="bar-chart-2" size={21} color="#27AE60" />
              </View>
              <Text style={styles.actionText}>View Reports</Text>
              <Icons.ChevronRight />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { borderLeftColor: "#6C63A8" }]}
              onPress={loadDebugLogs}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#6C63A818" }]}>
                <Feather name="clipboard" size={21} color="#6C63A8" />
              </View>
              <Text style={styles.actionText}>Refresh Application Logs</Text>
              <Icons.ChevronRight />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { borderLeftColor: "#D94848" }]}
              onPress={() => setLogoutModalVisible(true)}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#D9484818" }]}>
                <Feather name="log-out" size={21} color="#D94848" />
              </View>
              <Text style={styles.actionText}>Logout</Text>
              <Icons.ChevronRight />
            </TouchableOpacity>
          </View>

          {/* Application Logs - displayed directly on the Admin Dashboard */}
          <View style={styles.logsSection}>
            <View style={styles.logsHeader}>
              <View style={styles.logsTitleRow}>
                <Feather name="clipboard" size={18} color="#1a1a4e" />
                <Text style={styles.logsTitle}>APPLICATION LOGS</Text>
              </View>
              <TouchableOpacity
                style={styles.logsRefreshButton}
                onPress={loadDebugLogs}
                disabled={logsLoading}
                activeOpacity={0.8}
              >
                {logsLoading ? (
                  <ActivityIndicator size="small" color="#1a1a4e" />
                ) : (
                  <Feather name="refresh-cw" size={15} color="#1a1a4e" />
                )}
                <Text style={styles.logsRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.logsSubTitle}>
              Showing the latest {debugLogs.length} entries from this device
            </Text>

            {logsLoading && debugLogs.length === 0 ? (
              <View style={styles.logsEmptyState}>
                <ActivityIndicator size="small" color="#1a1a4e" />
                <Text style={styles.logsEmptyText}>Loading logs...</Text>
              </View>
            ) : logsError ? (
              <View style={styles.logsEmptyState}>
                <Feather name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.logsErrorText}>{logsError}</Text>
              </View>
            ) : debugLogs.length === 0 ? (
              <View style={styles.logsEmptyState}>
                <Feather name="file-text" size={22} color="#9CA3AF" />
                <Text style={styles.logsEmptyText}>
                  No application logs found on this device yet.
                </Text>
              </View>
            ) : (
              <View style={styles.logsList}>
                {debugLogs.map((entry, index) => {
                  const levelMatch = entry.match(/\[(LOG|WARN|ERROR)\]/);
                  const level = levelMatch?.[1] || "LOG";
                  const levelColor =
                    level === "ERROR" ? "#DC2626" :
                    level === "WARN" ? "#D97706" : "#15803D";

                  return (
                    <View key={`${index}-${entry.slice(0, 24)}`} style={styles.logEntry}>
                      <View style={styles.logEntryHeader}>
                        <Text style={[styles.logLevel, { color: levelColor }]}>
                          {level}
                        </Text>
                        <Text style={styles.logTimestamp}>
                          {entry.match(/^\[([^\]]+)\]/)?.[1] || ""}
                        </Text>
                      </View>
                      <Text selectable style={styles.logEntryText}>
                        {entry.replace(/^\[[^\]]+\]\s*\[(LOG|WARN|ERROR)\]\s*/, "")}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026. Labour Welfare Department, Govt. of Assam, India.
            </Text>
            <Text style={styles.footerSubText}>
              Admin Portal | National Informatics Centre, Assam
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Logout Modal */}
      <RNModal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={logout}
              >
                <Text style={styles.logoutButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F6FB" },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#1E2A4A", fontSize: 16, fontWeight: "600", marginTop: 12 },
  scrollView: { flex: 1 },

  welcomeSection: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    borderRadius: 20, overflow: "hidden", backgroundColor: "#FFFFFF",
    shadowColor: "#263B65", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: "#E7ECF4",
  },
  welcomeHeader: {
    backgroundColor: "#1E2F5B", paddingHorizontal: 20, paddingVertical: 21,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  welcomeLeft: { flex: 1, minWidth: 0, paddingRight: 12 },
  welcomeLabel: { color: "#B9C9EE", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginBottom: 7 },
  welcomeGreeting: { color: "#E5ECFA", fontSize: 16, fontWeight: "600" },
  welcomeName: { color: "#FFFFFF", fontSize: 23, fontWeight: "800", marginTop: 7, flexShrink: 1 },
  welcomeRole: { color: "#C5D2EA", fontSize: 12, fontWeight: "600", marginTop: 6 },
  profileIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center",
  },
  welcomeInfo: { backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingVertical: 17, gap: 16 },
  infoItem: { flex: 1, minWidth: 0 },
  infoLabelRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7 },
  infoLabel: { color: "#7B879B", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  infoValue: { color: "#293957", fontSize: 13, fontWeight: "700", lineHeight: 19, flexShrink: 1 },
  dateTimeRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderTopWidth: 1, borderTopColor: "#E9EEF5", paddingTop: 14,
  },

  assamBanner: { width: "100%", aspectRatio: 3.2, justifyContent: "flex-end", overflow: "hidden", marginBottom: 8 },
  assamBackground: { opacity: 0.48 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginHorizontal: 18, marginTop: 0, marginBottom: 12, gap: 10 },
  sectionIcon: { width: 5, height: 21, backgroundColor: "#3157A4", borderRadius: 3 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#34415D", letterSpacing: 1.1 },

  statsGrid: { flexDirection: "column", paddingHorizontal: 14, gap: 12 },
  statCard: {
    width: "100%", minHeight: 112, paddingHorizontal: 15, paddingVertical: 13,
    borderRadius: 16, borderLeftWidth: 4, backgroundColor: "#FFFFFF",
    justifyContent: "center", shadowColor: "#23395D", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderTopColor: "#E9EEF5", borderRightColor: "#E9EEF5", borderBottomColor: "#E9EEF5",
  },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconWrap: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardIconAccent: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, minWidth: 0, justifyContent: "center", gap: 3 },
  cardTitle: { color: "#34415D", fontSize: 12, fontWeight: "800", letterSpacing: 0.35, flexShrink: 1, lineHeight: 18, textTransform: "uppercase" },
  cardValue: { color: "#1E2F50", fontSize: 27, lineHeight: 32, fontWeight: "800", fontVariant: ["tabular-nums"] },
  cardArrow: { width: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardFooterSection: { marginTop: 10, marginLeft: 58 },
  cardDivider: { height: 1, backgroundColor: "#E9EEF5", marginBottom: 7 },
  cardFooter: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", minHeight: 18 },
  cardLink: { color: "#52627D", fontSize: 11, fontWeight: "700" },

  actionGrid: { flexDirection: "column", paddingHorizontal: 14, gap: 10, marginBottom: 12 },
  actionCard: {
    width: "100%", minHeight: 68, paddingHorizontal: 15, paddingVertical: 12,
    borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E9EEF5",
    borderLeftWidth: 4, flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#23395D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7, elevation: 2,
  },
  actionText: { color: "#34415D", fontSize: 13, fontWeight: "800", flex: 1 },
  actionIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, marginHorizontal: 16, backgroundColor: "#FFFFFF", borderRadius: 18 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 6 },

  logsSection: {
    backgroundColor: "#FFFFFF", marginHorizontal: 14, marginTop: 8, marginBottom: 12,
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E7ECF4",
    shadowColor: "#23395D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  logsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  logsTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logsTitle: { fontSize: 13, fontWeight: "800", color: "#34415D", letterSpacing: 0.8 },
  logsRefreshButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#EEF2F8", borderRadius: 9 },
  logsRefreshText: { color: "#3157A4", fontSize: 12, fontWeight: "700" },
  logsSubTitle: { color: "#7B879B", fontSize: 11, marginTop: 8, marginBottom: 12 },
  logsEmptyState: { minHeight: 72, alignItems: "center", justifyContent: "center", gap: 8, padding: 12, backgroundColor: "#F6F8FC", borderRadius: 10 },
  logsEmptyText: { color: "#64748B", fontSize: 12, textAlign: "center" },
  logsErrorText: { color: "#DC2626", fontSize: 12, textAlign: "center" },
  logsList: { gap: 10 },
  logEntry: { padding: 11, borderRadius: 10, backgroundColor: "#F6F8FC", borderWidth: 1, borderColor: "#E5EAF2" },
  logEntryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 },
  logLevel: { fontSize: 10, fontWeight: "800" },
  logTimestamp: { flex: 1, textAlign: "right", color: "#8490A5", fontSize: 10 },
  logEntryText: { color: "#374151", fontSize: 11, lineHeight: 17 },

  footer: { marginTop: 28, marginBottom: 20, paddingHorizontal: 20, alignItems: "center" },
  footerText: { fontSize: 11, color: "#8490A5", textAlign: "center", lineHeight: 18 },
  footerSubText: { fontSize: 11, color: "#A0AABC", textAlign: "center", marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "85%", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 22 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#1E2A4A", marginBottom: 10 },
  modalMessage: { fontSize: 16, color: "#58657B", marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  modalButton: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 9, marginLeft: 12 },
  cancelButton: { backgroundColor: "#E9EEF5" },
  logoutButton: { backgroundColor: "#D94848" },
  cancelButtonText: { color: "#34415D", fontWeight: "600" },
  logoutButtonText: { color: "#FFFFFF", fontWeight: "600" },
});
