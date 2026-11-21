const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/stories - List all recent stories grouped by user
router.get('/', optionalAuth, (req, res) => {
  try {
    const stories = db.prepare(`
      SELECT
        s.id, s.media_url, s.caption, s.created_at,
        u.id as user_id, u.username, u.name, u.avatar, u.verified
      FROM stories s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all();

    // Group stories by user
    const usersMap = {};
    stories.forEach(s => {
      if (!usersMap[s.user_id]) {
        usersMap[s.user_id] = {
          user: {
            id: s.user_id,
            username: s.username,
            name: s.name,
            avatar: s.avatar,
            verified: Boolean(s.verified)
          },
          stories: []
        };
      }
      usersMap[s.user_id].stories.push({
        id: s.id,
        media_url: s.media_url,
        caption: s.caption,
        created_at: s.created_at
      });
    });

    res.json({
      storyGroups: Object.values(usersMap)
    });
  } catch (err) {
    console.error('Fetch stories error:', err);
    res.status(500).json({ error: 'Failed to load stories.' });
  }
});

// POST /api/stories - Add a new story
router.post('/', requireAuth, (req, res) => {
  try {
    const { media_url, caption } = req.body;
    if (!media_url) {
      return res.status(400).json({ error: 'Media URL is required for stories.' });
    }

    const result = db.prepare(`
      INSERT INTO stories (user_id, media_url, caption)
      VALUES (?, ?, ?)
    `).run(req.user.id, media_url.trim(), caption ? caption.trim() : '');

    res.status(201).json({
      message: 'Story shared!',
      storyId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('Add story error:', err);
    res.status(500).json({ error: 'Failed to share story.' });
  }
});

module.exports = router;
