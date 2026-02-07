const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users — create anonymous user
router.post('/', async (req, res) => {
  try {
    const { displayName = 'Anonymous' } = req.body;
    const user = await User.create({ displayName });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — get user profile + stats
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/wallet — connect Solana wallet
router.patch('/:id/wallet', async (req, res) => {
  try {
    const { walletPubkey } = req.body;
    if (!walletPubkey) return res.status(400).json({ error: 'walletPubkey required' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { solanaWallet: walletPubkey },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
