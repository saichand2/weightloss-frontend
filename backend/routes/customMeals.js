const express = require('express');
const router = express.Router();
const CustomMeal = require('../models/customMeal');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /customMeals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    const items = await CustomMeal.find({ uid }).lean();
    res.json(items);
  } catch (err) {
    console.error('fetch custom meals failed', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// POST /customMeals
router.post('/', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    const payload = req.body;
    const existing = await CustomMeal.findOne({ id: payload.id });
    if (existing) {
      const updated = await CustomMeal.findOneAndUpdate({ id: payload.id }, { ...payload, uid }, { new: true });
      return res.json(updated);
    }
    const doc = new CustomMeal({ ...payload, uid });
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error('save custom meal failed', err);
    res.status(500).json({ error: 'Failed to save meal' });
  }
});

// DELETE /customMeals/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    await CustomMeal.deleteOne({ id });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete custom meal failed', err);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

module.exports = router;
