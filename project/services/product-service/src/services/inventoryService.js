const Product = require('../models/productModel');

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Check if product has enough inventory
const checkInventory = async (productId, quantity) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }
    
    if (product.inventory < quantity) {
      return { 
        success: false, 
        message: `Insufficient inventory. Available: ${product.inventory}, Requested: ${quantity}`,
        available: product.inventory,
        requested: quantity
      };
    }
    
    return { 
      success: true, 
      available: product.inventory,
      product: product
    };
  } catch (error) {
    return { success: false, message: 'Error checking inventory' };
  }
};

// Update inventory after order
const updateInventory = async (productId, quantity, operation = 'decrease') => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }
    
    if (operation === 'decrease') {
      if (product.inventory < quantity) {
        return { 
          success: false, 
          message: 'Insufficient inventory',
          available: product.inventory,
          requested: quantity
        };
      }
      product.inventory -= quantity;
    } else if (operation === 'increase') {
      product.inventory += quantity;
    }
    
    await product.save();
    
    return { 
      success: true, 
      newInventory: product.inventory,
      product: product
    };
  } catch (error) {
    return { success: false, message: 'Error updating inventory' };
  }
};

// Get inventory for multiple products
const getInventoryForProducts = async (productIds) => {
  try {
    const products = await Product.find({ 
      _id: { $in: productIds } 
    }).select('_id title inventory price');
    
    const inventoryMap = {};
    products.forEach(product => {
      inventoryMap[product._id.toString()] = {
        id: product._id,
        title: product.title,
        inventory: product.inventory,
        price: product.price
      };
    });
    
    return { success: true, inventory: inventoryMap };
  } catch (error) {
    return { success: false, message: 'Error getting inventory' };
  }
};

module.exports = {
  checkInventory,
  updateInventory,
  getInventoryForProducts
};
