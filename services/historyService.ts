import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

export const getHistory = async (applRefNo: string) => {
    const token = await AsyncStorage.getItem("token");

    const response = await API.get(
        `/track-history/${encodeURIComponent(applRefNo)}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};