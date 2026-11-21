const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, name, avatar, bio } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 25) {
      return res.status(400).json({ error: 'Username must be between 3 and 25 characters (letters, numbers, underscores).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
      }
      return res.status(400).json({ error: 'Email is already registered. Please sign in instead.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    // Default avatars
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    ];
    const finalAvatar = (avatar && avatar.trim()) ? avatar.trim() : defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    const finalBio = (bio && bio.trim()) ? bio.trim() : 'Hey there! I am excited to connect on Haven.';

    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, name, avatar, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanUsername, cleanEmail, password_hash, cleanName, finalAvatar, finalBio);

    const user = db.prepare(`
      SELECT id, username, email, name, bio, avatar, banner, location, website, verified, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = generateToken(user);

    // Set cookie for 30 days
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body; // username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your username/email and password.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users WHERE lower(username) = ? OR lower(email) = ?
    `).get(cleanId, cleanId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      banner: user.banner,
      location: user.location,
      website: user.website,
      verified: user.verified,
      created_at: user.created_at
    };

    const token = generateToken(safeUser);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      message: 'Welcome back!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error. Please try again.' });
  }
});

// Demo Login (Instant One-Click Login for effortless testing and evaluation)
router.post('/demo', (req, res) => {
  try {
    const targetUsername = req.body.username || 'demo_user';
    const user = db.prepare(`
      SELECT id, username, email, name, bio, avatar, banner, location, website, verified, created_at
      FROM users WHERE username = ?
    `).get(targetUsername);

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found.' });
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      message: `Signed in as @${user.username}`,
      token,
      user
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Failed to authenticate demo user.' });
  }
});

// Get current user profile + counts
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM likes WHERE user_id = ?) as likes_count
    `).get(user.id, user.id, user.id, user.id);

    res.json({
      user: {
        ...user,
        stats
      }
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Signed out successfully.' });
});

module.exports = router;
