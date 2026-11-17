import { Feather, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import { API } from "../services/api";


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
  const { width: windowWidth } = useWindowDimensions();
  const cardGap = windowWidth < 360 ? 10 : 12;
  const cardWidth = (windowWidth - 32 - cardGap) / 2;
  const compactLayout = windowWidth < 380;
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
      console.log("token ",token)
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

  const getStatCards = (): StatCard[] => {
    const allCards: StatCard[] = [
      { title: "APPLICATIONS IN QUEUE", value: stats.applications_in_queue, icon: Icons.FileText, color: "#203F82", route: "/applications" },
      { title: "APPLICATIONS FORWARDED", value: stats.applications_forwarded, icon: Icons.Send, color: "#397CC8", route: "/applications/forwarded" },
      {
        title: "TRACK APPLICATIONS",
        value: "",
        subtitle: "Search • Track • History",
        icon: Icons.MapPin,
        color: "#078C88",
        route: "/track",
      },
    ];

    return allCards.filter((card) => {
      if (card.route === "/track") {
        return true;
      }
      // ✅ FIXED: Type-safe comparison
      return typeof card.value === 'number' && card.value > 0;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const statCards = getStatCards();

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
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <ImageBackground
              source={require("../assets/images/assam_tea_rhino_banner.jpg")}
              style={styles.welcomeBanner}
              imageStyle={styles.welcomeBannerImage}
              resizeMode="cover"
            >
              <View style={styles.welcomeBannerText}>
                <Text
                  style={[styles.welcomeTitle, compactLayout && styles.welcomeTitleCompact]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Welcome,
                </Text>
                <Text
                  style={[styles.welcomeName, compactLayout && styles.welcomeNameCompact]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                  ellipsizeMode="tail"
                >
                  {[user?.firstname, user?.lastname].filter(Boolean).join(" ") || "Inspector"}
                </Text>
              </View>
            </ImageBackground>

            <View style={styles.officerInfoRow}>
              <View style={styles.officerInfoItem}>
                <View style={styles.infoIconBox}><Icons.User /></View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>{user?.role_name || "Unknown"}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.officerInfoItem}>
                <View style={styles.infoIconBox}><Icons.Building2 /></View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Office</Text>
                  <Text style={styles.infoValue}>{user?.office_name || "Unknown"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.dateTimeBar}>
              <View style={styles.dateTimeItem}>
                <Icons.Calendar />
                <Text style={styles.dateTimeText} numberOfLines={2}>
                  {formatDate(currentTime)}
                </Text>
              </View>
              <View style={styles.dateTimeDivider} />
              <View style={styles.dateTimeItem}>
                <Icons.Clock />
                <Text style={styles.dateTimeValue}>{formatTime(currentTime)}</Text>
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
                  style={[styles.statCard, { backgroundColor: card.color, width: cardWidth }]}
                 onPress={() => router.push(card.route as any)}  // ✅ FIXED: Cast to Href<string>
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>

                    <View style={styles.cardIconBox}><card.icon /></View>

                    <Text

                      style={styles.cardTitle}

                      numberOfLines={3}

                      adjustsFontSizeToFit

                      minimumFontScale={0.85}

                    >

                      {card.title}

                    </Text>

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
    backgroundColor: "#F3F6FA",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#202653",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeBanner: {
    height: 150,
    width: "100%",
    justifyContent: "center",
    backgroundColor: "#EAF2F8",
  },
  welcomeBannerImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  welcomeBannerText: {
    width: "52%",
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderTopRightRadius: 42,
    borderBottomRightRadius: 42,
  },
  welcomeTitle: {
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "700",
    color: "#202653",
    includeFontPadding: false,
    marginBottom: 3,
    flexShrink: 1,
  },
  welcomeTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  welcomeName: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "800",
    color: "#202653",
    includeFontPadding: false,
    flexShrink: 1,
    maxWidth: "100%",
  },
  welcomeNameCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  officerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  officerInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 9,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF3FC",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: "#778196",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    lineHeight: 18,
    color: "#202653",
    fontWeight: "700",
    flexShrink: 1,
  },
  infoDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#D8E1EE",
  },
  dateTimeBar: {
    marginHorizontal: 14,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: "#EEF5FC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  dateTimeText: {
    flex: 1,
    color: "#334155",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  dateTimeValue: {
    color: "#202653",
    fontSize: 14,
    fontWeight: "800",
  },
  dateTimeDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#B8CBE0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 14,
    gap: 10,
  },
  sectionIcon: {
    width: 5,
    height: 22,
    backgroundColor: "#202653",
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#344054",
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    rowGap: 12,
  },
  statCard: {
    minHeight: 170,
    padding: 14,
    borderRadius: 18,
    justifyContent: "space-between",
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 9,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    minHeight: 0,
    width: "100%",
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "rgba(255,255,255,0.97)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.15,
    width: "100%",
    lineHeight: 15,
    textTransform: "uppercase",
    paddingTop: 0,
    flexShrink: 1,
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    marginTop: 5,
    marginBottom: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginBottom: 9,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 20,
  },
  cardLink: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 12,
    fontWeight: "700",
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
    marginTop: 30,
    marginBottom: 24,
    paddingHorizontal: 26,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#7B8494",
    textAlign: "center",
    lineHeight: 18,
  },
  footerSubText: {
    fontSize: 11,
    color: "#9AA3B2",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 6,
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