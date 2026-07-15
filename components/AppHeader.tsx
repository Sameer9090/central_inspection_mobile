// components/AppHeader.tsx

import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNotification } from "../context/NotificationContext";
import { API } from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MENU_ITEMS = [
  { icon: "home" as const, label: "Dashboard", route: "/dashboard", replace: true },
  { icon: "file-text" as const, label: "Track Application", route: "/track", replace: false },
  { icon: "bell" as const, label: "Notifications", route: "/notifications", replace: false },
];

export default function AppHeader() {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const { unreadCount, refreshUnreadCount } = useNotification();

  // Animation refs
  const menuAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openMenu = useCallback(() => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuAnim, fadeAnim]);

  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(menuAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  }, [menuAnim, fadeAnim]);

  const handleNavigation = useCallback(
    (route: string, replace: boolean) => {
      closeMenu();
      setTimeout(() => {
        if (replace) {
          router.replace(route);
        } else {
          router.push(route);
        }
      }, 200);
    },
    [closeMenu]
  );

  const logout = useCallback(async () => {
    try {
      setLogoutModalVisible(false);
      const token = await AsyncStorage.getItem("token");

      if (token) {
        await API.post(
          "/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      await AsyncStorage.multiRemove(["token", "user"]);
      await refreshUnreadCount();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [refreshUnreadCount]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Left Section */}
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={openMenu}
                activeOpacity={0.7}
                accessibilityLabel="Open menu"
                accessibilityRole="button"
              >
                <Feather name="menu" size={22} color="#fff" />
              </TouchableOpacity>

              <View style={styles.govBadge}>
                <Image
                  source={require("../assets/images/assam-government-emblem.png")}
                  style={styles.govLogo}
                  resizeMode="contain"
                  accessibilityLabel="Government of Assam emblem"
                />
              </View>

              <View style={styles.titleContainer}>
                <Text style={styles.deptTitle} numberOfLines={1}>
                  GOVERNMENT OF ASSAM
                </Text>
                <Text style={styles.deptSubtitle} numberOfLines={1}>
                  LABOUR WELFARE DEPARTMENT
                </Text>
              </View>
            </View>

            {/* Right Section */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/notifications")}
                activeOpacity={0.7}
                accessibilityLabel={`Notifications${
                  unreadCount > 0 ? `, ${unreadCount} unread` : ""
                }`}
                accessibilityRole="button"
              >
                <Feather name="bell" size={22} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setLogoutModalVisible(true)}
                activeOpacity={0.7}
                accessibilityLabel="Logout"
                accessibilityRole="button"
              >
                <Feather name="log-out" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Logout Modal */}
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Feather name="log-out" size={32} color="#E74C3C" />
            </View>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>No, Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={logout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutButtonText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Animated Side Menu */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
          accessible={false}
        >
          <Animated.View
            style={[
              styles.menuOverlayBackground,
              { opacity: fadeAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.menuContainer,
              { transform: [{ translateX: menuAnim }] },
            ]}
          >
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuGovBadge}>
                <Image
                  source={require("../assets/images/assam-government-emblem.png")}
                  style={styles.menuGovLogo}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.menuDeptTitle}>GOVERNMENT OF ASSAM</Text>
                <Text style={styles.menuDeptSubtitle}>
                  Labour Welfare Department
                </Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* Menu Items */}
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.route}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route, item.replace)}
                activeOpacity={0.7}
                accessibilityLabel={item.label}
                accessibilityRole="menuitem"
              >
                <View style={styles.menuIconContainer}>
                  <Feather name={item.icon} size={20} color="#1a1a4e" />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color="#ccc"
                  style={styles.menuChevron}
                />
              </TouchableOpacity>
            ))}

            <View style={styles.menuDivider} />

            {/* Logout Menu Item */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuLogoutItem]}
              onPress={() => {
                closeMenu();
                setTimeout(() => setLogoutModalVisible(true), 250);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Logout"
              accessibilityRole="menuitem"
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "rgba(231, 76, 60, 0.1)" },
                ]}
              >
                <Feather name="log-out" size={20} color="#E74C3C" />
              </View>
              <Text style={[styles.menuText, styles.menuLogoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#1a1a4e",
  },

  header: {
    backgroundColor: "#1a1a4e",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0, // Fix for nested flex
  },

  titleContainer: {
    flex: 1,
    minWidth: 0, // Allows text truncation
  },

  govBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  govLogo: {
    width: 30,
    height: 30,
  },

  deptTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  deptSubtitle: {
    color: "#8ab4d9",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#1a1a4e",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a4e",
    marginBottom: 8,
  },

  modalMessage: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
    textAlign: "center",
  },

  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#F3F4F6",
  },

  logoutButton: {
    backgroundColor: "#E74C3C",
    shadowColor: "#E74C3C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },

  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  // Menu Styles
  menuOverlay: {
    flex: 1,
    flexDirection: "row",
  },

  menuOverlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  menuContainer: {
    width: 280,
    maxWidth: SCREEN_WIDTH * 0.8,
    backgroundColor: "#fff",
    height: "100%",
    paddingTop: 50,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  menuGovBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a4e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuGovLogo: {
    width: 32,
    height: 32,
    tintColor: "#fff",
  },

  menuDeptTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a4e",
    letterSpacing: 0.3,
  },

  menuDeptSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    marginVertical: 4,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 10,
  },

  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(26, 26, 78, 0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  menuText: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },

  menuChevron: {
    marginLeft: 8,
  },

  menuLogoutItem: {
    marginTop: 4,
  },

  menuLogoutText: {
    color: "#E74C3C",
    fontWeight: "600",
  },
});