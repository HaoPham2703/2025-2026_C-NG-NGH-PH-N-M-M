const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Check inventory for multiple products
const checkInventory = async (cartItems) => {
  try {
    const productIds = cartItems.map(item => item.product._id || item.product.id);
    
    const response = await axios.post(`${PRODUCT_SERVICE_URL}/api/v1/products/check-inventory`, {
      products: cartItems.map(item => ({
        id: item.product._id || item.product.id,
        quantity: item.quantity
      }))
    });

    return response.data;
  } catch (error) {
    console.error('Error checking inventory:', error.message);
    return { success: false, message: 'Error checking inventory' };
  }
};

// Update inventory after order
const updateInventory = async (cartItems, operation = 'decrease') => {
  try {
    const response = await axios.post(`${PRODUCT_SERVICE_URL}/api/v1/products/update-inventory`, {
      products: cartItems.map(item => ({
        id: item.product._id || item.product.id,
        quantity: item.quantity
      })),
      operation
    });

    return response.data;
  } catch (error) {
    console.error('Error updating inventory:', error.message);
    return { success: false, message: 'Error updating inventory' };
  }
};

// Get product details
const getProductDetails = async (productId) => {
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/v1/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting product details:', error.message);
    return { success: false, message: 'Product not found' };
  }
};

module.exports = {
  checkInventory,
  updateInventory,
  getProductDetails
};
