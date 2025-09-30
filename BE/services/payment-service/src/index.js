const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const paymentSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  status: String
});
const Payment = mongoose.model('Payment', paymentSchema);

mongoose.connect('mongodb://mongodb:27017/paymentdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/payments/process', async (req, res) => {
  const payment = new Payment({ ...req.body, status: 'SUCCESS' });
  await payment.save();
  res.json(payment);
});

app.get('/payments/:id', async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  res.json(payment);
});

const PORT = process.env.PORT || 8005;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
