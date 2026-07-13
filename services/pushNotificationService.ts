import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { API } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Must use a physical device");
    return null;
  }

  let { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    status = permission.status;
  }

  if (status !== "granted") {
    console.log("Notification permission denied");
    return null;
  }

  const projectId =
    "09e00c1f-3380-4450-899b-9e8b47a8ebc0";

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  console.log("Expo Push Token:", token);

  const authToken = await AsyncStorage.getItem("token");

  if (authToken) {
    await API.post(
      "/device-token",
      {
        expo_token: token,
        platform: Platform.OS,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
  }

  return token;
}