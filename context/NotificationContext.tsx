import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import * as Notifications from "expo-notifications";

import { getUnreadNotificationCount } from "../services/notificationService";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
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
    // Initial load
    refreshUnreadCount();

    // App is open and notification arrives
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        console.log("Notification received");
        refreshUnreadCount();
      });

    // User taps notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        console.log("Notification opened");
        refreshUnreadCount();
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }

      if (responseListener.current) {
        responseListener.current.remove();
      }
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