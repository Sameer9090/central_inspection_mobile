import axios from "axios";

export const API = axios.create({
  baseURL: "https://ragged-cartridge-refreeze.ngrok-free.dev/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  console.log("➡️ REQUEST");
  console.log("Method:", config.method?.toUpperCase());
  console.log("URL:", config.baseURL + config.url);
  console.log("Headers:", config.headers);
  console.log("Body:", config.data);
  return config;
});

API.interceptors.response.use(
  (response) => {
    console.log("✅ RESPONSE");
    console.log("URL:", response.config.url);
    console.log("Status:", response.status);
    return response;
  },
  (error) => {
    console.log("❌ RESPONSE ERROR");
    console.log("URL:", error.config?.url);
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
    return Promise.reject(error);
  }
);