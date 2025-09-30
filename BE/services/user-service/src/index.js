const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Example User schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  address: String
});
const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/userdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, address } = req.body;
  const user = new User({ email, password, name, address });
  await user.save();
  res.json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '15m' });
  res.json({ token });
});

// Get user info
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
