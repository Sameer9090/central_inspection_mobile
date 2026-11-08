
import axios from "axios";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveDebugLog } from "./debugLogger";

const OFFICE_URL = "http://192.168.1.30:8000/api";
const HOME_URL = "http://192.168.29.214:8000/api";

export let BASE_URL = HOME_URL;

export const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

export const detectApiServer = async (): Promise<string | null> => {
  try {
    const deviceIp = await Network.getIpAddressAsync();

    console.log("Device local IP:", deviceIp);

    if (deviceIp.startsWith("192.168.1.")) {
      BASE_URL = OFFICE_URL;
    } else if (deviceIp.startsWith("192.168.29.")) {
      BASE_URL = HOME_URL;
    } else {
      console.log("Unknown Wi-Fi network:", deviceIp);
      return null;
    }

    API.defaults.baseURL = BASE_URL;

    console.log("Selected API server:", BASE_URL);

    return BASE_URL;
  } catch (error) {
    console.error("API server detection failed:", error);
    return null;
  }
};

let serverDetectionPromise: Promise<string | null> | null = null;

export const initializeApiServer = (): Promise<string | null> => {
  if (!serverDetectionPromise) {
    serverDetectionPromise = detectApiServer();
  }

  return serverDetectionPromise;
};

// REQUEST INTERCEPTOR
API.interceptors.request.use(
  async (config) => {
    await initializeApiServer();

    // Attach authentication token automatically
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    await saveDebugLog("API REQUEST", {
      method: config.method,
      url: `${config.baseURL || ""}${config.url || ""}`,
    });

    return config;
  },
  async (error) => {
    await saveDebugLog(
      "API REQUEST ERROR",
      { message: error.message },
      "ERROR"
    );

    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
API.interceptors.response.use(
  async (response) => {
    await saveDebugLog("API RESPONSE", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });

    return response;
  },
  async (error) => {
    await saveDebugLog(
      "API RESPONSE ERROR",
      {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
      },
      "ERROR"
    );

    return Promise.reject(error);
  }
);
