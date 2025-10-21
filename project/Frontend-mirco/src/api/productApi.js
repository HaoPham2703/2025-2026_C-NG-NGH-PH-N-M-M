import { productClient } from "./axiosClients";

export const productApi = {
  // Products
  getProducts: (params) => productClient.get("/products", { params }),
  getProduct: (id) => productClient.get(`/products/${id}`),
  createProduct: (data) => productClient.post("/products", data),
  updateProduct: (id, data) => productClient.patch(`/products/${id}`, data),
  deleteProduct: (id) => productClient.delete(`/products/${id}`),

  // Categories
  getCategories: () => productClient.get("/products/categories"),
  createCategory: (data) => productClient.post("/products/categories", data),

  // Brands
  getBrands: () => productClient.get("/products/brands"),
  createBrand: (data) => productClient.post("/products/brands", data),

  // Top products
  getTopProducts: () => productClient.get("/products/top-5-cheap"),
};
