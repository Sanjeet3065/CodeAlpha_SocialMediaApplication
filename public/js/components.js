// Pulse 2.0 UI Components & Renderers
const Components = (() => {

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now - date) / 1000));

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  }

  function highlightHashtags(text) {
    if (!text) return '';
    const safeText = escapeHtml(text);
    return safeText.replace(/#([a-zA-Z0-9_]+)/g, (match, tag) => {
      return `<span class="hashtag-link" data-tag="${tag}">#${tag}</span>`;
    });
  }

  const Icons = {
    verified: `<svg class="badge-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
    views: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    more: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    link: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    calendar: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    globe: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    bell: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`
  };

  // Render Stories Bar HTML
  function renderStoriesBar(storyGroups, currentUser) {
    const userAvatar = currentUser ? currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';

    let html = `
      <div class="story-item" data-action="add-story">
        <div class="story-ring-wrapper" style="background: rgba(255, 255, 255, 0.12);">
          <img src="${escapeHtml(userAvatar)}" alt="Your Story" class="story-ring-avatar" />
          <div class="story-add-badge">+</div>
        </div>
        <span class="story-user-label">Your Story</span>
      </div>
    `;

    storyGroups.forEach((group, index) => {
      html += `
        <div class="story-item" data-action="view-story" data-story-index="${index}">
          <div class="story-ring-wrapper">
            <img src="${escapeHtml(group.user.avatar)}" alt="${escapeHtml(group.user.name)}" class="story-ring-avatar" />
          </div>
          <span class="story-user-label">${escapeHtml(group.user.name.split(' ')[0])}</span>
        </div>
      `;
    });

    return html;
  }

  // Render Post Card HTML
  function renderPostCard(post, currentUser) {
    const isOwner = currentUser && currentUser.id === post.author.id;
    const authorAvatar = post.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
    const relativeTime = formatRelativeTime(post.created_at);
    const wordCount = (post.content || '').trim().split(/\s+/).filter(Boolean).length;
    const readingTime = wordCount >= 25 ? `${Math.ceil(wordCount / 140)}m read` : null;

    // Emoji reaction label map
    const reactionMap = { heart: '❤️', fire: '🔥', rocket: '🚀', brain: '🤯', clap: '👏' };
    const currentReactionEmoji = post.my_reaction ? (reactionMap[post.my_reaction] || '❤️') : null;

    // Poll HTML
    let pollHtml = '';
    if (post.poll && Array.isArray(post.poll.options)) {
      const total = post.poll.total_votes || 0;
      pollHtml = `
        <div class="post-poll-card" data-post-id="${post.id}">
          <div class="poll-question">📊 ${escapeHtml(post.poll.question)}</div>
          ${post.poll.options.map((opt, idx) => {
            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
            return `
              <div class="poll-option-row" data-action="vote-poll" data-post-id="${post.id}" data-opt-idx="${idx}">
                <div class="poll-progress-bar" style="width: ${pct}%;"></div>
                <span class="poll-option-text">${escapeHtml(opt.text)}</span>
                <span class="poll-option-pct">${pct}% (${opt.votes})</span>
              </div>
            `;
          }).join('')}
          <div class="poll-meta-footer">${total} total votes • Final results</div>
        </div>
      `;
    }

    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-avatar-col">
          <img src="${escapeHtml(authorAvatar)}" alt="${escapeHtml(post.author.name)}" class="post-avatar" data-user="${escapeHtml(post.author.username)}" />
        </div>
        <div class="post-main-col">
          <div class="post-header">
            <div class="post-author-meta">
              <span class="post-author-name" data-user="${escapeHtml(post.author.username)}">${escapeHtml(post.author.name)}</span>
              ${post.author.verified ? Icons.verified : ''}
              <span class="post-author-handle" data-user="${escapeHtml(post.author.username)}">@${escapeHtml(post.author.username)}</span>
              <span class="post-meta-dot">•</span>
              <span class="post-time">${relativeTime}</span>
              ${readingTime ? `<span class="reading-time-pill" title="Estimated reading time">⏱️ ${readingTime}</span>` : ''}
            </div>
            <div class="post-options-wrapper" style="position: relative;">
              <button class="post-options-menu-btn" title="More options" data-post-options="${post.id}">
                ${Icons.more}
              </button>
              <div class="post-dropdown" id="dropdown-${post.id}" style="display: none;">
                <button class="post-dropdown-item" data-action="copy-link" data-post-id="${post.id}">
                  ${Icons.link} Copy link
                </button>
                ${isOwner ? `
                  <button class="post-dropdown-item danger" data-action="delete-post" data-post-id="${post.id}">
                    ${Icons.trash} Delete post
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="post-text">${highlightHashtags(post.content)}</div>

          ${pollHtml}

          ${post.image_url ? `
            <div class="post-media-container" data-action="double-tap-media" data-post-id="${post.id}" data-img-url="${escapeHtml(post.image_url)}">
              <img src="${escapeHtml(post.image_url)}" alt="Post image" class="post-media-img" loading="lazy" />
            </div>
          ` : ''}

          <div class="post-actions-bar">
            <!-- Comment Button -->
            <button class="action-btn comment" data-action="toggle-comments" data-post-id="${post.id}" title="Comments">
              ${Icons.comment}
              <span class="action-count" id="comment-count-${post.id}">${post.comments_count || 0}</span>
            </button>

            <!-- Like & Reaction Button -->
            <div class="action-btn-group" data-post-group="${post.id}">
              <button class="action-btn like ${post.is_liked ? 'liked' : ''}" data-action="toggle-like" data-post-id="${post.id}" title="Like / React">
                ${currentReactionEmoji ? `<span style="font-size: 15px;">${currentReactionEmoji}</span>` : Icons.heart}
                <span class="action-count" id="like-count-${post.id}">${post.likes_count || 0}</span>
              </button>
              <!-- Hover Reactions Dock -->
              <div class="reactions-dock" id="reactions-dock-${post.id}" style="display: none;">
                <span class="reaction-dock-item" data-action="pick-reaction" data-post-id="${post.id}" data-reaction="heart">❤️</span>
                <span class="reaction-dock-item" data-action="pick-reaction" data-post-id="${post.id}" data-reaction="fire">🔥</span>
                <span class="reaction-dock-item" data-action="pick-reaction" data-post-id="${post.id}" data-reaction="rocket">🚀</span>
                <span class="reaction-dock-item" data-action="pick-reaction" data-post-id="${post.id}" data-reaction="brain">🤯</span>
                <span class="reaction-dock-item" data-action="pick-reaction" data-post-id="${post.id}" data-reaction="clap">👏</span>
              </div>
            </div>

            <!-- Bookmark Button -->
            <button class="action-btn bookmark ${post.is_bookmarked ? 'bookmarked' : ''}" data-action="toggle-bookmark" data-post-id="${post.id}" title="Save Bookmark">
              ${Icons.bookmark}
            </button>

            <!-- Views Count -->
            <div class="post-views-metric" title="Views">
              ${Icons.views}
              <span>${formatNumber(post.views_count)}</span>
            </div>

            <!-- Share Button -->
            <button class="action-btn share" data-action="share-post" data-post-id="${post.id}" title="Share">
              ${Icons.share}
            </button>
          </div>

          <!-- Collapsible Comments Drawer -->
          <div class="comments-drawer" id="comments-drawer-${post.id}" style="display: none;">
            <div class="comments-list" id="comments-list-${post.id}">
              <div class="skeleton" style="height: 36px; margin-bottom: 8px;"></div>
            </div>

            <form class="comment-composer" data-post-id="${post.id}">
              <input type="text" class="comment-input" placeholder="Post your reply..." maxlength="500" required />
              <button type="submit" class="btn-comment-submit">Reply</button>
            </form>
          </div>
        </div>
      </article>
    `;
  }

  function renderComment(comment, currentUser, postAuthorId) {
    const isCommentAuthor = currentUser && currentUser.id === comment.author.id;
    const canDelete = isCommentAuthor || (currentUser && currentUser.id === postAuthorId);
    const authorAvatar = comment.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
    const relativeTime = formatRelativeTime(comment.created_at);

    return `
      <div class="comment-item" id="comment-${comment.id}">
        <img src="${escapeHtml(authorAvatar)}" alt="${escapeHtml(comment.author.name)}" class="comment-avatar" data-user="${escapeHtml(comment.author.username)}" />
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author-name" data-user="${escapeHtml(comment.author.username)}">${escapeHtml(comment.author.name)}</span>
            ${comment.author.verified ? Icons.verified : ''}
            <span class="comment-time">${relativeTime}</span>
          </div>
          <div class="comment-content">${escapeHtml(comment.content)}</div>
        </div>
        ${canDelete ? `
          <button class="comment-delete-btn" data-action="delete-comment" data-comment-id="${comment.id}" data-post-id="${comment.post_id}" title="Delete comment">
            ${Icons.trash}
          </button>
        ` : ''}
      </div>
    `;
  }

  function renderProfileHeader(profile, currentUser) {
    const isMe = currentUser && currentUser.id === profile.id;
    const avatar = profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
    const banner = profile.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    const joinedYear = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return `
      <div class="profile-banner-wrapper">
        <img src="${escapeHtml(banner)}" alt="Cover Banner" class="profile-banner-img" id="profile-banner-img" />
        ${isMe ? `
          <button class="btn-banner-change" id="btn-quick-change-banner" title="Change Cover Banner">
            📷 Change Banner
          </button>
        ` : ''}
      </div>
      <div class="profile-details-card">
        <div class="profile-top-row">
          ${isMe ? `
            <div class="avatar-edit-wrapper" id="btn-quick-change-avatar" title="Click to change profile picture">
              <img src="${escapeHtml(avatar)}" alt="${escapeHtml(profile.name)}" class="profile-main-avatar" id="profile-main-avatar" />
              <div class="avatar-upload-overlay">
                <span style="font-size: 18px;">📷</span>
                <span>Change</span>
              </div>
            </div>
          ` : `
            <img src="${escapeHtml(avatar)}" alt="${escapeHtml(profile.name)}" class="profile-main-avatar" />
          `}
          <div class="profile-action-buttons">
            ${isMe ? `
              <button class="btn-profile-edit" id="btn-open-edit-profile">
                ✏️ Edit Profile
              </button>
              <button class="btn-profile-logout" id="btn-profile-logout" title="Sign out of your account" style="padding: 7px 14px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700; background: var(--bg-tertiary); color: var(--danger-color); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 5px;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Sign Out</span>
              </button>
            ` : `
              <button class="btn-profile-follow ${profile.is_following ? 'following' : ''}" data-action="toggle-follow-profile" data-user-id="${profile.id}">
                ${profile.is_following ? 'Following' : 'Follow'}
              </button>
              <button class="btn-profile-message" data-action="open-dm" data-user-id="${profile.id}" data-username="${escapeHtml(profile.username)}" data-name="${escapeHtml(profile.name)}" data-avatar="${escapeHtml(avatar)}" title="Send direct message" style="padding: 7px 14px; border-radius: var(--radius-full); font-size: 13px; font-weight: 700; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 5px;">
                💬 Message
              </button>
            `}
          </div>
        </div>

        <div class="profile-identity">
          <h1 class="profile-display-name">
            ${escapeHtml(profile.name)}
            ${profile.verified ? Icons.verified : ''}
          </h1>
          <div class="profile-handle">@${escapeHtml(profile.username)}</div>
        </div>

        ${profile.bio ? `<div class="profile-bio">${escapeHtml(profile.bio)}</div>` : ''}

        <div class="profile-meta-info">
          ${profile.location ? `
            <div class="profile-meta-item">
              ${Icons.mapPin}
              <span>${escapeHtml(profile.location)}</span>
            </div>
          ` : ''}
          ${profile.website ? `
            <div class="profile-meta-item">
              ${Icons.globe}
              <a href="${escapeHtml(profile.website)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); font-weight: 600;">
                ${escapeHtml(profile.website.replace(/^https?:\/\//, ''))}
              </a>
            </div>
          ` : ''}
          <div class="profile-meta-item">
            ${Icons.calendar}
            <span>Joined ${joinedYear}</span>
          </div>
        </div>

        <div class="profile-stats-bar">
          <div class="stat-item" data-action="view-following" data-user-id="${profile.id}">
            <span class="stat-number" id="profile-following-count">${profile.stats.following_count}</span>
            <span>Following</span>
          </div>
          <div class="stat-item" data-action="view-followers" data-user-id="${profile.id}">
            <span class="stat-number" id="profile-followers-count">${profile.stats.followers_count}</span>
            <span>Followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${profile.stats.posts_count}</span>
            <span>Posts</span>
          </div>
          <div class="stat-item" title="Total hearts & reactions received">
            <span class="stat-number" style="color: var(--accent-primary);">✦ ${profile.stats.likes_received || 0}</span>
            <span>Resonance</span>
          </div>
        </div>
      </div>

      <div class="profile-tabs-bar">
        <div class="profile-tab active" data-subtab="posts">Posts</div>
        <div class="profile-tab" data-subtab="liked">Likes</div>
      </div>
    `;
  }

  function renderUserCard(user, currentUser) {
    const isMe = currentUser && currentUser.id === user.id;
    const avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';

    return `
      <div class="follow-suggest-item">
        <div class="suggest-user-info" data-user="${escapeHtml(user.username)}">
          <img src="${escapeHtml(avatar)}" alt="${escapeHtml(user.name)}" class="suggest-avatar" />
          <div class="suggest-names">
            <span class="suggest-name">${escapeHtml(user.name)}</span>
            <span class="suggest-handle">@${escapeHtml(user.username)}</span>
          </div>
        </div>
        ${!isMe ? `
          <button class="btn-quick-follow ${user.is_following ? 'following' : ''}" data-action="toggle-follow-user" data-user-id="${user.id}">
            ${user.is_following ? 'Following' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `;
  }

  function renderEmptyState(title, desc) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
        <div class="empty-state-title">${escapeHtml(title)}</div>
        <div class="empty-state-desc">${escapeHtml(desc)}</div>
      </div>
    `;
  }

  function renderSkeletonPosts(count = 3) {
    return Array.from({ length: count }).map(() => `
      <div class="post-card">
        <div class="post-avatar-col">
          <div class="skeleton" style="width: 46px; height: 46px; border-radius: 50%;"></div>
        </div>
        <div class="post-main-col" style="display: flex; flex-direction: column; gap: 10px;">
          <div class="skeleton" style="width: 170px; height: 16px;"></div>
          <div class="skeleton" style="width: 90%; height: 14px;"></div>
          <div class="skeleton" style="width: 75%; height: 14px;"></div>
          <div class="skeleton" style="width: 100%; height: 200px; border-radius: 12px; margin-top: 6px;"></div>
        </div>
      </div>
    `).join('');
  }

  function renderExploreHub(trendingTags = [], suggestedUsers = []) {
    return `
      <section class="explore-hub-section" id="explore-hub-section">
        <div>
          <div class="explore-hub-subtitle">🔥 Trending Conversations</div>
          <div class="explore-tags-carousel">
            ${trendingTags && trendingTags.length > 0 ? trendingTags.map(t => `
              <div class="explore-tag-pill" data-action="explore-tag" data-tag="${escapeHtml(t.tag)}">
                <span>#${escapeHtml(t.tag)}</span>
                <span style="font-size: 10px; opacity: 0.7;">(${t.count})</span>
              </div>
            `).join('') : '<span style="font-size: 12px; color: var(--text-muted);">Explore trending conversations...</span>'}
          </div>
        </div>

        <div>
          <div class="explore-hub-subtitle">✨ Creators to Follow</div>
          <div class="explore-creators-shelf">
            ${suggestedUsers && suggestedUsers.length > 0 ? suggestedUsers.map(u => `
              <div class="explore-creator-card" data-user="${escapeHtml(u.username)}">
                <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="explore-creator-avatar" />
                <span class="explore-creator-name">${escapeHtml(u.name)}</span>
                <span class="explore-creator-handle">@${escapeHtml(u.username)}</span>
                <button class="btn-quick-follow ${u.is_following ? 'following' : ''}" style="margin-top: 4px; padding: 4px 10px; font-size: 11px;" data-action="toggle-follow-user" data-user-id="${u.id}">
                  ${u.is_following ? 'Following' : 'Follow'}
                </button>
              </div>
            `).join('') : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderMessagesView(conversations = [], activePartner = null, messages = [], suggestedUsers = []) {
    const hasConversations = conversations && conversations.length > 0;

    return `
      <div class="messages-page-wrapper">
        <!-- Messages Conversations Sidebar Column -->
        <div class="conversations-column ${activePartner ? 'has-active-chat' : ''}">
          <div class="conversations-header">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h2 class="conversations-title">Messages</h2>
              <span class="conversations-count-badge">${conversations.length}</span>
            </div>
            <!-- Quick New Message / Suggested Creators -->
            <div class="conversations-suggested-shelf">
              <span class="conv-shelf-label">Direct with:</span>
              <div class="conv-avatars-row">
                ${suggestedUsers.map(u => `
                  <div class="conv-avatar-dot-wrap" data-action="open-dm" data-user-id="${u.id}" data-username="${escapeHtml(u.username)}" data-name="${escapeHtml(u.name)}" data-avatar="${escapeHtml(u.avatar)}" title="Chat with ${escapeHtml(u.name)}">
                    <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="conv-avatar-dot" />
                    <span class="conv-online-indicator"></span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Conversations List -->
          <div class="conversations-list">
            ${!hasConversations ? `
              <div class="conversations-empty-hint">
                <div style="font-size: 28px; margin-bottom: 8px;">💬</div>
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No messages yet</div>
                <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">Pick a creator above or visit any profile to start a conversation!</div>
              </div>
            ` : conversations.map(c => {
              const isSelected = activePartner && activePartner.id === c.partner.id;
              const hasUnread = c.unread_count > 0;
              const snippet = c.last_message ? (c.last_message.is_me ? `You: ${c.last_message.content}` : c.last_message.content) : 'Started a conversation';
              const timeStr = c.last_message ? formatRelativeTime(c.last_message.created_at) : '';

              return `
                <div class="conversation-thread-item ${isSelected ? 'active' : ''} ${hasUnread ? 'unread' : ''}" data-action="open-dm" data-user-id="${c.partner.id}" data-username="${escapeHtml(c.partner.username)}" data-name="${escapeHtml(c.partner.name)}" data-avatar="${escapeHtml(c.partner.avatar)}">
                  <div class="conv-item-avatar-wrap">
                    <img src="${escapeHtml(c.partner.avatar)}" alt="${escapeHtml(c.partner.name)}" class="conv-item-avatar" />
                    <span class="conv-online-indicator"></span>
                  </div>
                  <div class="conv-item-info">
                    <div class="conv-item-top">
                      <div class="conv-item-name">
                        <span>${escapeHtml(c.partner.name)}</span>
                        ${c.partner.verified ? Icons.verified : ''}
                      </div>
                      <span class="conv-item-time">${timeStr}</span>
                    </div>
                    <div class="conv-item-bottom">
                      <span class="conv-item-snippet">${escapeHtml(snippet)}</span>
                      ${hasUnread ? `<span class="conv-unread-pill">${c.unread_count}</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Chat Panel (Active Conversation Thread) -->
        <div class="chat-thread-column ${activePartner ? 'active' : 'empty'}">
          ${!activePartner ? `
            <div class="chat-empty-panel">
              <div class="chat-empty-icon-wrap">✦</div>
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Haven Direct Messages</h3>
              <p style="font-size: 13px; color: var(--text-muted); max-width: 320px; text-align: center; line-height: 1.5;">Send private notes, discuss ideas, collaborate on projects, or chat about design and code.</p>
            </div>
          ` : `
            <!-- Chat Active Header -->
            <div class="chat-active-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <button class="chat-back-btn" data-action="close-dm" title="Back to conversations">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <img src="${escapeHtml(activePartner.avatar)}" alt="${escapeHtml(activePartner.name)}" class="chat-header-avatar" data-user="${escapeHtml(activePartner.username)}" />
                <div>
                  <div class="chat-header-name" data-user="${escapeHtml(activePartner.username)}">
                    <span>${escapeHtml(activePartner.name)}</span>
                    ${activePartner.verified ? Icons.verified : ''}
                  </div>
                  <div class="chat-header-status">
                    <span class="status-dot"></span>
                    <span>Active in Haven</span>
                    <span style="opacity: 0.5;">•</span>
                    <span style="cursor: pointer; text-decoration: underline;" data-user="${escapeHtml(activePartner.username)}">@${escapeHtml(activePartner.username)}</span>
                  </div>
                </div>
              </div>
              <button class="action-btn" data-user="${escapeHtml(activePartner.username)}" title="View Profile">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>

            <!-- Messages Stream -->
            <div class="chat-messages-container" id="chat-messages-container">
              ${messages.length === 0 ? `
                <div class="chat-thread-empty-greeting">
                  <img src="${escapeHtml(activePartner.avatar)}" style="width: 58px; height: 58px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid var(--accent-primary);" />
                  <div style="font-weight: 700; color: var(--text-primary); font-size: 15px;">${escapeHtml(activePartner.name)}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">@${escapeHtml(activePartner.username)}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px; max-width: 260px; line-height: 1.4;">This is the beginning of your conversation with ${escapeHtml(activePartner.name)}. Say hello!</div>
                </div>
              ` : messages.map(m => `
                <div class="chat-bubble-row ${m.is_me ? 'sent' : 'received'}" data-msg-id="${m.id}">
                  ${!m.is_me ? `<img src="${escapeHtml(activePartner.avatar)}" class="chat-bubble-avatar" />` : ''}
                  <div class="chat-bubble-content">
                    <div class="chat-bubble-text">${escapeHtml(m.content)}</div>
                    <div class="chat-bubble-time">${formatRelativeTime(m.created_at)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Chat Bottom Input Form -->
            <form class="chat-composer-form" id="chat-composer-form" data-partner-id="${activePartner.id}">
              <div class="chat-quick-emojis">
                <span class="chat-emoji-chip" data-emoji="✦">✦</span>
                <span class="chat-emoji-chip" data-emoji="☕">☕</span>
                <span class="chat-emoji-chip" data-emoji="🚀">🚀</span>
                <span class="chat-emoji-chip" data-emoji="❤️">❤️</span>
                <span class="chat-emoji-chip" data-emoji="✨">✨</span>
              </div>
              <div class="chat-input-row">
                <input type="text" class="chat-message-input" id="chat-message-input" placeholder="Write a thoughtful message..." autocomplete="off" required maxlength="500" />
                <button type="submit" class="btn-send-message" id="btn-send-message" title="Send message (Enter)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          `}
        </div>
      </div>
    `;
  }

  return {
    escapeHtml,
    formatRelativeTime,
    formatNumber,
    highlightHashtags,
    Icons,
    renderStoriesBar,
    renderPostCard,
    renderComment,
    renderProfileHeader,
    renderUserCard,
    renderEmptyState,
    renderSkeletonPosts,
    renderExploreHub,
    renderMessagesView
  };
})();

// Modern Synthesized Audio Feedback (Zero external mp3 needed!)
const AudioFeedback = (() => {
  let ctx = null;
  let enabled = true;

  function init() {
    if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function pop() {
    if (!enabled) return;
    try {
      init();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  function swoosh() {
    if (!enabled) return;
    try {
      init();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  return {
    pop,
    swoosh,
    toggle: () => { enabled = !enabled; return enabled; },
    isEnabled: () => enabled
  };
})();

// Modern HUD Capsule Feedback System (Single-Instance, Centered, Apple/Linear style)
const Toast = (() => {
  let hud = null;
  let timer = null;

  function init() {
    if (!hud) {
      hud = document.getElementById('haven-hud-capsule');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'haven-hud-capsule';
        hud.className = 'haven-hud-capsule';
        hud.setAttribute('role', 'status');
        hud.setAttribute('aria-live', 'polite');
        document.body.appendChild(hud);
      }
    }
  }

  function show(message, type = 'info', duration = 2200) {
    if (!message) return;
    init();

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/></svg>`;
    }

    hud.className = `haven-hud-capsule visible type-${type}`;
    hud.innerHTML = `
      <span class="hud-icon ${type}">${iconSvg}</span>
      <span class="hud-label">${Components.escapeHtml(message)}</span>
    `;

    // Smooth pulse if re-triggered
    hud.classList.remove('pulse');
    void hud.offsetWidth;
    hud.classList.add('pulse');

    timer = setTimeout(() => {
      hud.classList.remove('visible');
      hud.classList.add('fade-out');
      setTimeout(() => {
        hud.classList.remove('fade-out');
      }, 250);
    }, duration);
  }

  return {
    show,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info')
  };
})();
