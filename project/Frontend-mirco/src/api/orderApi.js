import { orderClient } from './axiosClients';

export const orderApi = {
  // Orders
  getOrders: (params) => orderClient.get('/orders', { params }),
  getOrder: (id) => orderClient.get(`/orders/${id}`),
  createOrder: (data) => orderClient.post('/orders', data),
  updateOrder: (id, data) => orderClient.patch(`/orders/${id}`, data),
  deleteOrder: (id) => orderClient.delete(`/orders/${id}`),
  
  // Analytics
  getOrderStats: () => orderClient.get('/orders/count'),
  getRevenueStats: () => orderClient.get('/orders/sum'),
  getTopProducts: (data) => orderClient.post('/orders/topProduct', data),
};
