import axiosClient from './axiosClient';

export const productApi = {
  // Products
  getProducts: (params) => axiosClient.get('/products', { params }),
  getProduct: (id) => axiosClient.get(`/products/${id}`),
  createProduct: (data) => axiosClient.post('/products', data),
  updateProduct: (id, data) => axiosClient.patch(`/products/${id}`, data),
  deleteProduct: (id) => axiosClient.delete(`/products/${id}`),
  
  // Categories
  getCategories: () => axiosClient.get('/products/categories'),
  createCategory: (data) => axiosClient.post('/products/categories', data),
  
  // Brands
  getBrands: () => axiosClient.get('/products/brands'),
  createBrand: (data) => axiosClient.post('/products/brands', data),
  
  // Top products
  getTopProducts: () => axiosClient.get('/products/top-5-cheap'),
};
