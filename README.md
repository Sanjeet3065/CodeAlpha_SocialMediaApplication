# ✦ Haven — Social Media Application

[![CodeAlpha Internship](https://img.shields.io/badge/CodeAlpha-Internship%20Task-orange?style=for-the-badge)](https://www.linkedin.com/company/codealpha/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.0-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-blue?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%26%20CSS3-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/)

A production-grade, highly responsive, bespoke social media application built for the **CodeAlpha Internship**. Designed from the ground up to eliminate generic AI templates in favor of a handcrafted, consumer-grade experience inspired by Kinfolk, Monocle, Substack, and Linear.

---

## 🌟 Key Features & Highlights

### 1. 🔐 Instagram-Style Persistent Authentication
- **Account Creation & Sign In**: Users can register with their Full Name, Username, Email, Password, Bio, and custom profile photo.
- **Session Persistence**: Sessions persist across browser and tab restarts using JWT tokens with 30-day validity and SQLite database verification (`/api/auth/me`).
- **Sign Out**: Clean logout support from both the left sidebar user pill and profile header.
- **1-Click Persona Switcher**: Instant evaluation buttons to switch seamlessly between 5 pre-seeded creators (`@alex_design`, `@priya_codes`, `@marcus_lens`, `@elena_ai`, `@demo_user`).

### 2. 💬 1-on-1 Direct Messaging (DMs & Real-Time Chat)
- **Direct Profile Messaging**: Click **"💬 Message"** on any user's profile to open a 1-on-1 conversation immediately.
- **Dedicated Messages Hub**: Accessible from the left sidebar, header icon, and mobile bottom bar.
- **Conversation Threads**: Unread count badges, live online indicators (green status dots), and last-message snippets.
- **Active Chat Window**:
  - Sent bubbles (warm accent background, right-aligned) and Received bubbles (neutral card background, left-aligned) with relative timestamps.
  - Quick emoji reaction chips (`✦`, `☕`, `🚀`, `❤️`, `✨`).
  - Instant optimistic bubble append with Web Audio synthesizer feedback.

### 3. 👤 Profile Studio & Resonance Karma
- **Profile Picture & Avatar Editing**:
  - Direct hover camera overlay (**📷 Change**) for 1-click photo updates.
  - File upload from PC (`.png`, `.jpg`, `.webp`) via Multer.
  - Curated aesthetic preset avatar selector.
- **Cover Banner Customization**: Upload custom banners or select high-resolution presets.
- **Resonance Score (`✦ Resonance`)**: Displays the user's total appreciation karma across all published thoughts.
- **Followers & Following Modals**: Inspect followers/following lists with one-tap follow toggles.

### 4. 📊 Interactive Community Polls
- Post cards render real-time interactive polls.
- Users can click on poll options to vote; animated progress bars update instantly with live percentage and total count.
- Post composer includes a collapsible poll builder (`📊 Add Poll`).

### 5. 📸 24-Hour Moments & Stories
- Animated gradient story rings around user avatars in the stories carousel.
- Full-screen timed progress bar story viewer modal with tap-to-advance and reply dock.

### 6. ❤️ Micro-Interactions & Audio Feedback
- **Double-Tap to Like**: Double-clicking post media displays a spring burst heart animation.
- **Hover Reaction Dock**: 5 expressive reaction options (`❤️ Love`, `🔥 Fire`, `🤯 Mindblown`, `🚀 Rocket`, `👏 Claps`).
- **Synthesized Haptic Audio**: Lightweight Web Audio API oscillator pop & swoosh sound effects (zero external audio files needed; includes mute toggle).
- **Linear/Apple Style Capsule HUD**: Non-intrusive bottom centered pill for notifications and feedback.

### 7. 🎨 100% Non-Dark, Non-Navy Bespoke Palettes
Handcrafted editorial themes (zero cyberpunk blues or pitch-black dark mode):
1. **Terracotta Cream** — Warm Mediterranean linen & terracotta sienna
2. **Nordic Forest Sage** — Botanical evergreen & mist
3. **Sandstone Ochre** — Warm desert linen & golden ochre
4. **Velvet Rosewood** — Sunset cashmere & rosewood

---

## 📱 Cross-Device Responsive Layout
| Device | Screen Width | Layout Behavior |
|---|---|---|
| **Mobile** | `< 768px` | Full fluid feed, bottom dock with center `(+)` CTA, full-screen chat drawer |
| **Tablet** | `768px - 1000px` | 74px left icon rail, expanded feed, collapsible search |
| **Laptop** | `1000px - 1280px` | Smart 3-column layout (74px rail + 600px feed + 276px right sidebar) |
| **Desktop** | `> 1280px` | Full 260px left sidebar, 640px center feed, 320px right sidebar |

---

## 🛠️ Tech Stack & Architecture

```
social-media-application/
├── db/
│   ├── index.js            # SQLite database schema, WAL mode & realistic seeds
│   └── social.db           # SQLite database file
├── middleware/
│   └── auth.js             # JWT authentication & session verification
├── public/
│   ├── css/
│   │   ├── animations.css  # Micro-animations & keyframes
│   │   └── style.css       # Fluid responsive styles & theme tokens
│   ├── js/
│   │   ├── api.js          # REST client methods (auth, posts, messages, etc.)
│   │   ├── app.js          # Main application controller & event routing
│   │   ├── components.js   # Dynamic UI component renderers & Web Audio
│   │   └── state.js        # Reactive central state store
│   └── index.html          # Semantic HTML5 single-page application structure
├── routes/
│   ├── auth.js             # User registration, login, demo switch & session check
│   ├── comments.js         # Threaded comments
│   ├── messages.js         # Direct 1-on-1 messaging & conversations
│   ├── notifications.js    # Activity notifications & unread counts
│   ├── posts.js            # Feed generation, post creation, polls & reactions
│   ├── stories.js          # Stories & moments
│   ├── upload.js           # Multer file upload & presets
│   └── users.js            # Profiles, follow system & search
├── package.json
└── server.js               # Express application entrypoint
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Sign in with username/email & password |
| `GET` | `/api/auth/me` | Verify active session from JWT |
| `POST` | `/api/auth/demo` | 1-Click login as demo user |
| `GET` | `/api/posts` | Fetch paginated feed (`for_you`, `following`, `bookmarks`) |
| `POST` | `/api/posts` | Create new post with image & optional poll |
| `POST` | `/api/posts/:id/like` | Toggle like or reaction (`heart`, `fire`, `rocket`, etc.) |
| `POST` | `/api/posts/:id/poll-vote` | Cast vote on post poll |
| `GET` | `/api/messages/conversations` | Get active message conversation threads |
| `GET` | `/api/messages/:userId` | Get chat history with specific user |
| `POST` | `/api/messages/:userId` | Send 1-on-1 direct message |
| `GET` | `/api/users/profile/:username` | Get user profile with stats & resonance score |
| `PUT` | `/api/users/profile` | Update user name, bio, avatar, banner, website |
| `POST` | `/api/upload/image` | Upload local file (`.png`, `.jpg`, `.webp`) |

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- npm (comes bundled with Node.js)

### Installation & Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/CodeAlpha_SocialMediaApp.git
   cd CodeAlpha_SocialMediaApp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Navigate to:
   ```
   http://localhost:3000
   ```

---

## 👨‍💻 Author & Acknowledgements
- **Developer**: Sanjeet Chauhan
- **Program**: CodeAlpha Web Development Internship
- **Task**: Task 2 — Social Media Application
