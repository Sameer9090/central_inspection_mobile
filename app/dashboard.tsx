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
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedSubmissionLocation, setSelectedSubmissionLocation] = useState<string | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
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

  const loadDashboard = useCallback(async (submissionLocation?: string | null) => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("token ",token)
      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await API.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        params: submissionLocation ? { submission_location: submissionLocation } : {},
      });

      if (response.data.success) {
        const data = response.data.data;
        setUser(data.user);
        setAnalytics(data.analytics || null);
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
    loadDashboard(selectedSubmissionLocation);
  };

  const handleSubmissionLocationSelect = (location: string) => {
    setSelectedSubmissionLocation(location);
    setLocationModalVisible(false);
    setRefreshing(true);
    loadDashboard(location);
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
                >
                  Welcome,
                </Text>
                <Text
                  style={[styles.welcomeName, compactLayout && styles.welcomeNameCompact]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  ellipsizeMode="tail"
                >
                  {[user?.firstname, user?.lastname].filter(Boolean).join(" ") || "Inspector"}
                </Text>
              </View>
            </ImageBackground>

            <View style={styles.officerInfoList}>
              <View style={styles.profileInfoRow}>
                <View style={styles.infoIconBox}><Icons.User /></View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>{user?.role_name || "Unknown"}</Text>
                </View>
              </View>

              <View style={styles.profileInfoRow}>
                <View style={styles.infoIconBox}><Icons.Building2 /></View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Office</Text>
                  <Text style={styles.infoValue}>{user?.office_name || "Unknown"}</Text>
                </View>
              </View>

              <View style={styles.profileInfoRow}>
                <View style={styles.infoIconBox}><Icons.Calendar /></View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(currentTime)}</Text>
                </View>
              </View>

              <View style={styles.profileInfoRow}>
                <View style={styles.infoIconBox}><Icons.Clock /></View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{formatTime(currentTime)}</Text>
                </View>
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

          {/* Inspection Analytics */}
          {analytics && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>INSPECTION ANALYTICS</Text>
              </View>

              {[2, 3, 4].includes(Number(user?.role_id)) && (
                <View style={[styles.analyticsPanel, { marginBottom: 0 }]}>
                  <Text style={styles.locationFieldLabel}>SUBMISSION LOCATION</Text>
                  <TouchableOpacity
                    style={styles.locationDropdown}
                    onPress={() => setLocationModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.locationDropdownText,
                        !selectedSubmissionLocation && styles.locationPlaceholder,
                      ]}
                      numberOfLines={2}
                    >
                      {selectedSubmissionLocation || "Select submission location"}
                    </Text>
                    <Feather name="chevron-down" size={19} color="#536078" />
                  </TouchableOpacity>
                  <Text style={styles.locationEmptyText}>
                    Select a submission location to view its monthly completion trend and officer performance.
                  </Text>
                </View>
              )}

              {/* <View style={styles.analyticsSummaryGrid}>
                {[
                  { label: "TOTAL INSPECTIONS", value: analytics.total_inspections ?? 0, color: "#203F82" },
                  { label: "COMPLETED", value: analytics.completed_inspections ?? 0, color: "#16845B" },
                  { label: "PENDING", value: analytics.pending_inspections ?? 0, color: "#397CC8" },
                  { label: "OVERDUE", value: analytics.overdue_inspections ?? 0, color: "#D9534F" },
                ].map((item) => (
                  <View key={item.label} style={[styles.analyticsSummaryCard, { borderLeftColor: item.color }]}>
                    <Text style={styles.analyticsSummaryLabel}>{item.label}</Text>
                    <Text style={[styles.analyticsSummaryValue, { color: item.color }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View> */}

              {Array.isArray(analytics.monthly_trends) && analytics.monthly_trends.length > 0 ? (
                <View style={styles.analyticsPanel}>
                  <Text style={styles.analyticsPanelTitle}>MONTHLY COMPLETION TREND</Text>
                  <Text style={styles.analyticsPanelSubtitle}>Number of inspections closed each month</Text>
                  {(() => {
                    const maxCompleted = Math.max(
                      1,
                      ...analytics.monthly_trends.map((item: any) => Number(item.completed) || 0)
                    );
                    return analytics.monthly_trends.map((item: any) => {
                      const completed = Number(item.completed) || 0;
                      const monthLabel = String(item.month || "").split("-").reverse().join("/");
                      return (
                        <View key={item.month} style={styles.trendRow}>
                          <Text style={styles.trendMonth}>{monthLabel}</Text>
                          <View style={styles.trendTrack}>
                            <View
                              style={[
                                styles.trendBar,
                                { width: `${(completed / maxCompleted) * 100}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.trendValue}>{completed}</Text>
                        </View>
                      );
                    });
                  })()}
                </View>
              ) : (
                [2, 3, 4].includes(Number(user?.role_id)) && !selectedSubmissionLocation ? null : (
                  <View style={styles.analyticsPanel}>
                    <Text style={styles.locationEmptyText}>
                      No monthly completion records found for this submission location.
                    </Text>
                  </View>
                )
              )}

              {[2, 3, 4, 5].includes(Number(user?.role_id)) && (
                <View style={styles.analyticsPanel}>
                  <Text style={styles.analyticsPanelTitle}>INDIVIDUAL OFFICER PERFORMANCE</Text>
                  <Text style={styles.analyticsPanelSubtitle}>
                    Inspection performance of Labour Officers and Labour Inspectors under your jurisdiction
                  </Text>

                  {Array.isArray(analytics.individual_officer_performance) &&
                  analytics.individual_officer_performance.length > 0 ? (
                    analytics.individual_officer_performance.map((officer: any) => (
                      <View key={officer.officer_id} style={styles.officePerformanceItem}>
                        <Text style={styles.officePerformanceName}>
                          {officer.officer_name || "Officer"}
                        </Text>
                        <Text style={{ color: "#8993A4", fontSize: 11, marginBottom: 12 }}>
                          {officer.designation || "Inspection Officer"}
                        </Text>
                        <View style={styles.officeStatsRow}>
                          <View style={styles.officeStat}>
                            <Text style={styles.officeStatValue}>{officer.total_inspections ?? 0}</Text>
                            <Text style={styles.officeStatLabel}>Total</Text>
                          </View>
                          <View style={styles.officeStat}>
                            <Text style={[styles.officeStatValue, { color: "#16845B" }]}>
                              {officer.completed_inspections ?? 0}
                            </Text>
                            <Text style={styles.officeStatLabel}>Completed</Text>
                          </View>
                          <View style={styles.officeStat}>
                            <Text style={[styles.officeStatValue, { color: "#D28A21" }]}>
                              {officer.pending_inspections ?? 0}
                            </Text>
                            <Text style={styles.officeStatLabel}>Pending</Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.locationEmptyText}>
                      {[2, 3, 4].includes(Number(user?.role_id))
                        ? selectedSubmissionLocation
                          ? "No officer performance records found for this submission location."
                          : "Select a submission location to view officer performance."
                        : "No officer performance records found in your zone."}
                    </Text>
                  )}
                </View>
              )}
            </>
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
        visible={locationModalVisible}
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModalContainer}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.modalTitle}>Select Submission Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Feather name="x" size={22} color="#536078" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.locationOptionsList} nestedScrollEnabled>
              {(analytics?.submission_locations || []).map((location: string) => (
                <TouchableOpacity
                  key={location}
                  style={styles.locationOption}
                  onPress={() => handleSubmissionLocationSelect(location)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.locationOptionText}>{location}</Text>
                  {selectedSubmissionLocation === location && (
                    <Feather name="check" size={18} color="#16845B" />
                  )}
                </TouchableOpacity>
              ))}
              {(!analytics?.submission_locations || analytics.submission_locations.length === 0) && (
                <Text style={styles.locationEmptyText}>No submission locations are available.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </RNModal>

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
    minHeight: 150,
    width: "100%",
    justifyContent: "flex-end",
    backgroundColor: "#EAF2F8",
  },
  welcomeBannerImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  welcomeBannerText: {
    width: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 17,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  welcomeTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
    color: "#202653",
    includeFontPadding: false,
    marginBottom: 2,
  },
  welcomeTitleCompact: {
    fontSize: 16,
    lineHeight: 19,
  },
  welcomeName: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
    color: "#202653",
    includeFontPadding: false,
    maxWidth: "100%",
  },
  welcomeNameCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  officerInfoList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 0,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 62,
    paddingVertical: 9,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0F5",
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF3FC",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 11,
    color: "#778196",
    fontWeight: "700",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: "#202653",
    fontWeight: "700",
    flexShrink: 1,
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
  analyticsSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    rowGap: 10,
  },
  analyticsSummaryCard: {
    width: "48.5%",
    minHeight: 92,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderLeftWidth: 4,
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: "space-between",
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  analyticsSummaryLabel: {
    color: "#778196",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.35,
  },
  analyticsSummaryValue: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
  },
  analyticsPanel: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  analyticsPanelTitle: {
    color: "#202653",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.45,
  },
  analyticsPanelSubtitle: {
    color: "#8993A4",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 15,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 9,
  },
  trendMonth: {
    width: 62,
    color: "#536078",
    fontSize: 11,
    fontWeight: "600",
  },
  trendTrack: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E8EEF6",
    overflow: "hidden",
  },
  trendBar: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#397CC8",
  },
  trendValue: {
    width: 25,
    textAlign: "right",
    color: "#202653",
    fontSize: 12,
    fontWeight: "800",
  },
  locationFieldLabel: {
    color: "#778196",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.45,
    marginBottom: 7,
  },
  locationDropdown: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D8E1EE",
    borderRadius: 10,
    backgroundColor: "#F8FAFD",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  locationDropdownText: {
    flex: 1,
    color: "#344054",
    fontSize: 13,
    fontWeight: "600",
  },
  locationPlaceholder: {
    color: "#8993A4",
    fontWeight: "500",
  },
  locationEmptyText: {
    color: "#8993A4",
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 12,
  },
  locationModalContainer: {
    width: "88%",
    maxHeight: "75%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
  },
  locationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  locationOptionsList: {
    maxHeight: 420,
  },
  locationOption: {
    minHeight: 48,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF0F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  locationOptionText: {
    flex: 1,
    color: "#344054",
    fontSize: 13,
    fontWeight: "600",
  },
  officePerformanceItem: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF0F5",
  },
  officePerformanceName: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 13,
  },
  officeStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  officeStat: {
    flex: 1,
    alignItems: "center",
  },
  officeStatValue: {
    color: "#203F82",
    fontSize: 21,
    fontWeight: "800",
  },
  officeStatLabel: {
    color: "#8993A4",
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
  },
});