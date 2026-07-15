import axios from "axios";
export const BASE_URL = "https://ragged-cartridge-refreeze.ngrok-free.dev";
export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});



// // export const BASE_URL = "http://192.168.29.214:8000";
// export const BASE_URL = "http://10.0.2.2:8000";
// export const API = axios.create({
//   baseURL: `${BASE_URL}/api`,
//   headers: { Accept: "application/json" },
// });
