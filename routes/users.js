const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/users/profile/:username - Fetch user profile with stats & follow state
router.get('/profile/:username', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const { username } = req.params;

    const user = db.prepare(`
      SELECT id, username, name, bio, avatar, banner, location, website, verified, created_at
      FROM users WHERE lower(username) = lower(?)
    `).get(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?) as likes_received
    `).get(user.id, user.id, user.id, user.id);

    const isFollowing = currentUserId > 0
      ? Boolean(db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, user.id))
      : false;

    res.json({
      profile: {
        ...user,
        verified: Boolean(user.verified),
        stats,
        is_following: isFollowing,
        is_me: currentUserId === user.id
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to load user profile.' });
  }
});

// POST /api/users/:id/follow - Toggle follow/unfollow
router.post('/:id/follow', requireAuth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const followerId = req.user.id;

    if (targetUserId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User does not exist.' });
    }

    const existingFollow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(followerId, targetUserId);

    let following = false;
    if (existingFollow) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, targetUserId);
      following = false;
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, targetUserId);
      following = true;
    }

    // Get fresh counts
    const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(targetUserId).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(followerId).count;

    res.json({
      following,
      targetUserId,
      followers_count: followersCount,
      following_count: followingCount,
      message: following ? `You followed @${targetUser.username}` : `Unfollowed @${targetUser.username}`
    });
  } catch (err) {
    console.error('Follow toggle error:', err);
    res.status(500).json({ error: 'Failed to update follow status.' });
  }
});

// GET /api/users/:id/followers - List followers
router.get('/:id/followers', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const userId = parseInt(req.params.id, 10);

    const followers = db.prepare(`
      SELECT
        u.id, u.username, u.name, u.bio, u.avatar, u.verified,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) THEN 1 ELSE 0 END as is_following
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT 100
    `).all(currentUserId, currentUserId, userId);

    res.json({
      followers: followers.map(u => ({
        ...u,
        verified: Boolean(u.verified),
        is_following: Boolean(u.is_following),
        is_me: currentUserId === u.id
      }))
    });
  } catch (err) {
    console.error('Followers list error:', err);
    res.status(500).json({ error: 'Failed to load followers list.' });
  }
});

// GET /api/users/:id/following - List users followed
router.get('/:id/following', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const userId = parseInt(req.params.id, 10);

    const following = db.prepare(`
      SELECT
        u.id, u.username, u.name, u.bio, u.avatar, u.verified,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) THEN 1 ELSE 0 END as is_following
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT 100
    `).all(currentUserId, currentUserId, userId);

    res.json({
      following: following.map(u => ({
        ...u,
        verified: Boolean(u.verified),
        is_following: Boolean(u.is_following),
        is_me: currentUserId === u.id
      }))
    });
  } catch (err) {
    console.error('Following list error:', err);
    res.status(500).json({ error: 'Failed to load following list.' });
  }
});

// GET /api/users/suggested - Suggested users to follow
router.get('/suggested/list', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;

    let query = `
      SELECT
        u.id, u.username, u.name, u.bio, u.avatar, u.verified,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
      FROM users u
      WHERE u.id != ?
      AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
      ORDER BY followers_count DESC, RANDOM()
      LIMIT 5
    `;

    const suggestions = db.prepare(query).all(currentUserId, currentUserId);

    res.json({
      users: suggestions.map(u => ({
        ...u,
        verified: Boolean(u.verified),
        is_following: false
      }))
    });
  } catch (err) {
    console.error('Suggested users error:', err);
    res.status(500).json({ error: 'Failed to load recommendations.' });
  }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, bio, location, website, avatar, banner } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, bio = ?, location = ?, website = ?, avatar = COALESCE(?, avatar), banner = COALESCE(?, banner)
      WHERE id = ?
    `).run(
      name.trim(),
      bio ? bio.trim() : '',
      location ? location.trim() : '',
      website ? website.trim() : '',
      avatar && avatar.trim() ? avatar.trim() : null,
      banner && banner.trim() ? banner.trim() : null,
      userId
    );

    const updatedUser = db.prepare(`
      SELECT id, username, email, name, bio, avatar, banner, location, website, verified, created_at
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      message: 'Profile updated successfully!',
      user: {
        ...updatedUser,
        verified: Boolean(updatedUser.verified)
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET /api/users/search - Search users
router.get('/search/query', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ users: [] });
    }

    const term = `%${q.trim().toLowerCase()}%`;
    const users = db.prepare(`
      SELECT id, username, name, bio, avatar, verified
      FROM users
      WHERE lower(username) LIKE ? OR lower(name) LIKE ?
      LIMIT 10
    `).all(term, term);

    res.json({
      users: users.map(u => ({ ...u, verified: Boolean(u.verified) }))
    });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Failed to search users.' });
  }
});

module.exports = router;
