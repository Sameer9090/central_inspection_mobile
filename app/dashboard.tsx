import { Feather, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  RefreshControl,
  Modal as RNModal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import { API } from "../services/api";
import { getOfflineUser } from "../services/offlineAuth";
import {
  getDashboardCache,
  saveDashboardCache,
} from "../services/offlineStorage";
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
    <Feather name="chevron-right" size={16} color="#94A3B8" />
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

// ✅ ADDED: Proper interface for stat cards
interface StatCard {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: () => React.ReactNode;
  color: string;
  route: string;
}

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
    unsuccessful_inspection_visits: 0,
  });
  const [submittedInspectionsCount, setSubmittedInspectionsCount] = useState(0);
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

  // useEffect(() => {
  //   loadDashboard();
  // }, []);

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
      const offlineMode = await AsyncStorage.getItem("offline_mode");

      // ==========================================
      // OFFLINE DASHBOARD
      // ==========================================
      if (offlineMode === "true") {
        const offlineUser = await getOfflineUser();
        const cachedData = await getDashboardCache();

        if (!offlineUser) {
          Alert.alert(
            "Offline Session Error",
            "Your saved user profile is unavailable. Please log in online again."
          );
          router.replace("/login");
          return;
        }

        setUser(offlineUser);

        if (cachedData) {
          setStats({
            applications_in_queue: cachedData.applications_in_queue || 0,
            applications_forwarded: cachedData.applications_forwarded || 0,
            inspections_completed: cachedData.inspections_completed || 0,
            prosecution_initiated: cachedData.prosecution_initiated || 0,
            compliance_data: cachedData.compliance_data || 0,
            prosecution_request_count: cachedData.prosecution_request_count || 0,
            inspection_close_request_count:
              cachedData.inspection_close_request_count || 0,
            pull_back_count: cachedData.pull_back_count || 0,
            re_initiate_inspection_count:
              cachedData.re_initiate_inspection_count || 0,
            unsuccessful_inspection_visits:
              cachedData.unsuccessful_inspection_visits || 0,
          });
        }

        const cachedCount = await AsyncStorage.getItem(
          "submittedInspectionsCount"
        );

        if (cachedCount !== null) {
          setSubmittedInspectionsCount(Number(cachedCount));
        }

        return;
      }

      // ==========================================
      // NORMAL ONLINE DASHBOARD
      // ==========================================
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await API.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch successfully submitted inspections
      try {
        const submittedResponse = await API.get("/submitted-inspections", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (submittedResponse.data.success) {
          const paginator = submittedResponse.data.data;
          const count = paginator?.total ?? paginator?.data?.length ?? 0;

          setSubmittedInspectionsCount(count);

          await AsyncStorage.setItem(
            "submittedInspectionsCount",
            String(count)
          );
        }
      } catch (submittedError: any) {
        console.log(
          "Submitted inspections count error:",
          submittedError?.response?.status,
          submittedError?.message
        );

        const cachedCount = await AsyncStorage.getItem(
          "submittedInspectionsCount"
        );

        if (cachedCount !== null) {
          setSubmittedInspectionsCount(Number(cachedCount));
        }
      }

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
          inspection_close_request_count:
            data.inspection_close_request_count || 0,
          pull_back_count: data.pull_back_count || 0,
          re_initiate_inspection_count:
            data.re_initiate_inspection_count || 0,
          unsuccessful_inspection_visits:
            data.unsuccessful_inspection_visits || 0,
        });

        await saveDashboardCache(data);
      }
    } catch (error: any) {
      console.log(
        "Dashboard API Error:",
        error?.response?.status,
        error?.message
      );

      try {
        const cachedData = await getDashboardCache();

        if (cachedData) {
          setUser(cachedData.user);

          setStats({
            applications_in_queue: cachedData.applications_in_queue || 0,
            applications_forwarded: cachedData.applications_forwarded || 0,
            inspections_completed: cachedData.inspections_completed || 0,
            prosecution_initiated: cachedData.prosecution_initiated || 0,
            compliance_data: cachedData.compliance_data || 0,
            prosecution_request_count: cachedData.prosecution_request_count || 0,
            inspection_close_request_count:
              cachedData.inspection_close_request_count || 0,
            pull_back_count: cachedData.pull_back_count || 0,
            re_initiate_inspection_count:
              cachedData.re_initiate_inspection_count || 0,
            unsuccessful_inspection_visits:
              cachedData.unsuccessful_inspection_visits || 0,
          });
        } else {
          Alert.alert(
            "Offline Mode",
            "No saved dashboard data is available. Please connect to the internet and try again."
          );
        }
      } catch (cacheError) {
        console.log("Dashboard cache read error:", cacheError);

        Alert.alert(
          "Offline Mode",
          "Unable to load saved dashboard data."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );
  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };


  const logout = async () => {
    try {
      setLogoutModalVisible(false);

      const token = await AsyncStorage.getItem("token");

      // Attempt server logout if the server is reachable.
      if (token) {
        try {
          await API.post(
            "/logout",
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (apiError) {
          console.log("Server logout unavailable. Clearing local session.");
        }
      }
    } finally {
      // Always clear local authentication.
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "offline_mode",
      ]);
      router.replace("/login");
    }
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const getStatCards = (): StatCard[] => {
    const allCards: StatCard[] = [
      { title: "APPLICATIONS ALLOTED", value: stats.applications_in_queue, icon: Icons.FileText, color: "#4A90D9", route: "/applications" },
      { title: "SUCCESSFULLY SUBMITTED INSPECTIONS", value: submittedInspectionsCount, icon: Icons.CheckCircle, color: "#15803D", route: "/submitted-inspections", },
      { title: "APPLICATIONS FORWARDED", value: stats.applications_forwarded, icon: Icons.Send, color: "#7B68EE", route: "/applications/forwarded" },
      { title: "UNSUCCESSFUL INSPECTION VISITS", value: stats.unsuccessful_inspection_visits, icon: Icons.AlertTriangle, color: "#D97706", route: "/unsuccessful-inspection-visits", },
      { title: "TRACK APPLICATIONS", value: "", subtitle: "Search • Track • History", icon: Icons.MapPin, color: "#2563EB", route: "/track", },
    ];

    return allCards.filter((card) => {
      if (
        card.route === "/track" ||
        card.route === "/unsuccessful-inspection-visits" ||
        card.route === "/submitted-inspections"
      ) {
        return true;
      }

      return typeof card.value === "number" && card.value > 0;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#1E2F5B" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const statCards = getStatCards();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <AppHeader />
      {/* <Pressable
        onPress={() => router.push("/offline-diagnostics")}
        style={{
          backgroundColor: "#3157A4",
          padding: 13,
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          Offline Diagnostics
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/debug-logs")}
        style={{
          backgroundColor: "#287A62",
          padding: 13,
          borderRadius: 12,
          marginHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          Export Debug Logs
        </Text>
      </Pressable> */}
      <StatusBar barStyle="light-content" backgroundColor="#1E2F5B" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a4e" />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Welcome Section */}
          {/* Responsive Welcome Section */}
          <View style={styles.welcomeSection}>

            {/* Top section */}
            <View style={styles.welcomeHeader}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeLabel}>OFFICER DASHBOARD</Text>

                <Text style={styles.welcomeGreeting}>
                  Welcome back!
                </Text>

                <Text
                  style={styles.welcomeName}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {user?.firstname} {user?.lastname}
                </Text>

                <Text style={styles.welcomeRole}>
                  {user?.role_name || "Unknown"}
                </Text>
              </View>

              <View style={styles.profileIcon}>
                <Feather name="user" size={25} color="#FFFFFF" />
              </View>
            </View>

            {/* Information section */}
            <View style={styles.welcomeInfo}>

              {/* Office */}
              <View style={styles.infoItem}>
                <View style={styles.infoLabelRow}>
                  <Icons.Building2 />
                  <Text style={styles.infoLabel}>OFFICE</Text>
                </View>

                <Text style={styles.infoValue}>
                  {user?.office_name || "Unknown"}
                </Text>
              </View>

              {/* Date and Time */}
              <View style={styles.dateTimeRow}>

                <View style={styles.infoItem}>
                  <View style={styles.infoLabelRow}>
                    <Icons.Calendar />
                    <Text style={styles.infoLabel}>DATE</Text>
                  </View>

                  <Text style={styles.infoValue}>
                    {formatDate(currentTime)}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoLabelRow}>
                    <Icons.Clock />
                    <Text style={styles.infoLabel}>CURRENT TIME</Text>
                  </View>

                  <Text style={styles.infoValue}>
                    {formatTime(currentTime)}
                  </Text>
                </View>

              </View>
            </View>

          </View>

          {/* Panoramic Assam banner: decorative background behind the section heading only. */}
          <ImageBackground
            source={require("../assets/images/assam-dashboard-bg.png")}
            style={styles.assamBanner}
            imageStyle={styles.assamBackground}
            resizeMode="stretch"
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>DASHBOARD OVERVIEW</Text>
            </View>
          </ImageBackground>

          {/* Keep dashboard cards on a clean, unobstructed surface. */}
          {statCards.length > 0 ? (
            <View style={styles.statsGrid}>
              {statCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.statCard, { borderLeftColor: card.color }]}
                  onPress={() => router.push(card.route as any)}
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
                      {card.value !== "" ? (
                        <Text style={styles.cardValue}>{card.value}</Text>
                      ) : (
                        <Text style={styles.cardSubtitle}>
                          {card.subtitle || "Search • Track • History"}
                        </Text>
                      )}
                    </View>
                    <View style={styles.cardArrow}>
                      <Icons.ChevronRight />
                    </View>
                  </View>

                  <View style={styles.cardFooterSection}>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardLink}>View Details</Text>
                    </View>
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
              © 2026. App all rights, reserved & belongs to Labour Welfare Department, Govt. of Assam, India.
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
    backgroundColor: "#F3F6FB",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#1E2A4A",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E2A4A",
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
    color: "#1E2A4A",
    fontWeight: "700",
  },
  dateText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  assamBanner: {
    width: "100%",
    aspectRatio: 3.2,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 8,
  },
  assamBackground: {
    opacity: 0.48,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginTop: 0,
    marginBottom: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 5,
    height: 21,
    backgroundColor: "#3157A4",
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#34415D",
    letterSpacing: 1.1,
  },
  statsGrid: {
    flexDirection: "column",
    paddingHorizontal: 14,
    gap: 12,
  },
  cardTitle: {
    color: "#34415D",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.35,
    flexShrink: 1,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  cardLink: {
    color: "#52627D",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 6,
  },
  footer: {
    marginTop: 28,
    marginBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#8490A5",
    textAlign: "center",
    lineHeight: 18,
  },
  footerSubText: {
    fontSize: 11,
    color: "#A0AABC",
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E2A4A",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#58657B",
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
    borderRadius: 9,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#E9EEF5",
  },
  logoutButton: {
    backgroundColor: "#D94848",
  },
  cancelButtonText: {
    color: "#34415D",
    fontWeight: "600",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  welcomeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#263B65",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E7ECF4",
  },
  welcomeHeader: {
    backgroundColor: "#1E2F5B",
    paddingHorizontal: 20,
    paddingVertical: 21,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  welcomeLabel: {
    color: "#B9C9EE",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  welcomeGreeting: {
    color: "#E5ECFA",
    fontSize: 16,
    fontWeight: "600",
  },
  welcomeName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 7,
    flexShrink: 1,
  },
  welcomeRole: {
    color: "#C5D2EA",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeInfo: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 17,
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 0,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },
  infoLabel: {
    color: "#7B879B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  infoValue: {
    color: "#293957",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    flexShrink: 1,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#E9EEF5",
    paddingTop: 14,
  },
  statCard: {
    width: "100%",
    minHeight: 112,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 16,
    borderLeftWidth: 4,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    shadowColor: "#23395D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#E9EEF5",
    borderRightColor: "#E9EEF5",
    borderBottomColor: "#E9EEF5",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardIconAccent: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 3,
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  cardValue: {
    color: "#1E2F50",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  cardArrow: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardFooterSection: {
    marginTop: 10,
    marginLeft: 58,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#E9EEF5",
    marginBottom: 7,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 18,
  },
});
