const mongoose = require('mongoose');

const CustomMealSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomMeal', CustomMealSchema);
