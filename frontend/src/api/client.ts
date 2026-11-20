import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const chatApi = {
  sendMessage: (
    content: string,
    language_mode: 'auto' | 'english' | 'urdu',
    urdu_script_mode: boolean,
    detected_language: 'english' | 'urdu_roman' | 'urdu_script',
    reply_language: 'english' | 'urdu_roman' | 'urdu_script',
    signal?: AbortSignal,
  ) => api.post('/api/chat', {
    content,
    language_mode,
    urdu_script_mode,
    detected_language,
    reply_language,
  }, { signal }),
  getHistory: () => api.get('/api/chat/history'),
  clearHistory: () => api.delete('/api/chat/history'),
};

export const faqApi = {
  getAll: (search?: string, category?: string) =>
    api.get('/api/faqs', { params: { search, category } }),
  getOne: (id: string) => api.get(`/api/faqs/${id}`),
};

export const adminApi = {
  verify: (pin: string) => api.post('/api/admin/verify', { pin }),
  addFaq: (data: { category: string; question: string; answer: string }) =>
    api.post('/api/admin/faqs', data),
  updateFaq: (id: string, data: { category?: string; question?: string; answer?: string }) =>
    api.put(`/api/admin/faqs/${id}`, data),
  deleteFaq: (id: string) => api.delete(`/api/admin/faqs/${id}`),
  reset: (clear_stats: boolean = true) => api.post('/api/admin/reset', { clear_stats }),
};

export const statsApi = {
  get: (range: string = 'all') => api.get('/api/stats', { params: { range } }),
  reset: () => api.post('/api/stats/reset'),
  exportCsvUrl: `${API_URL}/api/stats/export`,
  submitFeedback: (message_id: number, is_helpful: boolean) =>
    api.post('/api/feedback', { message_id, is_helpful }),
};
