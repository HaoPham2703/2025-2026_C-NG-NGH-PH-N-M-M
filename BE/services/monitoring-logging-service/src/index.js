const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const logSchema = new mongoose.Schema({
  service: String,
  message: String,
  timestamp: Date
});
const Log = mongoose.model('Log', logSchema);

mongoose.connect('mongodb://mongodb:27017/logdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/log', async (req, res) => {
  const log = new Log({ ...req.body, timestamp: new Date() });
  await log.save();
  res.json(log);
});

app.get('/metrics', async (req, res) => {
  // Dummy metrics
  res.json({ cpu: 10, memory: 256, errors: 0 });
});

const PORT = process.env.PORT || 8008;
app.listen(PORT, () => {
  console.log(`Monitoring & Logging Service running on port ${PORT}`);
});
