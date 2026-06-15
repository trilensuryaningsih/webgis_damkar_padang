import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// --- Peta & Analisis ---
export const getDamkar       = ()              => API.get('/damkar');
export const getCoverage     = (radius = 3000) => API.get(`/coverage?radius=${radius}`);
export const getBlankspot    = (radius = 3000) => API.get(`/blankspot?radius=${radius}`);
export const getRekomendasi  = ()              => API.get('/rekomendasi');
export const getJalan        = ()              => API.get('/jalan');
export const getStats        = ()              => API.get('/stats');

// --- CRUD & Search ---
export const getDamkarList   = (search = '')   => API.get(`/damkar/list?search=${search}`);
export const getDamkarById   = (id)            => API.get(`/damkar/${id}`);
export const createDamkar    = (data)          => API.post('/damkar', data);
export const updateDamkar    = (id, data)      => API.put(`/damkar/${id}`, data);
export const deleteDamkar    = (id)            => API.delete(`/damkar/${id}`);

export default API;

