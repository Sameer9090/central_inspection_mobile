import { Feather, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react-native";
import {
  Alert,
  Animated,
  Dimensions,
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

import AppHeader from "../components/AppHeader"; // ✅ ADDED
import { API } from "../services/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;

const Icons = {
  Bell: () => <Feather name="bell" size={22} color="#fff" />,
  LogOut: () => <Feather name="log-out" size={22} color="#fff" />,
  FileText: () => (
    <Feather name="file-text" size={22} color="rgba(255,255,255,0.8)" />
  ),
  Send: () => <Feather name="send" size={22} color="rgba(255,255,255,0.8)" />,
  CheckCircle: () => (
    <Feather name="check-circle" size={22} color="rgba(255,255,255,0.8)" />
  ),
  AlertTriangle: () => (
    <Feather name="alert-triangle" size={22} color="rgba(255,255,255,0.8)" />
  ),
  MapPin: () => (
    <Feather name="map-pin" size={22} color="rgba(255,255,255,0.8)" />
  ),
  BarChart3: () => (
    <Feather name="bar-chart-2" size={22} color="rgba(255,255,255,0.8)" />
  ),
  RotateCcw: () => (
    <Feather name="rotate-ccw" size={22} color="rgba(255,255,255,0.8)" />
  ),
  ChevronRight: () => (
    <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
  ),
  User: () => <Feather name="user" size={14} color="#8ab4d9" />,
  Building2: () => <FontAwesome5 name="building" size={14} color="#8ab4d9" />,
  Clock: () => <Feather name="clock" size={14} color="#8ab4d9" />,
  Calendar: () => <Feather name="calendar" size={14} color="#8ab4d9" />,
  Shield: () => (
    <Feather name="shield" size={22} color="rgba(255,255,255,0.8)" />
  ),
  Undo2: () => (
    <Feather name="corner-up-left" size={22} color="rgba(255,255,255,0.8)" />
  ),
  RefreshCw: () => (
    <Feather name="refresh-cw" size={22} color="rgba(255,255,255,0.8)" />
  ),
};

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    applications_in_queue: 0,
    applications_forwarded: 0,
    inspections_completed: 0,
    prosecution_initiated: 0,
    compliance_data: 0,
    prosecution_request_count: 0,
    inspection_close_request_count: 0,
    pull_back_count: 0,
    re_initiate_inspection_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

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
      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await API.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const data = response.data.data;
        setUser(data.user);
        setStats({
          applications_in_queue: data.applications_in_queue || 0,
          applications_forwarded: data.applications_forwarded || 0,
          inspections_completed: data.inspections_completed || 0,
          prosecution_initiated: data.prosecution_initiated || 0,
          compliance_data: data.compliance_data || 0,
          prosecution_request_count: data.prosecution_request_count || 0,
          inspection_close_request_count: data.inspection_close_request_count || 0,
          pull_back_count: data.pull_back_count || 0,
          re_initiate_inspection_count: data.re_initiate_inspection_count || 0,
        });
      }
    } catch (error: any) {
      console.log("API Error:", error?.response?.status, error?.response?.data);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || "Failed to load dashboard data";
      if (status === 404) {
        Alert.alert("API Error", "Dashboard endpoint not found. Check your API URL.");
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

  const getStatCards = () => {
    const allCards = [
      { title: "APPLICATIONS IN QUEUE", value: stats.applications_in_queue, icon: Icons.FileText, color: "#4A90D9", route: "/applications" },
      { title: "APPLICATIONS FORWARDED", value: stats.applications_forwarded, icon: Icons.Send, color: "#7B68EE", route: "/applications/forwarded" },
      {
        title: "TRACK APPLICATIONS",
        value: "",
        subtitle: "Search • Track • History",
        icon: Icons.MapPin,
        color: "#2563EB",
        route: "/track",
      },

    ];
    return allCards.filter((card) => {
      if (card.route === "/track") {
        return true;
      }

      return card.value > 0;
    });

  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["left", "right", "bottom"]}>
        {/* ✅ ADDED: AppHeader in loading state */}
        <AppHeader />
        <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const statCards = getStatCards();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* ✅ ADDED: AppHeader replaces inline header */}
      <AppHeader />
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />

      {/* ✅ REMOVED: Old inline header (<View style={styles.header}>...) */}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a4e" />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeTitle}>
                Welcome, {user?.firstname} {user?.lastname}
              </Text>
              <View style={styles.roleRow}>
                <Icons.User />
                <Text style={styles.roleText}>Role: {user?.role_name || "Unknown"}</Text>
              </View>
              <View style={styles.roleRow}>
                <Icons.Building2 />
                <Text style={styles.roleText}>Office: {user?.office_name || "Unknown"}</Text>
              </View>
            </View>
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <Icons.Clock />
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              </View>
              <View style={styles.timeRow}>
                <Icons.Calendar />
                <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
              </View>
            </View>
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>DASHBOARD OVERVIEW</Text>
          </View>

          {/* Stats Grid */}
          {statCards.length > 0 ? (
            <View style={styles.statsGrid}>
              {statCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.statCard, { backgroundColor: card.color }]}
                  onPress={() => router.push(card.route)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
                    <card.icon />
                  </View>
                  {card.value ? (
                    <Text style={styles.cardValue}>{card.value}</Text>
                  ) : (
                    <View style={{ height: 36 }} />
                  )}
                  <View style={styles.cardDivider} />
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardLink}>View Details</Text>
                    <Icons.ChevronRight />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No Active Items</Text>
              <Text style={styles.emptySubtitle}>All caught up! Nothing pending.</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026. Website all rights, reserved & belongs to Labour Welfare Department, Govt. of Assam, India.
            </Text>
            <Text style={styles.footerSubText}>
              Designed & Developed by: National Informatics Centre, Assam
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

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
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.logoutButton]} onPress={logout}>
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
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#1a1a4e",
    fontSize: 16,
    fontWeight: "600",
  },
  // ✅ REMOVED: header styles (now in AppHeader component)
  // header, headerTop, headerLeft, govBadge, etc. all removed

  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a4e",
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  timeSection: {
    alignItems: "flex-end",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#1a1a4e",
    fontWeight: "700",
  },
  dateText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    width: 4,
    height: 18,
    backgroundColor: "#1a1a4e",
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 0,
  },
  statCard: {
    width: CARD_WIDTH,
    margin: 4,
    padding: 16,
    borderRadius: 16,
    minHeight: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    flex: 1,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  cardValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLink: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#999",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 6,
  },
  footer: {
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
  footerSubText: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a4e",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  logoutButton: {
    backgroundColor: "#E74C3C",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});