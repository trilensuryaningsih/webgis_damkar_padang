import axios from "axios";

// Selalu pakai path relatif "/api". Request di-proxy ke backend oleh:
//  - Vite (saat dev)        -> lihat vite.config.js
//  - Vercel (saat produksi) -> lihat vercel.json
// Dipaksa relatif (mengabaikan VITE_API_URL) supaya tidak kena CORS
// tanpa perlu mengubah backend maupun env var di dashboard Vercel.
const API_BASE_URL = "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage =
      error.response?.data?.error || error.response?.data?.message;

    if (serverMessage) {
      error.message = serverMessage;
    } else if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Backend tidak merespons tepat waktu.";
    } else if (!error.response) {
      error.message = "Network error. Backend production tidak dapat dijangkau.";
    }

    return Promise.reject(error);
  },
);

export const getDamkar = (radius = 3000) =>
  API.get("/damkar", { params: { radius } });
export const getCoverage = (radius = 3000) =>
  API.get("/coverage", { params: { radius } });
export const getBlankspot = (radius = 3000) =>
  API.get("/blankspot", { params: { radius } });
export const getRekomendasi = (radius = 3000) =>
  API.get("/rekomendasi", { params: { radius } });
export const getJalan = () => API.get("/jalan");
export const getStats = (radius = 3000) =>
  API.get("/stats", { params: { radius } });

export const getDamkarList = (search = "", radius = 3000) =>
  API.get("/damkar/list", { params: { search, radius } });
export const getDamkarById = (id) => API.get(`/damkar/${id}`);
export const createDamkar = (data) => API.post("/damkar", data);
export const updateDamkar = (id, data) => API.put(`/damkar/${id}`, data);
export const deleteDamkar = (id) => API.delete(`/damkar/${id}`);

export default API;
