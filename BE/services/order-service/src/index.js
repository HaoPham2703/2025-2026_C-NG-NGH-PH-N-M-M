const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const orderSchema = new mongoose.Schema({
  userId: String,
  items: Array,
  status: String
});
const Order = mongoose.model('Order', orderSchema);

mongoose.connect('mongodb://mongodb:27017/orderdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/orders', async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.json(order);
});

app.get('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
});

app.patch('/orders/:id/status', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(order);
});

const PORT = process.env.PORT || 8004;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
