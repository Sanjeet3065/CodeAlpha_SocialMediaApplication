const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/comments/post/:postId - Get all comments for a post
router.get('/post/:postId', (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);

    const comments = db.prepare(`
      SELECT
        c.id,
        c.post_id,
        c.content,
        c.created_at,
        u.id as author_id,
        u.username as author_username,
        u.name as author_name,
        u.avatar as author_avatar,
        u.verified as author_verified
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    const formatted = comments.map(c => ({
      id: c.id,
      post_id: c.post_id,
      content: c.content,
      created_at: c.created_at,
      author: {
        id: c.author_id,
        username: c.author_username,
        name: c.author_name,
        avatar: c.author_avatar,
        verified: Boolean(c.author_verified)
      }
    }));

    res.json({ comments: formatted });
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Failed to load comments.' });
  }
});

// POST /api/comments/post/:postId - Add a new comment
router.post('/post/:postId', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Comment exceeds 500 characters limit.' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const result = db.prepare(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(postId, req.user.id, content.trim());

    const newCommentId = Number(result.lastInsertRowid);
    const commentCount = db.prepare('SELECT COUNT(*) as c FROM comments WHERE post_id = ?').get(postId).c;

    const newComment = {
      id: newCommentId,
      post_id: postId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      author: {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        avatar: req.user.avatar,
        verified: Boolean(req.user.verified)
      }
    };

    res.status(201).json({
      message: 'Comment added.',
      comment: newComment,
      comments_count: commentCount
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// DELETE /api/comments/:id - Delete a comment
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const comment = db.prepare(`
      SELECT c.id, c.user_id, c.post_id, p.user_id as post_author_id
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ?
    `).get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Only comment author OR post owner can delete
    if (comment.user_id !== req.user.id && comment.post_author_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not allowed to delete this comment.' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    const commentCount = db.prepare('SELECT COUNT(*) as c FROM comments WHERE post_id = ?').get(comment.post_id).c;

    res.json({
      message: 'Comment removed.',
      commentId,
      postId: comment.post_id,
      comments_count: commentCount
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

module.exports = router;
