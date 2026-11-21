import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Local development API URL.
// Change this only when switching to your production server.
export const BASE_URL = "http://192.168.1.30:8000";

export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
console.log("================================");
console.log("CIS API ENVIRONMENT");
console.log("BASE URL:", BASE_URL);
console.log("API URL:", API.defaults.baseURL);
console.log("================================");
// Use the same AsyncStorage key already used by CommonForm and the
// existing login flow: "token".
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");

      config.headers = config.headers ?? {};

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }

      // Never print the token itself.
      console.log(
        "API REQUEST:",
        config.method?.toUpperCase(),
        `${config.baseURL ?? ""}${config.url ?? ""}`,
        "Authenticated:",
        Boolean(token)
      );

      return config;
    } catch (error) {
      console.error("Could not retrieve authentication token:", error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("API ERROR:", error.message);
    console.error("STATUS:", error.response?.status);
    console.error("SERVER RESPONSE:", error.response?.data);
    return Promise.reject(error);
  }
);