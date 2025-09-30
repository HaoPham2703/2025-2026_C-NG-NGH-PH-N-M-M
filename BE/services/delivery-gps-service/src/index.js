const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const gpsSchema = new mongoose.Schema({
  orderId: String,
  droneId: String,
  location: String,
  eta: Number
});
const GPS = mongoose.model('GPS', gpsSchema);

mongoose.connect('mongodb://mongodb:27017/gpsdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/delivery/start-trip', async (req, res) => {
  const gps = new GPS({ ...req.body, location: 'START', eta: 20 });
  await gps.save();
  res.json(gps);
});

app.get('/delivery/:orderId/location', async (req, res) => {
  const gps = await GPS.findOne({ orderId: req.params.orderId });
  res.json({ location: gps ? gps.location : 'UNKNOWN' });
});

app.get('/delivery/:orderId/eta', async (req, res) => {
  const gps = await GPS.findOne({ orderId: req.params.orderId });
  res.json({ eta: gps ? gps.eta : null });
});

const PORT = process.env.PORT || 8007;
app.listen(PORT, () => {
  console.log(`Delivery & GPS Service running on port ${PORT}`);
});
