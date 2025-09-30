const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const cartSchema = new mongoose.Schema({
  userId: String,
  items: [
    {
      productId: String,
      quantity: Number
    }
  ]
});
const Cart = mongoose.model('Cart', cartSchema);

mongoose.connect('mongodb://mongodb:27017/cartdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/cart/add', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });
  cart.items.push({ productId, quantity });
  await cart.save();
  res.json(cart);
});

app.get('/cart/:userId', async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId });
  res.json(cart || { items: [] });
});

app.delete('/cart/remove/:userId/:itemId', async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId });
  if (cart) {
    cart.items = cart.items.filter((item, idx) => idx != req.params.itemId);
    await cart.save();
  }
  res.json(cart || { items: [] });
});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});
