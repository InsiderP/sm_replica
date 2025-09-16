import axios from 'axios';
import { API_URL } from './config';

export const api = axios.create({ baseURL: API_URL });

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

export function loadAuthTokenFromStorage() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
}


