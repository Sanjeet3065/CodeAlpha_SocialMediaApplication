const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'social.db');
const db = new Database(dbPath);

// Enable foreign keys & WAL mode for high performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      banner TEXT DEFAULT '',
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      image_url TEXT DEFAULT NULL,
      tags TEXT DEFAULT '',
      views_count INTEGER DEFAULT 1200,
      poll_data TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      reaction TEXT DEFAULT 'heart',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      target_id INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure new columns exist if migrating existing DB
    PRAGMA table_info(posts);
  `);

  // Safe alter table for existing columns if DB already exists
  try { db.exec('ALTER TABLE posts ADD COLUMN views_count INTEGER DEFAULT 1420;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN poll_data TEXT DEFAULT NULL;'); } catch (e) {}
  try { db.exec('ALTER TABLE likes ADD COLUMN reaction TEXT DEFAULT "heart";'); } catch (e) {}

  // Check if messages need seeding
  try {
    const msgCount = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
    if (msgCount === 0) {
      seedMessages();
    }
  } catch (e) {}

  // Check if stories are empty -> seed them
  const storyCount = db.prepare('SELECT COUNT(*) as c FROM stories').get().c;
  if (storyCount === 0) {
    seedStoriesAndNotifications();
  }

  // Check if users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase();
  }
}

function seedStoriesAndNotifications() {
  const users = db.prepare('SELECT id, username FROM users').all();
  const userMap = {};
  users.forEach(u => userMap[u.username] = u.id);

  if (!userMap.alex_design) return;

  const insertStory = db.prepare('INSERT INTO stories (user_id, media_url, caption) VALUES (?, ?, ?)');
  insertStory.run(userMap.alex_design, 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', 'Iterating on the new glass typography tokens ✨');
  insertStory.run(userMap.priya_codes, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', 'Distributed lock benchmark running at 25k req/s! 🚀');
  insertStory.run(userMap.marcus_lens, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', 'Dawn light on brutalist concrete in Berlin 📸');
  insertStory.run(userMap.elena_ai, 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80', 'Evaluating multi-agent cooperative convergence 🔬');
  insertStory.run(userMap.sam_hacker, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80', 'Shipping morning updates from the mountains ☕');

  // Seed Notifications for demo_user
  if (userMap.demo_user) {
    const insertNotif = db.prepare('INSERT INTO notifications (user_id, actor_id, type, content, target_id) VALUES (?, ?, ?, ?, ?)');
    insertNotif.run(userMap.demo_user, userMap.alex_design, 'like', 'liked your post: "Desk setup check for Saturday..."', 1);
    insertNotif.run(userMap.demo_user, userMap.priya_codes, 'follow', 'started following you.', 0);
    insertNotif.run(userMap.demo_user, userMap.marcus_lens, 'comment', 'replied: "Sublime perspective on the concrete forms!"', 3);
    insertNotif.run(userMap.demo_user, userMap.elena_ai, 'like', 'reacted with 🚀 on your thought.', 4);
  }

  // Update a post with an interactive poll for Alex Morgan
  try {
    const alexPost = db.prepare('SELECT id FROM posts WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(userMap.alex_design);
    if (alexPost) {
      const pollJson = JSON.stringify({
        question: 'Which dark mode foundation gives the most premium feel?',
        options: [
          { text: 'Deep Obsidian (#050811)', votes: 142 },
          { text: 'Midnight Slate (#0F172A)', votes: 89 },
          { text: 'Pure OLED Pitch Black (#000000)', votes: 64 }
        ],
        total_votes: 295,
        user_voted: 0
      });
      db.prepare('UPDATE posts SET poll_data = ?, views_count = 8450 WHERE id = ?').run(pollJson, alexPost.id);
    }
  } catch (e) {
    console.error('Poll update error:', e);
  }
}

function seedMessages() {
  const users = db.prepare('SELECT id, username FROM users').all();
  const userMap = {};
  users.forEach(u => userMap[u.username] = u.id);
  if (!userMap.alex_design || !userMap.priya_codes) return;

  const insertMsg = db.prepare('INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?)');

  // Alex Morgan and Priya Sharma
  insertMsg.run(userMap.alex_design, userMap.priya_codes, 'Hey Priya! Loved your architectural update on SQLite WAL mode optimizations ⚡', 1, '2026-11-20 19:15:00');
  insertMsg.run(userMap.priya_codes, userMap.alex_design, 'Thanks Alex! We just hit 25k req/s with 18ms latency. Working on the memory cache layer next 🚀', 1, '2026-11-20 19:22:00');
  insertMsg.run(userMap.alex_design, userMap.priya_codes, 'That is insane throughput! Would love to align our design system tokens with your real-time streaming pipeline ✨', 1, '2026-11-20 19:26:00');
  insertMsg.run(userMap.priya_codes, userMap.alex_design, 'Sounds fantastic. Let me know when you push the new warm theme palette branch.', 0, '2026-11-20 19:30:00');

  // Marcus Vance and Alex Morgan
  if (userMap.marcus_lens) {
    insertMsg.run(userMap.marcus_lens, userMap.alex_design, 'Hey Alex, sent over the high-res architectural renders of the Berlin gallery 🏛️📸', 1, '2026-11-21 02:45:00');
    insertMsg.run(userMap.alex_design, userMap.marcus_lens, 'These angles are breathtaking Marcus. The contrast on the raw concrete is sublime!', 1, '2026-11-21 02:50:00');
  }

  // Elena Rostova and Priya Sharma
  if (userMap.elena_ai) {
    insertMsg.run(userMap.elena_ai, userMap.priya_codes, 'Hi Priya! Curious about your benchmark results for concurrent agent memory persistence 🔬', 1, '2026-11-21 04:35:00');
    insertMsg.run(userMap.priya_codes, userMap.elena_ai, 'Running smoothly with zero lock contention! I will share the repo benchmark link with you.', 0, '2026-11-21 04:40:00');
  }

  // Alex Morgan to demo_user
  if (userMap.demo_user) {
    insertMsg.run(userMap.alex_design, userMap.demo_user, 'Welcome to Haven! Let me know if you have any questions or feedback on the new warm editorial themes ✨', 0, '2026-11-21 07:00:00');
  }
}

function seedDatabase() {
  console.log('🌱 Seeding initial realistic social media data...');
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, name, bio, avatar, banner, location, website, verified, created_at)
    VALUES (@username, @email, @password_hash, @name, @bio, @avatar, @banner, @location, @website, @verified, @created_at)
  `);

  const users = [
    {
      username: 'alex_design',
      email: 'alex@example.com',
      password_hash: defaultPasswordHash,
      name: 'Alex Morgan',
      bio: 'Lead Design Architect @StudioPulse. Obsessed with typography, spatial ergonomics & fluid micro-interactions. 🖤',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      location: 'San Francisco, CA',
      website: 'https://alexdesign.framer.website',
      verified: 1,
      created_at: '2026-01-15 10:00:00'
    },
    {
      username: 'priya_codes',
      email: 'priya@example.com',
      password_hash: defaultPasswordHash,
      name: 'Priya Sharma',
      bio: 'Full-Stack Systems Engineer. Building high-throughput distributed APIs, playing with WebGPU & drinking pour-over coffee ☕',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      location: 'Bengaluru, India',
      website: 'https://priyasharma.dev',
      verified: 1,
      created_at: '2026-02-01 14:20:00'
    },
    {
      username: 'marcus_lens',
      email: 'marcus@example.com',
      password_hash: defaultPasswordHash,
      name: 'Marcus Vance',
      bio: 'Architectural photographer & urban explorer. Documenting brutalist concrete structures across Europe and Asia 🏙️',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      location: 'Berlin, Germany',
      website: 'https://marcusvance.art',
      verified: 0,
      created_at: '2026-02-10 09:30:00'
    },
    {
      username: 'elena_ai',
      email: 'elena@example.com',
      password_hash: defaultPasswordHash,
      name: 'Dr. Elena Rostova',
      bio: 'AI Safety & Multimodal Research Scientist. Exploring autonomous agent swarms and human-centered generative tools. 🔬',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80',
      location: 'Cambridge, MA',
      website: 'https://elena-ai.org',
      verified: 1,
      created_at: '2026-02-18 11:15:00'
    },
    {
      username: 'sam_hacker',
      email: 'sam@example.com',
      password_hash: defaultPasswordHash,
      name: 'Samir Patel',
      bio: 'Indie Maker shipping products in public. Building tools for remote-first creators. Minimalist by choice. ✨',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      location: 'Austin, TX',
      website: 'https://samir.build',
      verified: 0,
      created_at: '2026-03-01 16:45:00'
    },
    {
      username: 'demo_user',
      email: 'demo@pulse.com',
      password_hash: defaultPasswordHash,
      name: 'Jordan Reed',
      bio: 'Creative explorer, product enthusiast and social curator. Testing out Pulse! 👋',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      location: 'New York, NY',
      website: 'https://jordanreed.io',
      verified: 1,
      created_at: '2026-03-05 08:00:00'
    }
  ];

  const userIds = {};
  for (const u of users) {
    const res = insertUser.run(u);
    userIds[u.username] = Number(res.lastInsertRowid);
  }

  // Follow relationships
  const insertFollow = db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)');
  const followPairs = [
    [userIds.demo_user, userIds.alex_design],
    [userIds.demo_user, userIds.priya_codes],
    [userIds.demo_user, userIds.elena_ai],
    [userIds.alex_design, userIds.priya_codes],
    [userIds.alex_design, userIds.marcus_lens],
    [userIds.priya_codes, userIds.alex_design],
    [userIds.priya_codes, userIds.elena_ai],
    [userIds.marcus_lens, userIds.alex_design],
    [userIds.marcus_lens, userIds.sam_hacker],
    [userIds.elena_ai, userIds.priya_codes],
    [userIds.sam_hacker, userIds.alex_design],
    [userIds.sam_hacker, userIds.demo_user]
  ];
  for (const [fId, targetId] of followPairs) {
    insertFollow.run(fId, targetId);
  }

  // Realistic posts
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, image_url, tags, views_count, created_at)
    VALUES (@user_id, @content, @image_url, @tags, @views_count, @created_at)
  `);

  const posts = [
    {
      user_id: userIds.alex_design,
      content: 'Good design is not just what looks sleek—it is how naturally your fingers move and how effortlessly your mind comprehends the system. Working on our new dark mode color harmony tokens today. What do you think about deep obsidian (#050811) vs graphite (#121214)? ✨🎨\n#UIUX #DesignSystems #WebDesign',
      image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80',
      tags: 'UIUX,DesignSystems,WebDesign',
      views_count: 8450,
      created_at: '2026-11-20 18:30:00'
    },
    {
      user_id: userIds.priya_codes,
      content: 'Just migrated our core real-time feed processing from a traditional polling loop to an event-driven SQLite WAL + WebSocket streaming pipeline. Latency dropped from 240ms to 18ms under load! Sometimes simpler architecture wins every single time. ⚡🚀\n#Backend #Engineering #Performance',
      image_url: null,
      tags: 'Backend,Engineering,Performance',
      views_count: 6120,
      created_at: '2026-11-20 20:15:00'
    },
    {
      user_id: userIds.marcus_lens,
      content: 'Golden hour hitting the concrete curves of the Philharmonic Hall in Berlin. The symmetry and tactile textures never fail to inspire me. Shot on Leica M11, 35mm Summicron. 🏛️📸\n#Architecture #Photography #Minimalism',
      image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
      tags: 'Architecture,Photography,Minimalism',
      views_count: 4890,
      created_at: '2026-11-21 02:40:00'
    },
    {
      user_id: userIds.elena_ai,
      content: 'Autonomous coding agents are moving rapidly from single-turn autocomplete to full multi-agent collaborative swarms. The hardest problem remains contextual grounding and human aesthetic alignment. A well-designed user interface creates the trust needed for human-AI teamwork. 🤖💡\n#AI #FutureOfWork #TechTrends',
      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      tags: 'AI,FutureOfWork,TechTrends',
      views_count: 9340,
      created_at: '2026-11-21 04:10:00'
    },
    {
      user_id: userIds.sam_hacker,
      content: 'Shipped v2.0 of my workspace audio tool before morning coffee! 3 rules I learned after 4 years of solo bootstrapping:\n1. Solve a problem you feel every day\n2. Polish the first 30 seconds of user onboarding\n3. Talk to your first 50 users personally\n#BuildInPublic #IndieHacker #Startups',
      image_url: null,
      tags: 'BuildInPublic,IndieHacker,Startups',
      views_count: 5210,
      created_at: '2026-11-21 05:25:00'
    },
    {
      user_id: userIds.alex_design,
      content: 'Desk setup check for Saturday morning creative flow! Clean desk, warm natural light, mechanical keyboard with Kailh tactile switches, and fresh matcha latte. Ready for deep work session. 🌿🖥️\n#Workspace #SetupGoals #Productivity',
      image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80',
      tags: 'Workspace,SetupGoals,Productivity',
      views_count: 7300,
      created_at: '2026-11-21 06:40:00'
    }
  ];

  const postIds = [];
  for (const p of posts) {
    const res = insertPost.run(p);
    postIds.push(Number(res.lastInsertRowid));
  }

  // Likes with reactions
  const insertLike = db.prepare('INSERT INTO likes (user_id, post_id, reaction) VALUES (?, ?, ?)');
  const likePairs = [
    [userIds.demo_user, postIds[0], 'heart'],
    [userIds.demo_user, postIds[2], 'fire'],
    [userIds.demo_user, postIds[3], 'rocket'],
    [userIds.priya_codes, postIds[0], 'heart'],
    [userIds.alex_design, postIds[1], 'rocket'],
    [userIds.marcus_lens, postIds[0], 'fire'],
    [userIds.elena_ai, postIds[1], 'brain'],
    [userIds.sam_hacker, postIds[2], 'clap'],
    [userIds.sam_hacker, postIds[0], 'heart'],
    [userIds.priya_codes, postIds[3], 'rocket']
  ];
  for (const [uId, pId, react] of likePairs) {
    insertLike.run(uId, pId, react);
  }

  // Realistic comments
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const comments = [
    [postIds[0], userIds.priya_codes, 'Definitely deep obsidian (#050811)! It provides that premium OLED contrast without straining the eyes during late night coding.', '2026-11-20 19:00:00'],
    [postIds[0], userIds.sam_hacker, 'Obsidian + subtle iridescent border highlights looks completely futuristic. Love your work Alex!', '2026-11-20 19:45:00'],
    [postIds[1], userIds.alex_design, '18ms is incredible Priya! Are you using memory-mapped I/O or standard WAL checkpoints?', '2026-11-20 20:30:00'],
    [postIds[1], userIds.priya_codes, '@alex_design Standard WAL with synchronous=NORMAL and prepared statements caching! The difference is night and day.', '2026-11-20 20:45:00'],
    [postIds[2], userIds.alex_design, 'That light falloff on the concrete is sublime. Truly poetic composition Marcus.', '2026-11-21 03:00:00'],
    [postIds[3], userIds.priya_codes, 'Contextual grounding is 100% the frontier. When the UI feedback loop is sub-second, it feels like an extension of your own mind.', '2026-11-21 04:30:00']
  ];

  for (const [pId, uId, txt, time] of comments) {
    insertComment.run(pId, uId, txt, time);
  }

  // Bookmarks for demo_user
  const insertBookmark = db.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)');
  insertBookmark.run(userIds.demo_user, postIds[0]);
  insertBookmark.run(userIds.demo_user, postIds[2]);

  seedStoriesAndNotifications();
  console.log('✅ Realistic seed data inserted successfully!');
}

module.exports = {
  db,
  initDatabase,
  seedDatabase
};
