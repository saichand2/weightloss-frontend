const express = require('express');
const router = express.Router();
const Log = require('../models/log');
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

// GET /logs?date=YYYY-MM-DD
router.get('/', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    const date = req.query.date;
    const q = date ? { uid, date } : { uid };
    const items = await Log.find(q).lean();
    res.json(items);
  } catch (err) {
    console.error('fetch logs failed', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /logs
router.post('/', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    const payload = req.body;
    // ensure id non-collision
    const existing = await Log.findOne({ id: payload.id });
    if (existing) {
      // replace
      const updated = await Log.findOneAndUpdate({ id: payload.id }, { ...payload, uid }, { new: true });
      return res.json(updated);
    }
    const doc = new Log({ ...payload, uid });
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error('save log failed', err);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// DELETE /logs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    await Log.deleteOne({ id });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete log failed', err);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

module.exports = router;
