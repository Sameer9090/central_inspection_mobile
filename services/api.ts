import axios from "axios";
export const BASE_URL = "http://10.0.2.2:8000";
export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

