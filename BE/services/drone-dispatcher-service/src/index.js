const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const droneSchema = new mongoose.Schema({
  droneId: String,
  status: String,
  location: String
});
const Drone = mongoose.model('Drone', droneSchema);

mongoose.connect('mongodb://mongodb:27017/dronedb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/drone/assign', async (req, res) => {
  // Dummy assignment logic
  const drone = new Drone({ droneId: 'DRONE1', status: 'ASSIGNED', location: 'RESTAURANT' });
  await drone.save();
  res.json(drone);
});

app.get('/drone/status/:id', async (req, res) => {
  const drone = await Drone.findOne({ droneId: req.params.id });
  res.json(drone);
});

const PORT = process.env.PORT || 8006;
app.listen(PORT, () => {
  console.log(`Drone Dispatcher Service running on port ${PORT}`);
});
