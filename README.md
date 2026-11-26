# ✦ Haven — Thoughtful Social Space

[![Live Demo](https://img.shields.io/badge/Live%20Demo-haven--social--app.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=111827)](https://haven-social-app.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-CodeAlpha__SocialMediaApplication-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication)
[![CodeAlpha Internship](https://img.shields.io/badge/CodeAlpha-Internship%20Task%202-FF6B35?style=for-the-badge)](https://www.linkedin.com/company/codealpha/)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.3-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%26%20CSS3-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./package.json)

A full-stack, responsive social media platform built for the **CodeAlpha Web Development Internship (Task 2)**. Crafted from the ground up with Express.js, SQLite (WAL mode), and Vanilla HTML5/CSS3/JS, **Haven** replaces dark/generic templates with warm, editorial aesthetics inspired by Kinfolk, Monocle, Substack, and Linear.

---

## 🔗 Live Demo & Repository Links

| Resource | Icon Badge | Direct Link |
|---|---|---|
| **Live Deployment (Render)** | [![Live App](https://img.shields.io/badge/Live%20App-Open%20Haven-46E3B7?style=for-the-badge&logo=render&logoColor=111827)](https://haven-social-app.onrender.com) | 🌐 [https://haven-social-app.onrender.com](https://haven-social-app.onrender.com) |
| **Source Code (GitHub)** | [![GitHub Repo](https://img.shields.io/badge/GitHub-View%20Source-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication) | 💻 [https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication](https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication) |

> **Tip:** Since the live demo runs on Render's free tier, the very first request after inactivity may take a few seconds while the server wakes up.

---

## 🌟 Key Features & Highlights

### 1. 🔐 Persistent Authentication & 1-Click Persona Switcher
- **Account Registration & Login**: Register with Full Name, Username, Email, Password, Bio, and custom avatar upload or preset selection.
- **30-Day Session Persistence**: JWT tokens stored via Bearer authorization and `httpOnly` cookies (`token`), verified against SQLite (`GET /api/auth/me`).
- **Sign Out**: Clean logout from both the left sidebar user card and profile header.
- **1-Click Persona Switcher**: Instantly switch between seeded creator personas in the right sidebar (`@alex_design`, `@priya_codes`, `@marcus_lens`, `@elena_ai`, `@demo_user`, plus `@sam_hacker` in the database; seeded demo password: `password123`).

### 2. 📝 Thought Composer, Feeds & Smart Discovery
- **Three Curated Feed Tabs**: Switch between **For You**, **Following**, and **🔥 Trending** (plus dedicated **Bookmarks**).
- **Rich Post Composer**:
  - 1,000-character limit with live circular SVG progress gauge.
  - **Mood & Vibe Selector**: `💡 Idea`, `☕ Chill`, `🎨 Design`, `🚀 Shipped`, `🌿 Mindful`, `📚 Reading`.
  - **Quick Hashtag Chips & Auto-Extraction**: Clickable tags (`#UIUX`, `#WebDesign`, `#Architecture`, `#BuildInPublic`, `#AI`) and automatic `#hashtag` indexing.
  - **Media Attachments**: Upload local images via Multer (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` up to `5 MB`) or choose from curated stock presets.
  - **Collapsible Poll Builder**: Attach interactive multi-option polls directly to any post.
- **Live Search & Trending Topics**: Real-time search across users, posts, and hashtags (`/` shortcut) plus trending hashtag filtering.

### 3. 💬 1-on-1 Direct Messaging
- **Direct Profile Messaging**: Click **Message** on any user's profile to jump straight into a 1-on-1 conversation.
- **Dedicated Messages Hub**: Accessible from the left sidebar, top header icon, and mobile bottom dock.
- **Thread Management**: Conversation list sorted by recent activity, unread count badges, suggested creators shelf, and automatic read-state updates.
- **Interactive Chat Window**: Distinct sent/received bubbles, relative timestamps, quick emoji chips (`✦`, `☕`, `🚀`, `❤️`, `✨`), and instant message updates.

### 4. 👤 Profile Studio & `✦ Resonance` Score
- **Avatar & Cover Banner Customization**: Upload custom images from your computer or choose curated aesthetic presets.
- **Profile Editing**: Update display name, bio, location, and website URL.
- **`✦ Resonance` Score**: Displays total appreciation (likes & reactions) received across all published posts.
- **Followers & Following Modals**: Browse followers and following lists with instant follow/unfollow toggles.

### 5. 📊 Interactive Polls & 📸 Stories / Moments
- **Real-Time Community Polls**: Vote directly inside feed cards with animated percentage bars and total vote counters.
- **Stories / Moments Carousel**: User-grouped story rings with an interactive story viewer modal and fast reactions.

### 6. ❤️ Micro-Interactions, Threaded Comments & Audio Feedback
- **Expressive Reaction Dock**: Hover/select from 5 reactions (`❤️ Heart`, `🔥 Fire`, `🚀 Rocket`, `🤯 Mindblown`, `👏 Clap`) or double-tap post images to like.
- **Threaded Comments & Notifications**: Add/delete comments and track likes, messages, comments, and follows in the slide-over notifications drawer.
- **Reading Time & Lightbox**: Automatic estimated reading time badge on longer posts and full-screen image lightbox modal.
- **Synthesized Web Audio Feedback**: Zero-asset Web Audio API `AudioContext` pop and swoosh sound effects with a mute toggle (`🔊` / `🔇`).

### 7. 🎨 4 Bespoke Non-Dark, Non-Navy Editorial Themes
Handcrafted light editorial color systems persisted in `localStorage`:
1. **Terracotta Cream** (`cream`) — Warm Mediterranean linen & terracotta sienna
2. **Nordic Forest Sage** (`sage`) — Botanical evergreen & mist
3. **Sandstone Ochre** (`sandstone`) — Warm desert linen & caramel ochre
4. **Velvet Rosewood** (`rosewood`) — Sunset cashmere & rosewood

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `N` | Focus post composer & scroll to top |
| `T` | Cycle through the 4 editorial color themes |
| `/` | Focus search input |
| `Esc` | Close active modals, notifications drawer, or lightbox |
| `?` | Open Keyboard Shortcuts help modal |

---

## 📱 Cross-Device Responsive Layout

Verified breakpoints in [style.css](public/css/style.css):

| Breakpoint | Screen Width | Layout Behavior |
|---|---|---|
| **Mobile** | `≤ 768px` | Full `100vw` fluid feed, mobile brand pill, 5-item bottom navigation dock with center `(+)` CTA |
| **Portrait Tablet** | `769px – 999px` | `76px` compact left icon rail + centered feed (`max-width: 720px`); right sidebar hidden |
| **Compact Laptop** | `1000px – 1200px` | `74px` left icon rail + fluid feed (`max-width: 600px`) + `276px` right sidebar |
| **Desktop** | `> 1200px` | Full 3-column layout (`210px–250px` left sidebar, up to `660px` feed, `260px–320px` right sidebar) |

---

## 🛠️ Tech Stack & Project Structure

| Layer | Technology |
|---|---|
| **Backend Runtime** | Node.js (CommonJS) & Express.js (`^5.3.0`) |
| **Database** | SQLite via `better-sqlite3` (`^13.2.0`) with foreign keys & WAL mode enabled |
| **Authentication** | `jsonwebtoken` (`^9.0.3`) + `bcryptjs` (`^3.0.3`) + `cookie-parser` |
| **File Uploads** | `multer` (`^2.5.0`) storing uploaded assets under `public/uploads/` |
| **Frontend** | Semantic HTML5, modular CSS3 design tokens & animations, Vanilla JavaScript |
| **Deployment** | Render Web Service Blueprint (`render.yaml`) |

```text
CodeAlpha_SocialMediaApplication/
├── db/
│   ├── index.js            # SQLite schema initialization, WAL mode & realistic seed data
│   └── social.db           # SQLite database file
├── middleware/
│   └── auth.js             # JWT generation, requireAuth & optionalAuth middleware
├── public/
│   ├── css/
│   │   ├── animations.css  # Micro-animations & keyframes
│   │   └── style.css       # Editorial themes, 3-column layout & responsive breakpoints
│   ├── js/
│   │   ├── api.js          # Fetch wrapper & REST API client methods
│   │   ├── app.js          # App controller, routing, theme switcher & shortcuts
│   │   ├── components.js   # UI component renderers & Web Audio feedback
│   │   └── state.js        # Central reactive state store
│   ├── uploads/            # Uploaded user/post images served at /uploads
│   └── index.html          # Single-page application shell
├── routes/
│   ├── auth.js             # Register, login, 1-click demo login, session check & logout
│   ├── comments.js         # Post comments CRUD
│   ├── messages.js         # Conversations, DM threads, send & read status
│   ├── notifications.js    # Activity notifications & mark-all-read
│   ├── posts.js            # Feeds, post creation/deletion, reactions, polls & bookmarks
│   ├── stories.js          # Stories feed & creation
│   ├── upload.js           # Multer image uploads & curated stock presets
│   └── users.js            # Profiles, follow system, suggestions & user search
├── .gitignore
├── package.json
├── README.md
├── render.yaml             # Render 1-click deployment blueprint
└── server.js               # Express application entrypoint
```

---

## 🔌 API Endpoints Reference

### Health & Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server health check & metadata |
| `POST` | `/api/auth/register` | Public | Create new user account |
| `POST` | `/api/auth/login` | Public | Sign in with username or email & password |
| `POST` | `/api/auth/demo` | Public | 1-click sign-in as a seeded demo user |
| `GET` | `/api/auth/me` | Required | Verify active JWT session & profile counts |
| `POST` | `/api/auth/logout` | Public | Clear session auth cookie |

### Posts, Polls & Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/posts` | Optional | Fetch feed (`for_you`, `following`, `trending`, `bookmarks`) with search/tag/pagination |
| `GET` | `/api/posts/trending/tags` | Public | Top trending hashtags |
| `GET` | `/api/posts/:id` | Optional | Fetch single post details |
| `POST` | `/api/posts` | Required | Create a post with optional image & poll |
| `DELETE` | `/api/posts/:id` | Required | Delete own post |
| `POST` | `/api/posts/:id/like` | Required | Toggle like or pick reaction (`heart`, `fire`, `rocket`, `brain`, `clap`) |
| `POST` | `/api/posts/:id/poll-vote` | Required | Cast a vote on a post poll |
| `POST` | `/api/posts/:id/bookmark` | Required | Toggle bookmark on a post |
| `GET` | `/api/comments/post/:postId` | Public | List comments for a post |
| `POST` | `/api/comments/post/:postId` | Required | Add a comment (max 500 chars) |
| `DELETE` | `/api/comments/:id` | Required | Delete comment (comment author or post owner) |

### Users, Stories, Messages, Notifications & Uploads
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/profile/:username` | Optional | Fetch user profile, stats & follow state |
| `PUT` | `/api/users/profile` | Required | Update name, bio, location, website, avatar & banner |
| `POST` | `/api/users/:id/follow` | Required | Toggle follow/unfollow for a user |
| `GET` | `/api/users/:id/followers` | Optional | List a user's followers |
| `GET` | `/api/users/:id/following` | Optional | List users followed by a user |
| `GET` | `/api/users/suggested/list` | Optional | Suggested creators to follow |
| `GET` | `/api/users/search/query` | Public | Search users by username or name (`?q=...`) |
| `GET` | `/api/stories` | Optional | Fetch stories grouped by user |
| `POST` | `/api/stories` | Required | Publish a new story |
| `GET` | `/api/messages/conversations` | Required | List active DM threads & suggested users |
| `GET` | `/api/messages/:userId` | Required | Get chat history with a user & mark incoming as read |
| `POST` | `/api/messages/:userId` | Required | Send a 1-on-1 direct message |
| `POST` | `/api/messages/read/:userId` | Required | Mark a thread as read |
| `GET` | `/api/notifications` | Required | List recent notifications & unread count |
| `POST` | `/api/notifications/read-all` | Required | Mark all notifications as read |
| `POST` | `/api/upload/image` | Required | Upload local image (JPEG/PNG/WEBP/GIF, max 5 MB) |
| `GET` | `/api/upload/presets` | Public | Retrieve curated stock photo presets |

---

## ⚡ Quick Start Guide (Local Setup)

### Try Online First
Skip setup and explore the live app directly:
- [![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=flat-square&logo=render&logoColor=111827)](https://haven-social-app.onrender.com) — 🌐 [https://haven-social-app.onrender.com](https://haven-social-app.onrender.com)

### Prerequisites
- [Node.js](https://nodejs.org/) (`v18+` recommended; `npm run dev` uses `node --watch`)
- `npm` (bundled with Node.js)

### Installation & Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication.git
   cd CodeAlpha_SocialMediaApplication
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application**:
   ```bash
   # Production mode
   npm start

   # Development mode (auto-restarts on file changes)
   npm run dev
   ```

4. **Open in Browser**:
   ```text
   http://localhost:3000
   ```

### Optional Environment Variables
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for the Express HTTP server |
| `JWT_SECRET` | Built-in dev fallback | Secret key used to sign/verify 30-day JWTs (set a strong secret in production) |
| `NODE_ENV` | — | Runtime environment (`production` in `render.yaml`) |

---

## ☁️ Deployment

This repository includes a [`render.yaml`](render.yaml) blueprint configured for 1-click deployment on **Render** (`npm install` build command, `node server.js` start command, `NODE_ENV=production`).

- **Deployed URL**: [https://haven-social-app.onrender.com](https://haven-social-app.onrender.com)

---

## 👨‍💻 Author & Acknowledgements

- **Developer**: Sanjeet Chauhan
- **Program**: CodeAlpha Web Development Internship — Task 2 (Social Media Application)
- **License**: MIT ([`package.json`](package.json))

<p align="left">
  <a href="https://haven-social-app.onrender.com">
    <img src="https://img.shields.io/badge/Live%20Demo-haven--social--app.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=111827" alt="Live Demo" />
  </a>
  <a href="https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication">
    <img src="https://img.shields.io/badge/GitHub-Sanjeet3065%2FCodeAlpha__SocialMediaApplication-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
</p>

- 🌐 **Live Demo**: [https://haven-social-app.onrender.com](https://haven-social-app.onrender.com)
- 💻 **GitHub**: [https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication](https://github.com/Sanjeet3065/CodeAlpha_SocialMediaApplication)
