const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Extract hashtags from content
function extractHashtags(text) {
  if (!text) return '';
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return '';
  const tags = matches.map(t => t.replace('#', '').trim()).filter(Boolean);
  return Array.from(new Set(tags)).join(',');
}

// GET /api/posts - Flexible feed query
router.get('/', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const { feed = 'for_you', username, tag, search, limit = 30, offset = 0 } = req.query;

    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
    const numOffset = Math.max(parseInt(offset, 10) || 0, 0);

    let whereClauses = [];
    let params = [];

    // Filter by specific feed tab
    if (feed === 'following') {
      if (!currentUserId) {
        return res.status(401).json({ error: 'Please sign in to view your following feed.' });
      }
      whereClauses.push('p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)');
      params.push(currentUserId);
    } else if (feed === 'bookmarks') {
      if (!currentUserId) {
        return res.status(401).json({ error: 'Please sign in to view saved bookmarks.' });
      }
      whereClauses.push('p.id IN (SELECT post_id FROM bookmarks WHERE user_id = ?)');
      params.push(currentUserId);
    }

    // Filter by username
    if (username) {
      whereClauses.push('lower(u.username) = lower(?)');
      params.push(username);
    }

    // Filter by tag
    if (tag) {
      whereClauses.push('(lower(p.tags) LIKE lower(?) OR lower(p.content) LIKE lower(?))');
      params.push(`%${tag}%`, `%#${tag}%`);
    }

    // Filter by general search keyword
    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(lower(p.content) LIKE ? OR lower(u.name) LIKE ? OR lower(u.username) LIKE ? OR lower(p.tags) LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderSql = feed === 'trending'
      ? 'ORDER BY likes_count DESC, views_count DESC, p.created_at DESC'
      : 'ORDER BY p.created_at DESC';

    const query = `
      SELECT
        p.id,
        p.content,
        p.image_url,
        p.tags,
        p.views_count,
        p.poll_data,
        p.created_at,
        u.id as author_id,
        u.username as author_username,
        u.name as author_name,
        u.avatar as author_avatar,
        u.verified as author_verified,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT reaction FROM likes WHERE post_id = p.id AND user_id = ? LIMIT 1) as my_reaction,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) THEN 1 ELSE 0 END as is_liked,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) THEN 1 ELSE 0 END as is_bookmarked,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) THEN 1 ELSE 0 END as is_following_author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `;

    const fullParams = [
      currentUserId,
      currentUserId, currentUserId,
      currentUserId, currentUserId,
      currentUserId, currentUserId,
      ...params,
      numLimit,
      numOffset
    ];

    const posts = db.prepare(query).all(...fullParams);

    // Format nicely
    const formatted = posts.map(row => {
      let poll = null;
      if (row.poll_data) {
        try { poll = JSON.parse(row.poll_data); } catch (e) {}
      }

      return {
        id: row.id,
        content: row.content,
        image_url: row.image_url,
        tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
        views_count: row.views_count || 1200,
        poll: poll,
        created_at: row.created_at,
        likes_count: row.likes_count,
        my_reaction: row.my_reaction || (row.is_liked ? 'heart' : null),
        comments_count: row.comments_count,
        is_liked: Boolean(row.is_liked),
        is_bookmarked: Boolean(row.is_bookmarked),
        is_following_author: Boolean(row.is_following_author),
        author: {
          id: row.author_id,
          username: row.author_username,
          name: row.author_name,
          avatar: row.author_avatar,
          verified: Boolean(row.author_verified)
        }
      };
    });

    res.json({
      posts: formatted,
      count: formatted.length,
      has_more: formatted.length === numLimit
    });
  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ error: 'Failed to load posts.' });
  }
});

// GET /api/posts/trending/tags - Trending hashtags (Fixed SQLite single quotes issue)
router.get('/trending/tags', (req, res) => {
  try {
    const posts = db.prepare("SELECT tags FROM posts WHERE tags IS NOT NULL AND length(tags) > 0").all();
    const tagCount = {};

    posts.forEach(p => {
      if (!p.tags) return;
      p.tags.split(',').forEach(tag => {
        const clean = tag.trim();
        if (clean) {
          tagCount[clean] = (tagCount[clean] || 0) + 1;
        }
      });
    });

    const sortedTags = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({ tags: sortedTags });
  } catch (err) {
    console.error('Trending tags error:', err);
    res.status(500).json({ error: 'Failed to load trending topics.' });
  }
});

