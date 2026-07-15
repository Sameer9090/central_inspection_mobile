import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import * as Notifications from "expo-notifications";

import { getUnreadNotificationCount } from "../services/notificationService";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => { },
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);

  const responseListener =
    useRef<Notifications.EventSubscription | null>(null);

  const refreshUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (e) {
      console.log("Unread Count Error:", e);
    }
  };

  useEffect(() => {
    refreshUnreadCount();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          refreshUnreadCount();
        }
      }
    );

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // every 30 seconds

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        refreshUnreadCount();
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        refreshUnreadCount();
      });

    return () => {
      appStateSubscription.remove();
      clearInterval(interval);
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);