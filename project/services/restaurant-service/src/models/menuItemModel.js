const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    promotion: {
      type: Number,
      min: 0,
      default: null,
    },
    category: {
      type: String,
      enum: ['Món Việt', 'Món ăn nhanh', 'Đồ uống', 'Tráng miệng', 'Khác'],
      default: 'Khác',
    },
    images: [{
      type: String,
    }],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
menuItemSchema.index({ title: 'text', description: 'text' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;

