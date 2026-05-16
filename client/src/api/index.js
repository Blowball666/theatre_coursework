const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data.data;
}

// Shows
export const getTodayShows = () => request('/shows/today');
export const getAfisha = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  const q = new URLSearchParams(clean).toString();
  return request(`/shows/afisha${q ? '?' + q : ''}`);
};
export const getShowById = (id) => request(`/shows/${id}`);
export const getAllShows = () => request('/shows');
export const createShow = (data) => request('/shows', { method: 'POST', body: JSON.stringify(data) });
export const updateShow = (id, data) => request(`/shows/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteShow = (id) => request(`/shows/${id}`, { method: 'DELETE' });

// Performances
export const getPerformanceById = (id) => request(`/performances/${id}`);
export const getPerformanceSeats = (id) => request(`/performances/${id}/seats`);
export const getAllPerformances = () => request('/performances');
export const createPerformance = (data) => request('/performances', { method: 'POST', body: JSON.stringify(data) });
export const updatePerformance = (id, data) => request(`/performances/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePerformance = (id) => request(`/performances/${id}`, { method: 'DELETE' });

// Auth
export const login = (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const getProfile = (userId) => request(`/auth/profile?userId=${userId}`);
export const getUserOrders = (userId) => request(`/users/${userId}/orders`);

// Orders
export const createOrder = (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) });
export const updateOrderStatus = (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
