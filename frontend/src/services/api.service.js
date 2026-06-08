import axios from "axios";

const API_URL =
  "http://localhost:8080/api" || "https://plinko-game-j0ej.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
});

export const roundsService = {
  commit: async () => {
    const response = await api.post("/rounds/commit");
    return response.data;
  },
  start: async (id, data) => {
    const response = await api.post(`/rounds/${id}/start`, data);
    return response.data;
  },
  reveal: async (id) => {
    const response = await api.post(`/rounds/${id}/reveal`);
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/rounds/${id}`);
    return response.data;
  },
};

export const verifyService = {
  verify: async (params) => {
    const response = await api.get("/verify", { params });
    return response.data;
  },
};

export default api;
