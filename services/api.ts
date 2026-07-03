import axios from "axios";

export const API = axios.create({
  baseURL: "http://10.0.2.2:8000/api",
  headers: {
    Accept: "application/json",
  },
});