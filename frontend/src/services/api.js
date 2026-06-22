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

// ============================================================
// Cache + dedup untuk request GET (mempercepat tanpa ubah backend)
//  - Cache: respons per (url+params) disimpan selama TTL, jadi mengulang
//    radius yang sama tampil instan tanpa hit backend lagi.
//  - Dedup: request GET identik yang sedang berjalan berbagi 1 promise,
//    sehingga banyak komponen tidak menembak endpoint sama berkali-kali.
//  - Invalidasi: cache dibersihkan saat ada perubahan data (POST/PUT/DELETE).
// ============================================================
const GET_CACHE_TTL = 5 * 60 * 1000; // 5 menit
const getCache = new Map(); // key -> { ts, data }
const inflight = new Map(); // key -> Promise

const cacheKey = (url, params) => `${url}?${JSON.stringify(params || {})}`;

function clearGetCache() {
  getCache.clear();
  inflight.clear();
}

function cachedGet(url, params) {
  const key = cacheKey(url, params);

  const hit = getCache.get(key);
  if (hit && Date.now() - hit.ts < GET_CACHE_TTL) {
    return Promise.resolve({ data: hit.data, fromCache: true });
  }

  if (inflight.has(key)) return inflight.get(key);

  const req = API.get(url, { params })
    .then((res) => {
      getCache.set(key, { ts: Date.now(), data: res.data });
      inflight.delete(key);
      return res;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, req);
  return req;
}

export const getDamkar = (radius = 3000) => cachedGet("/damkar", { radius });
export const getCoverage = (radius = 3000) =>
  cachedGet("/coverage", { radius });
export const getBlankspot = (radius = 3000) =>
  cachedGet("/blankspot", { radius });
export const getRekomendasi = (radius = 3000) =>
  cachedGet("/rekomendasi", { radius });
export const getJalan = () => cachedGet("/jalan");
export const getStats = (radius = 3000) => cachedGet("/stats", { radius });

export const getDamkarList = (search = "", radius = 3000) =>
  cachedGet("/damkar/list", { search, radius });
export const getDamkarById = (id) => cachedGet(`/damkar/${id}`);

// Mutasi data → bersihkan cache agar data berikutnya selalu segar
export const createDamkar = (data) =>
  API.post("/damkar", data).then((res) => {
    clearGetCache();
    return res;
  });
export const updateDamkar = (id, data) =>
  API.put(`/damkar/${id}`, data).then((res) => {
    clearGetCache();
    return res;
  });
export const deleteDamkar = (id) =>
  API.delete(`/damkar/${id}`).then((res) => {
    clearGetCache();
    return res;
  });

export default API;
