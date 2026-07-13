import axios from "axios";

export const API = axios.create({
  baseURL: "https://ragged-cartridge-refreeze.ngrok-free.dev/api",
  headers: {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});