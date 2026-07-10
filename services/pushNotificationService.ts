import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  try {
    console.log("========== PUSH START ==========");

    if (!Device.isDevice) {
      console.log("Not a physical device");
      return null;
    }

    let { status } = await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      const permission = await Notifications.requestPermissionsAsync();
      status = permission.status;
    }

    if (status !== "granted") {
      console.log("Permission denied");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId;

    console.log("Project ID:", projectId);

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo Push Token:", token.data);

    return token.data;
  } catch (e) {
    console.log("Push Error:", e);
    return null;
  }
}