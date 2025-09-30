const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  restaurantId: String
});
const Product = mongoose.model('Product', productSchema);

mongoose.connect('mongodb://mongodb:27017/productdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
