import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

export const getNotifications = async () => {

    const token = await AsyncStorage.getItem("token");

    const response = await API.get(
        "/notifications",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const markNotificationRead = async (
    id: string
) => {

    const token = await AsyncStorage.getItem("token");

    const response = await API.post(
        `/notifications/read/${id}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const markAllNotificationsRead = async () => {

    const token = await AsyncStorage.getItem("token");

    const response = await API.post(
        "/notifications/mark-all-read",
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const getUnreadNotificationCount = async () => {

    const token = await AsyncStorage.getItem("token");

    const response = await API.get(
        "/notifications/unread-count",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data.count;
};