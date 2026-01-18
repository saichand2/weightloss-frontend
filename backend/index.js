require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const customRoutes = require('./routes/customMeals');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000;

if (!MONGO_URI) {
  console.warn('MONGO_URI not set. Backend will not connect to database until configured.');
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.warn('MongoDB connection failed:', err.message || err));

app.get('/', (req, res) => res.send({ ok: true, message: 'Weightloss backend' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/logs', logRoutes);
app.use('/customMeals', customRoutes);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
