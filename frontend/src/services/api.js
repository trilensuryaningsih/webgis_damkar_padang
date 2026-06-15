import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const getDamkar = (radius = 3000) => API.get(`/damkar?radius=${radius}`);
export const getCoverage = (radius = 3000) =>
  API.get(`/coverage?radius=${radius}`);
export const getBlankspot = (radius = 3000) =>
  API.get(`/blankspot?radius=${radius}`);
export const getRekomendasi = (radius = 3000) =>
  API.get(`/rekomendasi?radius=${radius}`);
export const getJalan = () => API.get("/jalan");
export const getStats = (radius = 3000) => API.get(`/stats?radius=${radius}`);

export const getDamkarList = (search = "", radius = 3000) =>
  API.get(`/damkar/list?search=${search}&radius=${radius}`);
export const getDamkarById = (id) => API.get(`/damkar/${id}`);
export const createDamkar = (data) => API.post("/damkar", data);
export const updateDamkar = (id, data) => API.put(`/damkar/${id}`, data);
export const deleteDamkar = (id) => API.delete(`/damkar/${id}`);

export default API;
