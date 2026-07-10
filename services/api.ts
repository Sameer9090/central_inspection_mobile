import axios from "axios";
export const BASE_URL = "http://192.168.1.6:8000";
export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    Accept: "application/json",
  },
});
