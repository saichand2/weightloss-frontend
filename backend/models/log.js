const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  date: { type: String, required: true }, // ISO date string (yyyy-mm-dd)
  meal: { type: String },
  exercise: { type: String },
  nutrition: { type: Object },
  id: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
