// components/AppHeader.tsx

import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image, Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNotification } from "../context/NotificationContext";
import { API } from "../services/api";

export default function AppHeader() {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { unreadCount, refreshUnreadCount } = useNotification();

  const logout = async () => {
    try {
      setLogoutModalVisible(false);

      const token = await AsyncStorage.getItem("token");

      if (token) {
        await API.post(
          "/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      // Reset unread count
      await refreshUnreadCount();

      router.replace("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1a4e"
      />

      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: "#1a1a4e" }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.govBadge}>
                <Image
                  source={require("../assets/images/assam-government-emblem.png")}
                  style={styles.govLogo}
                  resizeMode="contain"
                />
              </View>

              <View>
                <Text style={styles.deptTitle}>
                  GOVERNMENT OF ASSAM
                </Text>
                <Text style={styles.deptSubtitle}>
                  LABOUR WELFARE DEPARTMENT
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/notifications")}
              >
                <Feather
                  name="bell"
                  size={22}
                  color="#fff"
                />

                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  setLogoutModalVisible(true)
                }
              >
                <Feather
                  name="log-out"
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() =>
          setLogoutModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Logout
            </Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
                onPress={() =>
                  setLogoutModalVisible(false)
                }
              >
                <Text style={styles.cancelButtonText}>
                  No
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.logoutButton,
                ]}
                onPress={logout}
              >
                <Text style={styles.logoutButtonText}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1a1a4e",
    paddingVertical: 10,
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
  },

  govBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  govLogo: {
    width: 32,
    height: 32,
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
    marginTop: 1,
    letterSpacing: 0.3,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
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