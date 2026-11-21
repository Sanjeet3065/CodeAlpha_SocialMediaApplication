const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/messages/conversations - List active conversation threads
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all partner user IDs that current user has exchanged messages with
    const partnersQuery = `
      SELECT DISTINCT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `;
    const partnerRows = db.prepare(partnersQuery).all(currentUserId, currentUserId, currentUserId);
    const partnerIds = partnerRows.map(r => r.partner_id);

    const conversations = [];

    for (const pId of partnerIds) {
      const partner = db.prepare(`
        SELECT id, username, name, avatar, verified
        FROM users WHERE id = ?
      `).get(pId);

      if (!partner) continue;

      const lastMsg = db.prepare(`
        SELECT id, sender_id, receiver_id, content, is_read, created_at
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `).get(currentUserId, pId, pId, currentUserId);

      const unreadCount = db.prepare(`
        SELECT COUNT(*) as c
        FROM messages
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).get(pId, currentUserId).c;

      conversations.push({
        partner: {
          id: partner.id,
          username: partner.username,
          name: partner.name,
          avatar: partner.avatar,
          verified: Boolean(partner.verified)
        },
        last_message: lastMsg ? {
          id: lastMsg.id,
          content: lastMsg.content,
          sender_id: lastMsg.sender_id,
          is_me: lastMsg.sender_id === currentUserId,
          is_read: Boolean(lastMsg.is_read),
          created_at: lastMsg.created_at
        } : null,
        unread_count: unreadCount
      });
    }

    // Sort by latest message date descending
    conversations.sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
      return timeB - timeA;
    });

    // Also get quick recommendations for users to start a conversation with
    const suggestedUsers = db.prepare(`
      SELECT id, username, name, avatar, verified
      FROM users
      WHERE id != ?
      ORDER BY id ASC
      LIMIT 6
    `).all(currentUserId).map(u => ({ ...u, verified: Boolean(u.verified) }));

    res.json({
      conversations,
      suggestedUsers
    });
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

// GET /api/messages/:userId - Get message thread with a specific user
router.get('/:userId', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const partnerId = parseInt(req.params.userId, 10);

    if (isNaN(partnerId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const partner = db.prepare(`
      SELECT id, username, name, avatar, bio, verified
      FROM users WHERE id = ?
    `).get(partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Mark any unread incoming messages as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(partnerId, currentUserId);

    // Fetch conversation messages in chronological order
    const messages = db.prepare(`
      SELECT id, sender_id, receiver_id, content, is_read, created_at
      FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC, id ASC
      LIMIT 200
    `).all(currentUserId, partnerId, partnerId, currentUserId);

    const formattedMessages = messages.map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      content: m.content,
      is_me: m.sender_id === currentUserId,
      is_read: Boolean(m.is_read),
      created_at: m.created_at
    }));

    res.json({
      partner: {
        id: partner.id,
        username: partner.username,
        name: partner.name,
        avatar: partner.avatar,
        bio: partner.bio,
        verified: Boolean(partner.verified)
      },
      messages: formattedMessages
    });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// POST /api/messages/:userId - Send a new direct message
router.post('/:userId', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const partnerId = parseInt(req.params.userId, 10);
    const { content } = req.body;

    if (isNaN(partnerId)) {
      return res.status(400).json({ error: 'Invalid recipient ID.' });
    }

    if (partnerId === currentUserId) {
      return res.status(400).json({ error: 'Cannot send messages to yourself.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const partner = db.prepare('SELECT id, username, name FROM users WHERE id = ?').get(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Recipient does not exist.' });
    }

    const trimmed = content.trim();
    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(currentUserId, partnerId, trimmed);

    const newMsg = {
      id: Number(result.lastInsertRowid),
      sender_id: currentUserId,
      receiver_id: partnerId,
      content: trimmed,
      is_me: true,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Optionally create a notification for the recipient
    try {
      db.prepare(`
        INSERT INTO notifications (user_id, actor_id, type, content, target_id)
        VALUES (?, ?, 'message', ?, ?)
      `).run(partnerId, currentUserId, `sent you a direct message: "${trimmed.slice(0, 35)}${trimmed.length > 35 ? '...' : ''}"`, newMsg.id);
    } catch (e) {}

    res.status(201).json({
      message: 'Message sent!',
      data: newMsg
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// POST /api/messages/read/:userId - Mark thread as read
router.post('/read/:userId', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const partnerId = parseInt(req.params.userId, 10);

    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(partnerId, currentUserId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
});

module.exports = router;
