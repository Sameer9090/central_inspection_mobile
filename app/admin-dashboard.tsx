import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Href, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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

import AppHeader from "../components/AppHeader";
import { API } from "../services/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;

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
          {/* Admin Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeLeft}>
              <View style={styles.adminBadge}>
                <Icons.Shield />
                <Text style={styles.adminBadgeText}>ADMINISTRATOR</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                Welcome, {user?.firstname} {user?.lastname}
              </Text>
              <View style={styles.roleRow}>
                <Icons.User />
                <Text style={styles.roleText}>Role: {user?.role_name || "Administrator"}</Text>
              </View>
              <View style={styles.roleRow}>
                <Text style={styles.roleText}>System Management Console</Text>
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
            <Text style={styles.sectionTitle}>ADMIN OVERVIEW</Text>
          </View>

          {/* Admin Stats Grid */}
          {adminCards.length > 0 ? (
            <View style={styles.statsGrid}>
              {adminCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.statCard, { backgroundColor: card.color }]}
                  onPress={() => router.push(card.route as Href)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
                    <card.icon />
                  </View>
                  <Text style={styles.cardValue}>{card.value}</Text>
                  <View style={styles.cardDivider} />
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardLink}>Manage</Text>
                    <Icons.ChevronRight />
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
              style={[styles.actionCard, { backgroundColor: "#4A90D9" }]}
              onPress={() => router.push("/admin/users" as Href)}
              activeOpacity={0.9}
            >
              <Icons.Users />
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: "#27AE60" }]}
              onPress={() => router.push("/admin/reports" as Href)}
              activeOpacity={0.9}
            >
              <Icons.BarChart />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: "#E74C3C" }]}
              onPress={() => setLogoutModalVisible(true)}
              activeOpacity={0.9}
            >
              <Icons.LogOut />
              <Text style={styles.actionText}>Logout</Text>
            </TouchableOpacity>
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
    marginTop: 12,
  },
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
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E74C3C",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
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
    backgroundColor: "#E74C3C",
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
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  actionCard: {
    width: CARD_WIDTH,
    margin: 4,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
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