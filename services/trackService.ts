import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

export const getTrackApplications = async (
    page = 1,
    search = "",
    submissionLocation = ""
) => {
    try {

        const token = await AsyncStorage.getItem("token");

        console.log("TOKEN:", token);

        const response = await API.get("/track-applications", {
            params: {
                page,
                search,
                submission_location: submissionLocation,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("STATUS:", response.status);
        console.log("DATA:", response.data);

        return response.data;

    } catch (error: any) {

        console.log("ERROR MESSAGE:", error.message);
        console.log("ERROR CODE:", error.code);
        console.log("ERROR RESPONSE:", error.response);
        console.log("ERROR REQUEST:", error.request);

        throw error;
    }
};