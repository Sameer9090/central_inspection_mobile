import axios from "axios";
import * as Device from "expo-device";

// export const BASE_URL = "http://10.0.2.2:8000";
// export const BASE_URL = "http://192.168.1.4:8000";
// export const BASE_URL = "http://192.168.29.214:8000";
const BASE_URL = Device.isDevice ? "http://192.168.1.4:8000" : "http://10.0.2.2:8000";
export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

