const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications - Get current user notifications
router.get('/', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT
        n.id, n.type, n.content, n.target_id, n.is_read, n.created_at,
        u.id as actor_id, u.username as actor_username, u.name as actor_name, u.avatar as actor_avatar, u.verified as actor_verified
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 30
    `).all(req.user.id);

    const unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c;

    res.json({
      notifications: notifications.map(n => ({
        ...n,
        is_read: Boolean(n.is_read),
        actor: {
          id: n.actor_id,
          username: n.actor_username,
          name: n.actor_name,
          avatar: n.actor_avatar,
          verified: Boolean(n.actor_verified)
        }
      })),
      unreadCount
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