// GET /api/posts/:id - Single post
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const postId = parseInt(req.params.id, 10);

    const query = `
      SELECT
        p.id,
        p.content,
        p.image_url,
        p.tags,
        p.views_count,
        p.poll_data,
        p.created_at,
        u.id as author_id,
        u.username as author_username,
        u.name as author_name,
        u.avatar as author_avatar,
        u.verified as author_verified,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT reaction FROM likes WHERE post_id = p.id AND user_id = ? LIMIT 1) as my_reaction,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) THEN 1 ELSE 0 END as is_liked,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) THEN 1 ELSE 0 END as is_bookmarked,
        CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) THEN 1 ELSE 0 END as is_following_author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    const row = db.prepare(query).get(
      currentUserId,
      currentUserId, currentUserId,
      currentUserId, currentUserId,
      currentUserId, currentUserId,
      postId
    );

    if (!row) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    let poll = null;
    if (row.poll_data) {
      try { poll = JSON.parse(row.poll_data); } catch (e) {}
    }

    res.json({
      post: {
        id: row.id,
        content: row.content,
        image_url: row.image_url,
        tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
        views_count: row.views_count,
        poll: poll,
        created_at: row.created_at,
        likes_count: row.likes_count,
        my_reaction: row.my_reaction || (row.is_liked ? 'heart' : null),
        comments_count: row.comments_count,
        is_liked: Boolean(row.is_liked),
        is_bookmarked: Boolean(row.is_bookmarked),
        is_following_author: Boolean(row.is_following_author),
        author: {
          id: row.author_id,
          username: row.author_username,
          name: row.author_name,
          avatar: row.author_avatar,
          verified: Boolean(row.author_verified)
        }
      }
    });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Failed to retrieve post.' });
  }
});

// POST /api/posts - Create new post (supports optional poll!)
router.post('/', requireAuth, (req, res) => {
  try {
    const { content, image_url, tags, poll } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ error: 'Post exceeds 1000 characters limit.' });
    }

    const autoTags = extractHashtags(content);
    const combinedTags = [tags || '', autoTags].filter(Boolean).join(',');
    const uniqueTags = Array.from(new Set(combinedTags.split(',').map(t => t.trim()).filter(Boolean))).join(',');

    const cleanImageUrl = image_url && image_url.trim() ? image_url.trim() : null;

    let pollJson = null;
    if (poll && poll.question && Array.isArray(poll.options) && poll.options.length >= 2) {
      pollJson = JSON.stringify({
        question: poll.question.trim(),
        options: poll.options.map(opt => ({ text: opt.trim(), votes: 0 })),
        total_votes: 0,
        user_voted: null
      });
    }

    const result = db.prepare(`
      INSERT INTO posts (user_id, content, image_url, tags, poll_data, views_count)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(req.user.id, content.trim(), cleanImageUrl, uniqueTags, pollJson);

    const newPostId = Number(result.lastInsertRowid);

    const newPost = {
      id: newPostId,
      content: content.trim(),
      image_url: cleanImageUrl,
      tags: uniqueTags ? uniqueTags.split(',') : [],
      views_count: 1,
      poll: pollJson ? JSON.parse(pollJson) : null,
      created_at: new Date().toISOString(),
      likes_count: 0,
      my_reaction: null,
      comments_count: 0,
      is_liked: false,
      is_bookmarked: false,
      is_following_author: false,
      author: {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        avatar: req.user.avatar,
        verified: Boolean(req.user.verified)
      }
    };

    res.status(201).json({
      message: 'Post published successfully!',
      post: newPost
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to publish post.' });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ message: 'Post deleted successfully.', postId });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// POST /api/posts/:id/like - Toggle like or emoji reaction
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const reaction = req.body.reaction || 'heart';

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const existingLike = db.prepare('SELECT id, reaction FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);

    let liked = false;
    let currentReaction = null;

    if (existingLike) {
      if (req.body.reaction && existingLike.reaction !== reaction) {
        // Change reaction
        db.prepare('UPDATE likes SET reaction = ? WHERE user_id = ? AND post_id = ?').run(reaction, userId, postId);
        liked = true;
        currentReaction = reaction;
      } else {
        // Remove like
        db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
        liked = false;
        currentReaction = null;
      }
    } else {
      // Add like
      db.prepare('INSERT INTO likes (user_id, post_id, reaction) VALUES (?, ?, ?)').run(userId, postId, reaction);
      liked = true;
      currentReaction = reaction;

      // Add notification to post author if not self
      if (post.user_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (user_id, actor_id, type, content, target_id)
          VALUES (?, ?, 'like', 'liked your post', ?)
        `).run(post.user_id, userId, postId);
      }
    }

    const likesCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId).count;

    res.json({
      liked,
      reaction: currentReaction,
      likes_count: likesCount,
      postId
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Failed to update like status.' });
  }
});

// POST /api/posts/:id/poll-vote - Vote on a poll option
router.post('/:id/poll-vote', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { optionIndex } = req.body;

    const post = db.prepare('SELECT poll_data FROM posts WHERE id = ?').get(postId);
    if (!post || !post.poll_data) {
      return res.status(404).json({ error: 'Poll not found for this post.' });
    }

    const poll = JSON.parse(post.poll_data);
    const idx = parseInt(optionIndex, 10);

    if (isNaN(idx) || idx < 0 || idx >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid poll option.' });
    }

    // Increment vote
    poll.options[idx].votes = (poll.options[idx].votes || 0) + 1;
    poll.total_votes = (poll.total_votes || 0) + 1;
    poll.user_voted = idx;

    db.prepare('UPDATE posts SET poll_data = ? WHERE id = ?').run(JSON.stringify(poll), postId);

    res.json({
      message: 'Vote recorded!',
      poll
    });
  } catch (err) {
    console.error('Poll vote error:', err);
    res.status(500).json({ error: 'Failed to register vote.' });
  }
});

// POST /api/posts/:id/bookmark - Toggle bookmark
router.post('/:id/bookmark', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(userId, postId);

    let bookmarked = false;
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').run(userId, postId);
      bookmarked = false;
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').run(userId, postId);
      bookmarked = true;
    }

    res.json({
      bookmarked,
      postId
    });
  } catch (err) {
    console.error('Bookmark error:', err);
    res.status(500).json({ error: 'Failed to update bookmark.' });
  }
});

module.exports = router;
