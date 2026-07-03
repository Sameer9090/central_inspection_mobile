import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

export const sendReminder = async (
    receiverId: number,
    applicationRefNo: string,
    remarks: string
) => {

    const token = await AsyncStorage.getItem("token");

    const response = await API.post(
        "/send-reminder",
        {
            receiver_id: receiverId,
            application_ref_no: applicationRefNo,
            remarks,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};