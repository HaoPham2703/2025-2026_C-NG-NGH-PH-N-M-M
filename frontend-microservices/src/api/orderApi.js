import axiosClient from './axiosClient';

export const orderApi = {
  // Orders
  getOrders: (params) => axiosClient.get('/orders', { params }),
  getOrder: (id) => axiosClient.get(`/orders/${id}`),
  createOrder: (data) => axiosClient.post('/orders', data),
  updateOrder: (id, data) => axiosClient.patch(`/orders/${id}`, data),
  deleteOrder: (id) => axiosClient.delete(`/orders/${id}`),
  
  // Analytics
  getOrderStats: () => axiosClient.get('/orders/count'),
  getRevenueStats: () => axiosClient.get('/orders/sum'),
  getTopProducts: (data) => axiosClient.post('/orders/topProduct', data),
};
