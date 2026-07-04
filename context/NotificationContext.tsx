import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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

  const refreshUnreadCount = async () => {

    try {

      const count = await getUnreadNotificationCount();

      setUnreadCount(count);

    } catch (e) {

      console.log(e);

    }

  };

  useEffect(() => {

    refreshUnreadCount();

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

export const useNotification = () =>
  useContext(NotificationContext);