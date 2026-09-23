import api from '@/lib/api';

export const adminApi = {
  // Auth
  me: () => api.get('/auth/me').then(r => r.data),

  // Products
  products: {
    getAll: (params?: object) => api.get('/products', { params: { ...params, all: true } }).then(r => r.data),
    getOne: (id: string) => api.get(`/products/${id}`).then(r => r.data),
    create: (data: object) => api.post('/products', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/products/${id}`, data).then(r => r.data),
    toggleActive: (id: string) => api.patch(`/products/${id}/toggle-active`).then(r => r.data),
  },

  // Categories
  categories: {
    getAll: () => api.get('/categories', { params: { all: true } }).then(r => r.data),
    create: (data: object) => api.post('/categories', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/categories/${id}`, data).then(r => r.data),
    toggleActive: (id: string) => api.patch(`/categories/${id}/toggle-active`).then(r => r.data),
  },

  // Sliders
  sliders: {
    getAll: () => api.get('/sliders').then(r => r.data),
    create: (data: object) => api.post('/sliders', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/sliders/${id}`, data).then(r => r.data),
    delete: (id: string) => api.delete(`/sliders/${id}`).then(r => r.data),
  },

  // Orders
  orders: {
    getAll: (params?: object) => api.get('/orders/admin/all', { params }).then(r => r.data),
    getOne: (id: string) => api.get(`/orders/${id}`).then(r => r.data),
    updateStatus: (id: string, status: string) => api.patch(`/orders/admin/${id}/status`, { status }).then(r => r.data),
  },

  // Users
  users: {
    getAll: (params?: object) => api.get('/users/admin', { params }).then(r => r.data),
    getOne: (id: string) => api.get(`/users/admin/${id}`).then(r => r.data),
    toggleActive: (id: string) => api.patch(`/users/admin/${id}/toggle-active`).then(r => r.data),
  },

  // Promotions
  promotions: {
    getAll: () => api.get('/promotions/admin').then(r => r.data),
    create: (data: object) => api.post('/promotions', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/promotions/${id}`, data).then(r => r.data),
    delete: (id: string) => api.delete(`/promotions/${id}`).then(r => r.data),
  },
};
