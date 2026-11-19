
import axios from "axios";

export const BASE_URL = "https://col-inspection.assam.gov.in";

export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Log outgoing requests
API.interceptors.request.use(
  (config) => {
    console.log(
      "API REQUEST:",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`
    );
    return config;
  },
  (error) => {
    console.log("REQUEST ERROR:", error);
    return Promise.reject(error);
  }
);

// Log server responses
API.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log("API ERROR:", error.message);
    console.log("STATUS:", error.response?.status);
    console.log("SERVER RESPONSE:", error.response?.data);
    return Promise.reject(error);
  }
);
