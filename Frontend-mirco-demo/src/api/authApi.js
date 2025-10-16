import axiosClient from './axiosClient';

export const authApi = {
  // Authentication
  signup: (data) => axiosClient.post('/auth/signup', data),
  login: (data) => axiosClient.post('/auth/login', data),
  logout: () => axiosClient.get('/auth/logout'),
  verify: () => axiosClient.get('/auth/verify'),
  forgotPassword: (data) => axiosClient.post('/auth/forgotPassword', data),
  resetPassword: (token, data) => axiosClient.patch(`/auth/resetPassword/${token}`, data),
  
  // User profile
  getProfile: () => axiosClient.get('/users/me'),
  updateProfile: (data) => axiosClient.patch('/users/updateMe'),
  changePassword: (data) => axiosClient.patch('/users/updateMyPassword'),
  
  // Address management
  getAddresses: () => axiosClient.get('/users/me/address'),
  createAddress: (data) => axiosClient.patch('/users/createAddress', data),
  updateAddress: (data) => axiosClient.patch('/users/updateAddress', data),
  deleteAddress: (data) => axiosClient.patch('/users/deleteAddress', data),
  setDefaultAddress: (data) => axiosClient.patch('/users/setDefaultAddress', data),
};
