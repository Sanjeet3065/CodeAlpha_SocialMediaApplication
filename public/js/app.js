// Haven Main Application Controller
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = (() => {

  // Cached Elements
  const els = {
    appLayout: document.getElementById('app-layout'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    shortcutsBtn: document.getElementById('shortcuts-btn'),
    notifBtn: document.getElementById('btn-open-notifications'),
    notifBadge: document.getElementById('notif-badge-count'),
    notifDrawer: document.getElementById('notifications-drawer'),
    notifBackdrop: document.getElementById('notif-backdrop'),
    notifList: document.getElementById('notifications-list'),
    btnMarkAllRead: document.getElementById('btn-mark-all-read'),
    storiesCarousel: document.getElementById('stories-carousel'),
    feedContainer: document.getElementById('feed-container'),
    composerCard: document.getElementById('composer-card'),
    composerText: document.getElementById('composer-text'),
    composerSubmitBtn: document.getElementById('btn-submit-post'),
    composerImageInput: document.getElementById('composer-image-input'),
    composerImageBtn: document.getElementById('btn-composer-img'),
    composerPresetsBtn: document.getElementById('btn-composer-presets'),
    composerPollBtn: document.getElementById('btn-composer-poll'),
    composerPollBuilder: document.getElementById('composer-poll-builder'),
    composerImgPreviewWrapper: document.getElementById('composer-img-preview-wrapper'),
    composerImgPreview: document.getElementById('composer-img-preview'),
    composerRemoveImgBtn: document.getElementById('btn-remove-composer-img'),
    charCounterCircle: document.getElementById('char-counter-circle'),
    charCounterText: document.getElementById('char-counter-text'),
    feedTabs: document.querySelectorAll('.feed-tab'),
    filterBanner: document.getElementById('filter-banner'),
    filterText: document.getElementById('filter-text'),
    btnClearFilter: document.getElementById('btn-clear-filter'),
    trendingList: document.getElementById('trending-list'),
    whoToFollowList: document.getElementById('who-to-follow-list'),
    demoAccountsGrid: document.getElementById('demo-accounts-grid'),
    searchInput: document.getElementById('search-input'),
    searchResultsDropdown: document.getElementById('search-results-dropdown'),
    currentUserAvatar: document.getElementById('current-user-avatar'),
    currentUserName: document.getElementById('current-user-name'),
    currentUserHandle: document.getElementById('current-user-handle'),
    composerUserAvatar: document.getElementById('composer-user-avatar'),
    lightboxModal: document.getElementById('lightbox-modal'),
    lightboxImage: document.getElementById('lightbox-image'),
    headerTitleText: document.getElementById('header-title-text'),
    navItems: document.querySelectorAll('.nav-item'),
    mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
    messagesNavBadge: document.getElementById('messages-nav-badge'),
    headerMsgBadge: document.getElementById('header-msg-badge')
  };

  let searchDebounceTimer = null;
  let activeComposerImageFile = null;
  let activeComposerImageUrl = null;
  let isPollActive = false;
  let storyTimer = null;

  async function init() {
    setupTheme();
    setupAudioAndShortcuts();
    setupEventListeners();

    // Authenticate existing session or prepare login
    if (API.getToken()) {
      try {
        const user = await API.auth.me();
        State.set('currentUser', user);
      } catch (err) {
        API.setToken(null);
        State.set('currentUser', null);
      }
    } else {
      State.set('currentUser', null);
    }

    renderUserSidebar();
    loadStories();
    loadNotifications();
    checkUnreadMessages();
    loadTrendingTags();
    loadSuggestedUsers();
    loadFeed();

    // If not authenticated, prompt user with Onboarding / Account Creation
    if (!State.get().currentUser) {
      setTimeout(() => {
        openAuthModal();
      }, 350);
    }
  }

  const PALETTES = ['cream', 'sage', 'sandstone', 'rosewood'];
  const PALETTE_NAMES = {
    cream: 'Terracotta Cream',
    sage: 'Nordic Forest Sage',
    sandstone: 'Sandstone Ochre',
    rosewood: 'Velvet Rosewood'
  };

  function setupTheme() {
    let savedTheme = localStorage.getItem('haven_theme') || localStorage.getItem('pulse_theme');
    // Normalize to non-dark palette
    if (!savedTheme || !PALETTES.includes(savedTheme)) {
      savedTheme = 'cream';
    }
    applyTheme(savedTheme, false);

    // Sidebar theme cycle button
    if (els.themeToggleBtn) {
      els.themeToggleBtn.addEventListener('click', () => {
        cycleTheme();
      });
    }

    // Header palette button
    const headerPaletteBtn = document.getElementById('btn-header-palette');
    if (headerPaletteBtn) {
      headerPaletteBtn.addEventListener('click', () => {
        cycleTheme();
      });
    }

    // Click handler for color palette swatches
    document.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-palette]');
      if (swatch) {
        e.preventDefault();
        const palette = swatch.getAttribute('data-palette');
        if (PALETTES.includes(palette)) {
          applyTheme(palette, true);
        }
      }
    });
  }

  function applyTheme(themeName, notify = true) {
    if (!PALETTES.includes(themeName)) themeName = 'cream';
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('haven_theme', themeName);
    localStorage.removeItem('pulse_theme');

    // Update active indicators
    document.querySelectorAll('[data-palette]').forEach(btn => {
      if (btn.getAttribute('data-palette') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const badge = document.getElementById('current-palette-badge');
    if (badge) badge.textContent = PALETTE_NAMES[themeName];

    if (notify) {
      AudioFeedback.pop();
    }
  }

  function cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'cream';
    const idx = PALETTES.indexOf(current);
    const next = PALETTES[(idx + 1) % PALETTES.length];
    applyTheme(next, true);
  }

  function setupAudioAndShortcuts() {
    if (els.soundToggleBtn) {
      els.soundToggleBtn.addEventListener('click', () => {
        const enabled = AudioFeedback.toggle();
        els.soundToggleBtn.querySelector('.sound-icon').textContent = enabled ? '🔊' : '🔇';
        Toast.info(enabled ? 'Sound effects enabled' : 'Sound effects muted');
      });
    }

    if (els.shortcutsBtn) {
      els.shortcutsBtn.addEventListener('click', openShortcutsModal);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        openShortcutsModal();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        els.composerText.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key.toLowerCase() === 't') {
        els.themeToggleBtn.click();
      } else if (e.key === '/') {
        e.preventDefault();
        els.searchInput.focus();
      } else if (e.key === 'Escape') {
        closeModal();
        closeNotifications();
        els.lightboxModal.style.display = 'none';
      }
    });
  }

  function setupEventListeners() {
    // Nav Items
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', () => {
        AudioFeedback.pop();
        handleNavigation(item.getAttribute('data-nav'));
      });
    });

    // Mobile New Post Floating Action
    const mobileNewPostBtn = document.getElementById('btn-mobile-new-post');
    if (mobileNewPostBtn) {
      mobileNewPostBtn.addEventListener('click', () => {
        AudioFeedback.pop();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (els.composerText) {
          els.composerText.focus();
          els.composerCard.classList.add('heart-pop');
          setTimeout(() => els.composerCard.classList.remove('heart-pop'), 400);
        }
      });
    }

    // Mood / Vibe Chips (Additional Feature)
    document.querySelectorAll('.vibe-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        AudioFeedback.pop();
        const vibe = chip.getAttribute('data-vibe');
        const tag = `#${vibe}`;
        if (!els.composerText.value.includes(tag)) {
          els.composerText.value = (els.composerText.value.trim() + ' ' + tag).trim() + ' ';
          handleComposerInput();
        }
        chip.classList.add('active');
        setTimeout(() => chip.classList.remove('active'), 400);
      });
    });

    // Feed Tabs (For You, Following, Trending)
    document.querySelectorAll('.feed-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        AudioFeedback.pop();
        const tabType = tab.getAttribute('data-tab');
        document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        State.update({
          currentView: 'feed',
          feedTab: tabType,
          filterTag: null,
          filterSearch: ''
        });
        updateFilterBanner();
        loadFeed();
      });
    });

    // Clear filter
    els.btnClearFilter.addEventListener('click', () => {
      AudioFeedback.pop();
      State.update({ filterTag: null, filterSearch: '' });
      els.searchInput.value = '';
      updateFilterBanner();
      loadFeed();
    });

    // Composer Input
    els.composerText.addEventListener('input', handleComposerInput);

    // Image Upload button
    els.composerImageBtn.addEventListener('click', () => els.composerImageInput.click());

    els.composerImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      activeComposerImageFile = file;
      activeComposerImageUrl = null;
      const reader = new FileReader();
      reader.onload = (event) => {
        els.composerImgPreview.src = event.target.result;
        els.composerImgPreviewWrapper.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
      AudioFeedback.pop();
    });

    els.composerRemoveImgBtn.addEventListener('click', () => {
      activeComposerImageFile = null;
      activeComposerImageUrl = null;
      els.composerImageInput.value = '';
      els.composerImgPreview.src = '';
      els.composerImgPreviewWrapper.style.display = 'none';
      AudioFeedback.pop();
    });

    // Stock Presets Picker
    els.composerPresetsBtn.addEventListener('click', () => {
      AudioFeedback.pop();
      openStockPresetsModal();
    });

    // Poll toggle button in composer
    if (els.composerPollBtn) {
      els.composerPollBtn.addEventListener('click', () => {
        isPollActive = !isPollActive;
        els.composerPollBtn.classList.toggle('active', isPollActive);
        els.composerPollBuilder.style.display = isPollActive ? 'flex' : 'none';
        AudioFeedback.pop();
      });
    }

    // Quick Hashtags
    document.querySelectorAll('.quick-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        AudioFeedback.pop();
        const tag = chip.getAttribute('data-tag');
        const currentVal = els.composerText.value;
        els.composerText.value = currentVal ? `${currentVal} #${tag}` : `#${tag} `;
        handleComposerInput();
        els.composerText.focus();
      });
    });

    // Submit Post
    els.composerSubmitBtn.addEventListener('click', submitPost);

    // Notifications Drawer toggle
    if (els.notifBtn) {
      els.notifBtn.addEventListener('click', toggleNotifications);
    }
    const headerMsgBtn = document.getElementById('btn-header-messages');
    if (headerMsgBtn) {
      headerMsgBtn.addEventListener('click', () => {
        AudioFeedback.pop();
        handleNavigation('messages');
      });
    }
    if (els.notifBackdrop) {
      els.notifBackdrop.addEventListener('click', closeNotifications);
    }
    if (els.btnMarkAllRead) {
      els.btnMarkAllRead.addEventListener('click', async () => {
        await API.notifications.markAllRead();
        els.notifBadge.style.display = 'none';
        document.querySelectorAll('.notification-item').forEach(i => i.classList.remove('unread'));
        Toast.info('Marked all as read.');
      });
    }

    // Live Search
    els.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      const query = e.target.value.trim();
      if (!query) {
        els.searchResultsDropdown.style.display = 'none';
        return;
      }
      searchDebounceTimer = setTimeout(async () => {
        try {
          const res = await API.users.search(query);
          renderSearchResults(res.users, query);
        } catch (err) {}
      }, 250);
    });

    els.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = els.searchInput.value.trim();
        if (query) {
          els.searchResultsDropdown.style.display = 'none';
          State.update({ currentView: 'feed', filterSearch: query, filterTag: null });
          updateFilterBanner();
          loadFeed();
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!els.searchInput.contains(e.target) && !els.searchResultsDropdown.contains(e.target)) {
        els.searchResultsDropdown.style.display = 'none';
      }
    });

    // Global Delegated Clicks
    document.addEventListener('click', handleGlobalClicks);

    // Lightbox close
    els.lightboxModal.addEventListener('click', () => {
      els.lightboxModal.style.display = 'none';
    });
  }

  // Load Stories
  async function loadStories() {
    try {
      const data = await API.stories.getAll();
      State.set('storyGroups', data.storyGroups);
      if (els.storiesCarousel) {
        els.storiesCarousel.innerHTML = Components.renderStoriesBar(data.storyGroups, State.get().currentUser);
      }
    } catch (e) {}
  }

  // Load Notifications
  async function loadNotifications() {
    if (!State.isAuthenticated()) return;
    try {
      const data = await API.notifications.getAll();
      State.set('notifications', data.notifications);
      State.set('unreadNotifsCount', data.unreadCount);

      if (els.notifBadge) {
        if (data.unreadCount > 0) {
          els.notifBadge.textContent = data.unreadCount;
          els.notifBadge.style.display = 'inline-block';
        } else {
          els.notifBadge.style.display = 'none';
        }
      }
    } catch (e) {}
  }

  function toggleNotifications() {
    const isOpen = els.notifDrawer.style.display === 'flex';
    if (isOpen) {
      closeNotifications();
    } else {
      openNotifications();
    }
  }

  function openNotifications() {
    els.notifDrawer.style.display = 'flex';
    els.notifBackdrop.style.display = 'block';
    renderNotificationsDrawer();
    AudioFeedback.pop();
  }

  function closeNotifications() {
    els.notifDrawer.style.display = 'none';
    els.notifBackdrop.style.display = 'none';
  }

  function renderNotificationsDrawer() {
    const notifs = State.get().notifications;
    if (!notifs || notifs.length === 0) {
      els.notifList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">No notifications yet.</div>';
      return;
    }

    els.notifList.innerHTML = notifs.map(n => `
      <div class="notification-item ${!n.is_read ? 'unread' : ''}">
        <img src="${Components.escapeHtml(n.actor.avatar)}" alt="${Components.escapeHtml(n.actor.name)}" class="notif-actor-avatar" data-user="${Components.escapeHtml(n.actor.username)}" />
        <div class="notif-content-wrap">
          <div><strong>${Components.escapeHtml(n.actor.name)}</strong> ${Components.escapeHtml(n.content)}</div>
          <div class="notif-time">${Components.formatRelativeTime(n.created_at)}</div>
        </div>
      </div>
    `).join('');
  }

  // Handle Global Delegated Click Actions
  async function handleGlobalClicks(e) {
    const target = e.target;

    // 1. Hashtag click
    const tagEl = target.closest('.hashtag-link');
    if (tagEl) {
      e.preventDefault();
      AudioFeedback.pop();
      const tag = tagEl.getAttribute('data-tag');
      State.update({ currentView: 'feed', filterTag: tag, filterSearch: '' });
      updateFilterBanner();
      loadFeed();
      return;
    }

    // 1b. Explore Tag Click
    const exploreTagEl = target.closest('[data-action="explore-tag"]');
    if (exploreTagEl) {
      e.preventDefault();
      AudioFeedback.pop();
      const tag = exploreTagEl.getAttribute('data-tag');
      State.update({ currentView: 'feed', filterTag: tag, filterSearch: '' });
      updateFilterBanner();
      loadFeed();
      return;
    }

    // 2. User click
    const userEl = target.closest('[data-user]');
    if (userEl && !target.closest('button') && !target.closest('.conv-avatar-dot-wrap') && !target.closest('.conversation-thread-item') && !target.closest('.chat-bubble-row')) {
      e.preventDefault();
      AudioFeedback.pop();
      const username = userEl.getAttribute('data-user');
      openUserProfile(username);
      return;
    }

    // 2b. Open Direct Messages thread
    const openDmBtn = target.closest('[data-action="open-dm"]');
    if (openDmBtn) {
      e.preventDefault();
      AudioFeedback.pop();
      const userId = openDmBtn.getAttribute('data-user-id');
      const partnerData = {
        id: parseInt(userId, 10),
        username: openDmBtn.getAttribute('data-username'),
        name: openDmBtn.getAttribute('data-name'),
        avatar: openDmBtn.getAttribute('data-avatar')
      };
      openMessagesView(partnerData.id, partnerData);
      return;
    }

    // 2c. Close Direct Messages thread (mobile back)
    const closeDmBtn = target.closest('[data-action="close-dm"]');
    if (closeDmBtn) {
      e.preventDefault();
      AudioFeedback.pop();
      openMessagesView(null);
      return;
    }

    // 2d. Chat Emoji Chip Click
    const emojiChip = target.closest('.chat-emoji-chip');
    if (emojiChip) {
      e.preventDefault();
      const emoji = emojiChip.getAttribute('data-emoji');
      const input = document.getElementById('chat-message-input');
      if (input) {
        input.value += emoji;
        input.focus();
      }
      return;
    }

    // 3. Like Post
    const likeBtn = target.closest('[data-action="toggle-like"]');
    if (likeBtn) {
      e.preventDefault();
      const postId = likeBtn.getAttribute('data-post-id');
      await toggleLike(postId, likeBtn);
      return;
    }

    // 4. Double tap image to like
    const mediaContainer = target.closest('[data-action="double-tap-media"]');
    if (mediaContainer) {
      handleMediaDoubleClick(mediaContainer);
      return;
    }

    // 5. Pick Reaction from Reaction Dock
    const reactionPick = target.closest('[data-action="pick-reaction"]');
    if (reactionPick) {
      e.preventDefault();
      const postId = reactionPick.getAttribute('data-post-id');
      const reaction = reactionPick.getAttribute('data-reaction');
      pickReaction(postId, reaction);
      return;
    }

    // 6. Vote on Poll Option
    const pollVoteRow = target.closest('[data-action="vote-poll"]');
    if (pollVoteRow) {
      e.preventDefault();
      const postId = pollVoteRow.getAttribute('data-post-id');
      const optIdx = pollVoteRow.getAttribute('data-opt-idx');
      voteOnPoll(postId, optIdx);
      return;
    }

    // 7. View Story
    const viewStoryBtn = target.closest('[data-action="view-story"]');
    if (viewStoryBtn) {
      const idx = parseInt(viewStoryBtn.getAttribute('data-story-index'), 10);
      openStoryViewer(idx);
      return;
    }

    // 8. Add Story
    const addStoryBtn = target.closest('[data-action="add-story"]');
    if (addStoryBtn) {
      openAddStoryModal();
      return;
    }

    // 9. Bookmark Post
    const bookmarkBtn = target.closest('[data-action="toggle-bookmark"]');
    if (bookmarkBtn) {
      e.preventDefault();
      const postId = bookmarkBtn.getAttribute('data-post-id');
      await toggleBookmark(postId, bookmarkBtn);
      return;
    }

    // 10. Toggle Comments Drawer
    const commentBtn = target.closest('[data-action="toggle-comments"]');
    if (commentBtn) {
      e.preventDefault();
      const postId = commentBtn.getAttribute('data-post-id');
      toggleCommentsDrawer(postId);
      return;
    }

    // 11. Share Post
    const shareBtn = target.closest('[data-action="share-post"]');
    if (shareBtn) {
      e.preventDefault();
      const postId = shareBtn.getAttribute('data-post-id');
      copyPostLink(postId);
      return;
    }

    // 12. Post Options Menu toggle
    const optionsBtn = target.closest('[data-post-options]');
    if (optionsBtn) {
      e.preventDefault();
      const postId = optionsBtn.getAttribute('data-post-options');
      const dropdown = document.getElementById(`dropdown-${postId}`);
      if (dropdown) {
        const isOpen = dropdown.style.display === 'flex';
        document.querySelectorAll('.post-dropdown').forEach(d => d.style.display = 'none');
        dropdown.style.display = isOpen ? 'none' : 'flex';
      }
      return;
    } else {
      document.querySelectorAll('.post-dropdown').forEach(d => d.style.display = 'none');
    }

    // 13. Delete Post
    const deletePostBtn = target.closest('[data-action="delete-post"]');
    if (deletePostBtn) {
      e.preventDefault();
      const postId = deletePostBtn.getAttribute('data-post-id');
      deletePost(postId);
      return;
    }

    // 14. Copy Link
    const copyLinkBtn = target.closest('[data-action="copy-link"]');
    if (copyLinkBtn) {
      e.preventDefault();
      const postId = copyLinkBtn.getAttribute('data-post-id');
      copyPostLink(postId);
      return;
    }

    // 15. Delete Comment
    const delCommentBtn = target.closest('[data-action="delete-comment"]');
    if (delCommentBtn) {
      e.preventDefault();
      const commentId = delCommentBtn.getAttribute('data-comment-id');
      const postId = delCommentBtn.getAttribute('data-post-id');
      deleteComment(commentId, postId);
      return;
    }

    // 16. Follow / Unfollow User
    const followUserBtn = target.closest('[data-action="toggle-follow-user"]');
    if (followUserBtn) {
      e.preventDefault();
      const userId = followUserBtn.getAttribute('data-user-id');
      toggleFollow(userId, followUserBtn);
      return;
    }

    // 17. Follow on Profile Header
    const followProfileBtn = target.closest('[data-action="toggle-follow-profile"]');
    if (followProfileBtn) {
      e.preventDefault();
      const userId = followProfileBtn.getAttribute('data-user-id');
      toggleFollow(userId, followProfileBtn, true);
      return;
    }

    // 17.5. Sign Out / Logout Trigger
    if (target.id === 'btn-sidebar-logout' || target.closest('#btn-sidebar-logout') || target.id === 'btn-profile-logout' || target.closest('#btn-profile-logout')) {
      e.preventDefault();
      handleSignOut();
      return;
    }

    // 18. Open Edit Profile Modal
    if (target.id === 'btn-open-edit-profile' || target.closest('#btn-open-edit-profile') || target.closest('#btn-quick-change-avatar') || target.closest('#btn-quick-change-banner') || target.closest('#btn-sidebar-quick-edit')) {
      e.preventDefault();
      AudioFeedback.pop();
      openEditProfileModal();
      return;
    }

    // 19. View Followers / Following Modal
    const viewFollowersBtn = target.closest('[data-action="view-followers"]');
    if (viewFollowersBtn) {
      const userId = viewFollowersBtn.getAttribute('data-user-id');
      openFollowersModal(userId, 'Followers');
      return;
    }

    const viewFollowingBtn = target.closest('[data-action="view-following"]');
    if (viewFollowingBtn) {
      const userId = viewFollowingBtn.getAttribute('data-user-id');
      openFollowersModal(userId, 'Following');
      return;
    }

    // 20. Profile Subtabs ('posts' vs 'liked')
    const profileSubtab = target.closest('[data-subtab]');
    if (profileSubtab) {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      profileSubtab.classList.add('active');
      const subtab = profileSubtab.getAttribute('data-subtab');
      State.set('profileTab', subtab);
      loadProfilePosts(State.get().profileUsername, subtab);
      return;
    }

    // 21. Demo Switcher Chip
    const demoChip = target.closest('[data-demo-user]');
    if (demoChip) {
      const username = demoChip.getAttribute('data-demo-user');
      switchDemoAccount(username);
      return;
    }

    // 22. Trending Tag Click
    const trendingItem = target.closest('[data-trending-tag]');
    if (trendingItem) {
      const tag = trendingItem.getAttribute('data-trending-tag');
      State.update({ currentView: 'feed', filterTag: tag, filterSearch: '' });
      updateFilterBanner();
      loadFeed();
      return;
    }
  }

  // Double Click / Double Tap on Post Media for Big Burst Heart
  let lastTapTime = 0;
  function handleMediaDoubleClick(container) {
    const now = Date.now();
    const diff = now - lastTapTime;
    lastTapTime = now;

    if (diff < 350) {
      // Double tap detected!
      AudioFeedback.pop();
      const postId = container.getAttribute('data-post-id');

      // Create burst heart overlay
      const heart = document.createElement('div');
      heart.className = 'big-heart-overlay';
      heart.innerHTML = `<svg viewBox="0 0 24 24" width="90" height="90" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      container.appendChild(heart);
      setTimeout(() => heart.remove(), 900);

      // Trigger like if not already liked
      const likeBtn = document.querySelector(`.action-btn.like[data-post-id="${postId}"]`);
      if (likeBtn && !likeBtn.classList.contains('liked')) {
        toggleLike(postId, likeBtn);
      }
    }
  }

  // Pick Emoji Reaction
  async function pickReaction(postId, reaction) {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    AudioFeedback.pop();
    const likeBtn = document.querySelector(`.action-btn.like[data-post-id="${postId}"]`);
    const countEl = document.getElementById(`like-count-${postId}`);
    const dock = document.getElementById(`reactions-dock-${postId}`);
    if (dock) dock.style.display = 'none';

    try {
      const res = await API.posts.toggleLike(postId, reaction);
      if (countEl) countEl.textContent = res.likes_count;

      const reactionMap = { heart: '❤️', fire: '🔥', rocket: '🚀', brain: '🤯', clap: '👏' };
      if (likeBtn) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `<span style="font-size: 15px;">${reactionMap[reaction] || '❤️'}</span> <span class="action-count">${res.likes_count}</span>`;
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to react');
    }
  }

  // Vote on Poll Option
  async function voteOnPoll(postId, optionIndex) {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    AudioFeedback.pop();
    try {
      const res = await API.posts.votePoll(postId, optionIndex);
      Toast.success('Vote counted!');

      // Re-render poll card dynamically
      const pollCard = document.querySelector(`.post-poll-card[data-post-id="${postId}"]`);
      if (pollCard) {
        const total = res.poll.total_votes || 1;
        pollCard.innerHTML = `
          <div class="poll-question">📊 ${Components.escapeHtml(res.poll.question)}</div>
          ${res.poll.options.map((opt, idx) => {
            const pct = Math.round((opt.votes / total) * 100);
            return `
              <div class="poll-option-row" data-action="vote-poll" data-post-id="${postId}" data-opt-idx="${idx}">
                <div class="poll-progress-bar" style="width: ${pct}%;"></div>
                <span class="poll-option-text">${Components.escapeHtml(opt.text)}</span>
                <span class="poll-option-pct">${pct}% (${opt.votes})</span>
              </div>
            `;
          }).join('')}
          <div class="poll-meta-footer">${total} total votes • Updated</div>
        `;
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to record vote');
    }
  }

  // Open Story Viewer Modal (Instagram / Snapchat Style)
  function openStoryViewer(groupIndex) {
    const storyGroups = State.get().storyGroups;
    if (!storyGroups || !storyGroups[groupIndex]) return;

    const group = storyGroups[groupIndex];
    let currentStoryIdx = 0;

    AudioFeedback.swoosh();
    closeModal();

    const viewer = document.createElement('div');
    viewer.className = 'story-viewer-modal';
    viewer.id = 'active-story-viewer';

    function renderStorySlide() {
      const story = group.stories[currentStoryIdx];
      viewer.innerHTML = `
        <div class="story-viewer-card">
          <!-- Timed Progress Indicator Segments -->
          <div class="story-progress-bar-container">
            ${group.stories.map((s, idx) => `
              <div class="story-progress-segment">
                <div class="story-progress-fill" id="story-fill-${idx}" style="width: ${idx < currentStoryIdx ? '100%' : (idx === currentStoryIdx ? '0%' : '0%')};"></div>
              </div>
            `).join('')}
          </div>

          <div class="story-viewer-header">
            <div class="story-viewer-author" data-user="${Components.escapeHtml(group.user.username)}">
              <img src="${Components.escapeHtml(group.user.avatar)}" class="story-author-avatar" />
              <div>
                <span class="story-author-name">${Components.escapeHtml(group.user.name)}</span>
                <div style="font-size: 11px; color: rgba(255,255,255,0.7);">${Components.formatRelativeTime(story.created_at)}</div>
              </div>
            </div>
            <button class="story-viewer-close-btn" id="btn-close-story">✕</button>
          </div>

          <img src="${Components.escapeHtml(story.media_url)}" alt="Story Media" class="story-viewer-media" />

          ${story.caption ? `<div class="story-viewer-caption">${Components.escapeHtml(story.caption)}</div>` : ''}

          <!-- Story Fast Reaction Bar -->
          <div style="position: absolute; bottom: 12px; left: 16px; right: 16px; display: flex; gap: 8px;">
            <input type="text" placeholder="Reply to story..." style="flex: 1; padding: 10px 16px; border-radius: 9999px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 13px; outline: none;" />
            <button style="padding: 0 16px; border-radius: 9999px; background: var(--accent-gradient); color: #fff; font-size: 13px; font-weight: 700;">Send</button>
          </div>
        </div>
      `;

      // Wire close button
      document.getElementById('btn-close-story').addEventListener('click', closeStoryViewer);

      // Animate progress bar fill over 5 seconds
      const activeFill = document.getElementById(`story-fill-${currentStoryIdx}`);
      if (activeFill) {
        activeFill.style.transition = 'width 5s linear';
        setTimeout(() => { if (activeFill) activeFill.style.width = '100%'; }, 50);
      }

      clearTimeout(storyTimer);
      storyTimer = setTimeout(() => {
        if (currentStoryIdx < group.stories.length - 1) {
          currentStoryIdx++;
          renderStorySlide();
        } else if (groupIndex < storyGroups.length - 1) {
          openStoryViewer(groupIndex + 1);
        } else {
          closeStoryViewer();
        }
      }, 5000);
    }

    renderStorySlide();
    document.body.appendChild(viewer);

    function closeStoryViewer() {
      clearTimeout(storyTimer);
      const el = document.getElementById('active-story-viewer');
      if (el) el.remove();
    }
  }

  // Open Add Story Modal
  function openAddStoryModal() {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    const modal = createModal('Share a Moment (Story)', `
      <form id="form-add-story" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Media Photo URL</label>
          <input type="url" id="story-url" class="form-input" placeholder="https://images.unsplash.com/..." required value="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80" />
        </div>
        <div class="form-group">
          <label class="form-label">Caption (Optional)</label>
          <input type="text" id="story-caption" class="form-input" placeholder="Quick thought for today..." maxlength="120" />
        </div>
        <button type="submit" class="btn-post-primary" style="margin-top: 8px;">Post Story (24h)</button>
      </form>
    `);

    document.getElementById('form-add-story').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const url = document.getElementById('story-url').value.trim();
        const caption = document.getElementById('story-caption').value.trim();
        await API.stories.add(url, caption);
        closeModal();
        Toast.success('Story shared!');
        loadStories();
      } catch (err) {
        Toast.error(err.message || 'Failed to post story.');
      }
    });
  }

  // Handle Comment Submission
  document.addEventListener('submit', async (e) => {
    const commentForm = e.target.closest('.comment-composer');
    if (!commentForm) return;

    e.preventDefault();
    const postId = commentForm.getAttribute('data-post-id');
    const input = commentForm.querySelector('.comment-input');
    const content = input.value.trim();

    if (!content) return;

    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    try {
      const res = await API.comments.add(postId, content);
      input.value = '';
      AudioFeedback.pop();

      const listEl = document.getElementById(`comments-list-${postId}`);
      const commentHtml = Components.renderComment(res.comment, State.get().currentUser, 0);
      listEl.insertAdjacentHTML('beforeend', commentHtml);

      const countEl = document.getElementById(`comment-count-${postId}`);
      if (countEl) countEl.textContent = res.comments_count;

      Toast.success('Reply posted!');
    } catch (err) {
      Toast.error(err.message || 'Failed to post reply.');
    }
  });

  // Handle Direct Message Submission
  document.addEventListener('submit', async (e) => {
    const chatForm = e.target.closest('#chat-composer-form');
    if (!chatForm) return;

    e.preventDefault();
    const partnerId = parseInt(chatForm.getAttribute('data-partner-id'), 10);
    const input = document.getElementById('chat-message-input');
    const content = input ? input.value.trim() : '';

    if (!content || isNaN(partnerId)) return;

    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    input.value = '';
    AudioFeedback.pop();

    // Optimistically render bubble in chat container
    const container = document.getElementById('chat-messages-container');
    if (container) {
      const emptyGreeting = container.querySelector('.chat-thread-empty-greeting');
      if (emptyGreeting) emptyGreeting.remove();

      const bubbleRow = document.createElement('div');
      bubbleRow.className = 'chat-bubble-row sent';
      bubbleRow.innerHTML = `
        <div class="chat-bubble-content">
          <div class="chat-bubble-text">${Components.escapeHtml(content)}</div>
          <div class="chat-bubble-time">Just now</div>
        </div>
      `;
      container.appendChild(bubbleRow);
      container.scrollTop = container.scrollHeight;
    }

    try {
      await API.messages.sendMessage(partnerId, content);
      // Refresh snippet in conversations list if present
      const convSnippet = document.querySelector(`.conversation-thread-item[data-user-id="${partnerId}"] .conv-item-snippet`);
      if (convSnippet) {
        convSnippet.textContent = `You: ${content}`;
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to send message');
    }
  });

  // Navigation Router
  function handleNavigation(nav) {
    els.navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-nav') === nav));
    els.mobileNavItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-nav') === nav));

    if (nav === 'home') {
      State.update({ currentView: 'feed', feedTab: 'for_you', filterTag: null, filterSearch: '' });
      document.querySelectorAll('.feed-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === 'for_you'));
      document.querySelectorAll('.feed-tab')[0].parentElement.style.display = 'flex';
      els.composerCard.style.display = 'flex';
      if (els.storiesCarousel) els.storiesCarousel.style.display = 'flex';
      els.headerTitleText.textContent = 'Home';
      updateFilterBanner();
      loadFeed();
    } else if (nav === 'explore') {
      State.update({ currentView: 'explore', feedTab: 'trending', filterTag: null, filterSearch: '' });
      document.querySelectorAll('.feed-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === 'trending'));
      document.querySelectorAll('.feed-tab')[0].parentElement.style.display = 'flex';
      els.composerCard.style.display = 'none';
      if (els.storiesCarousel) els.storiesCarousel.style.display = 'none';
      els.headerTitleText.textContent = 'Explore Community';
      updateFilterBanner();
      loadFeed();
    } else if (nav === 'messages') {
      if (!State.isAuthenticated()) {
        openAuthModal();
        return;
      }
      openMessagesView();
    } else if (nav === 'bookmarks') {
      if (!State.isAuthenticated()) {
        openAuthModal();
        return;
      }
      State.update({ currentView: 'feed', feedTab: 'bookmarks', filterTag: null, filterSearch: '' });
      document.querySelectorAll('.feed-tab')[0].parentElement.style.display = 'none';
      els.composerCard.style.display = 'none';
      if (els.storiesCarousel) els.storiesCarousel.style.display = 'none';
      els.headerTitleText.textContent = 'Saved Bookmarks';
      updateFilterBanner();
      loadFeed();
    } else if (nav === 'profile') {
      const user = State.get().currentUser;
      if (user) {
        openUserProfile(user.username);
      } else {
        openAuthModal();
      }
    }
  }

  // Load Feed
  async function loadFeed() {
    els.feedContainer.innerHTML = Components.renderSkeletonPosts(3);
    const { currentView, feedTab, filterTag, filterSearch, trendingTags, suggestedUsers } = State.get();

    try {
      const params = { feed: feedTab };
      if (filterTag) params.tag = filterTag;
      if (filterSearch) params.search = filterSearch;

      const data = await API.posts.getFeed(params);
      State.set('posts', data.posts);

      let headerHtml = '';
      if (currentView === 'explore') {
        headerHtml = Components.renderExploreHub(trendingTags, suggestedUsers);
      }

      if (data.posts.length === 0) {
        let msg = 'No posts found in this feed yet. Be the first to share your thoughts!';
        if (feedTab === 'following') msg = 'You are not following anyone with posts yet. Follow people from the suggestions to see their updates!';
        if (feedTab === 'bookmarks') msg = 'You haven’t saved any posts to your bookmarks yet.';
        if (feedTab === 'trending') msg = 'No trending posts yet. Vote and like posts to see them featured here!';
        if (filterTag) msg = `No posts tagged with #${filterTag} found.`;
        if (filterSearch) msg = `No posts found matching "${filterSearch}".`;

        els.feedContainer.innerHTML = headerHtml + Components.renderEmptyState('Quiet in here...', msg);
        return;
      }

      els.feedContainer.innerHTML = headerHtml + data.posts
        .map(post => Components.renderPostCard(post, State.get().currentUser))
        .join('');
    } catch (err) {
      els.feedContainer.innerHTML = Components.renderEmptyState('Failed to load feed', err.message);
    }
  }

  // Toggle Like with Instant Optimistic UI & Heart Pop
  async function toggleLike(postId, button) {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    AudioFeedback.pop();
    const countEl = document.getElementById(`like-count-${postId}`);
    const isCurrentlyLiked = button.classList.contains('liked');
    let currentCount = parseInt(countEl.textContent, 10) || 0;

    button.classList.toggle('liked', !isCurrentlyLiked);
    button.classList.add('heart-pop');
    setTimeout(() => button.classList.remove('heart-pop'), 450);

    const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    countEl.textContent = newCount;

    try {
      const res = await API.posts.toggleLike(postId);
      countEl.textContent = res.likes_count;
      button.classList.toggle('liked', res.liked);
    } catch (err) {
      button.classList.toggle('liked', isCurrentlyLiked);
      countEl.textContent = currentCount;
      Toast.error(err.message || 'Failed to update like');
    }
  }

  // Toggle Bookmark
  async function toggleBookmark(postId, button) {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    AudioFeedback.pop();
    const isCurrentlyBookmarked = button.classList.contains('bookmarked');
    button.classList.toggle('bookmarked', !isCurrentlyBookmarked);
    button.classList.add('bookmark-pop');
    setTimeout(() => button.classList.remove('bookmark-pop'), 400);

    try {
      const res = await API.posts.toggleBookmark(postId);
      button.classList.toggle('bookmarked', res.bookmarked);
      Toast.info(res.bookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks');
    } catch (err) {
      button.classList.toggle('bookmarked', isCurrentlyBookmarked);
      Toast.error(err.message || 'Failed to update bookmark');
    }
  }

  // Toggle Comments Drawer
  async function toggleCommentsDrawer(postId) {
    const drawer = document.getElementById(`comments-drawer-${postId}`);
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!drawer || !listEl) return;

    if (drawer.style.display === 'block') {
      drawer.style.display = 'none';
      return;
    }

    AudioFeedback.pop();
    drawer.style.display = 'block';
    listEl.innerHTML = '<div class="skeleton" style="height: 40px; margin-bottom: 8px;"></div>';

    try {
      const res = await API.comments.getForPost(postId);
      if (res.comments.length === 0) {
        listEl.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); padding: 6px 0;">No comments yet. Start the conversation!</div>';
        return;
      }

      listEl.innerHTML = res.comments
        .map(c => Components.renderComment(c, State.get().currentUser, 0))
        .join('');
    } catch (err) {
      listEl.innerHTML = `<div style="color: var(--danger-color); font-size: 12px;">Failed to load comments: ${err.message}</div>`;
    }
  }

  // Delete Comment
  async function deleteComment(commentId, postId) {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await API.comments.delete(commentId);
      const commentEl = document.getElementById(`comment-${commentId}`);
      if (commentEl) commentEl.remove();

      const countEl = document.getElementById(`comment-count-${postId}`);
      if (countEl) countEl.textContent = res.comments_count;
      AudioFeedback.pop();
      Toast.info('Comment deleted.');
    } catch (err) {
      Toast.error(err.message || 'Failed to delete comment.');
    }
  }

  // Delete Post
  async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    try {
      await API.posts.delete(postId);
      const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (postCard) {
        postCard.style.opacity = '0';
        postCard.style.transform = 'translateY(-10px)';
        postCard.style.transition = 'all 0.3s ease';
        setTimeout(() => postCard.remove(), 300);
      }
      AudioFeedback.pop();
      Toast.info('Post deleted successfully.');
    } catch (err) {
      Toast.error(err.message || 'Failed to delete post.');
    }
  }

  // Copy or Share Post Link
  function copyPostLink(postId) {
    const url = `${window.location.origin}/#post-${postId}`;
    if (navigator.share && window.innerWidth <= 768) {
      navigator.share({
        title: 'Haven Post',
        text: 'Thoughtful conversation on Haven',
        url: url
      }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      AudioFeedback.pop();
      Toast.success('Link copied to clipboard! 📋');
    }).catch(() => {
      Toast.info(`Post URL: ${url}`);
    });
  }

  // Toggle Follow / Unfollow
  async function toggleFollow(targetUserId, button, isProfileHeader = false) {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    AudioFeedback.pop();
    try {
      const res = await API.users.toggleFollow(targetUserId);

      if (isProfileHeader) {
        button.classList.toggle('following', res.following);
        button.textContent = res.following ? 'Following' : 'Follow';
        const followersCountEl = document.getElementById('profile-followers-count');
        if (followersCountEl) followersCountEl.textContent = res.followers_count;
      } else {
        button.classList.toggle('following', res.following);
        button.textContent = res.following ? 'Following' : 'Follow';
      }

      Toast.success(res.message);
      loadSuggestedUsers();
    } catch (err) {
      Toast.error(err.message || 'Failed to update follow status.');
    }
  }

  // Composer Input Auto-resize & Character Counter
  function handleComposerInput() {
    const text = els.composerText.value;
    const len = text.length;
    const max = 1000;

    els.composerText.style.height = 'auto';
    els.composerText.style.height = `${Math.min(els.composerText.scrollHeight, 250)}px`;

    const circle = els.charCounterCircle;
    const circumference = 2 * Math.PI * 10;
    const progress = Math.min(len / max, 1);
    const strokeDashoffset = circumference - (progress * circumference);
    circle.style.strokeDashoffset = strokeDashoffset;

    if (len > max * 0.9) {
      circle.style.stroke = 'var(--danger-color)';
    } else {
      circle.style.stroke = 'var(--accent-primary)';
    }

    els.charCounterText.textContent = `${len}/${max}`;
    els.composerSubmitBtn.disabled = len === 0 && !activeComposerImageFile && !activeComposerImageUrl;
  }

  // Submit Post
  async function submitPost() {
    const content = els.composerText.value.trim();
    if (!content && !activeComposerImageFile && !activeComposerImageUrl) return;

    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    els.composerSubmitBtn.disabled = true;
    els.composerSubmitBtn.textContent = 'Posting...';

    try {
      let finalImageUrl = activeComposerImageUrl;

      if (activeComposerImageFile) {
        const uploadRes = await API.upload.image(activeComposerImageFile);
        finalImageUrl = uploadRes.url;
      }

      // Check poll data
      let pollData = null;
      if (isPollActive) {
        const q = document.getElementById('poll-q')?.value?.trim();
        const o1 = document.getElementById('poll-opt-1')?.value?.trim();
        const o2 = document.getElementById('poll-opt-2')?.value?.trim();
        if (q && o1 && o2) {
          pollData = { question: q, options: [o1, o2] };
        }
      }

      const res = await API.posts.create({
        content,
        image_url: finalImageUrl,
        poll: pollData
      });

      // Reset composer
      els.composerText.value = '';
      els.composerText.style.height = '80px';
      activeComposerImageFile = null;
      activeComposerImageUrl = null;
      els.composerImgPreview.src = '';
      els.composerImgPreviewWrapper.style.display = 'none';
      if (els.composerPollBuilder) {
        els.composerPollBuilder.style.display = 'none';
        isPollActive = false;
        if (els.composerPollBtn) els.composerPollBtn.classList.remove('active');
      }
      els.charCounterText.textContent = '0/1000';
      els.charCounterCircle.style.strokeDashoffset = '62.8';

      AudioFeedback.swoosh();
      const postHtml = Components.renderPostCard(res.post, State.get().currentUser);
      els.feedContainer.insertAdjacentHTML('afterbegin', postHtml);

      Toast.success('Your post is live! 🚀');
      loadTrendingTags();
    } catch (err) {
      Toast.error(err.message || 'Failed to publish post.');
    } finally {
      els.composerSubmitBtn.disabled = false;
      els.composerSubmitBtn.textContent = 'Post';
    }
  }

  // Open Messages View (Direct Messages)
  async function openMessagesView(targetUserId = null, partnerHint = null) {
    if (!State.isAuthenticated()) {
      openAuthModal();
      return;
    }

    State.update({ currentView: 'messages' });
    els.navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-nav') === 'messages'));
    els.mobileNavItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-nav') === 'messages'));

    els.composerCard.style.display = 'none';
    if (els.storiesCarousel) els.storiesCarousel.style.display = 'none';
    if (els.feedTabs && els.feedTabs[0]) els.feedTabs[0].parentElement.style.display = 'none';
    if (els.filterBanner) els.filterBanner.style.display = 'none';
    els.headerTitleText.textContent = 'Messages';

    els.feedContainer.innerHTML = '<div class="skeleton" style="height: 480px; border-radius: 16px; margin: 16px;"></div>';

    try {
      const convData = await API.messages.getConversations();
      const conversations = convData.conversations || [];
      const suggestedUsers = convData.suggestedUsers || [];

      let activePartner = null;
      let activeMessages = [];

      let selectedId = targetUserId;
      if (!selectedId && conversations.length > 0 && window.innerWidth > 768) {
        selectedId = conversations[0].partner.id;
      }

      if (selectedId) {
        try {
          const threadData = await API.messages.getThread(selectedId);
          activePartner = threadData.partner;
          activeMessages = threadData.messages || [];
        } catch (e) {
          if (partnerHint) activePartner = partnerHint;
        }
      }

      els.feedContainer.innerHTML = Components.renderMessagesView(
        conversations,
        activePartner,
        activeMessages,
        suggestedUsers
      );

      // Scroll messages container to bottom
      const msgScroll = document.getElementById('chat-messages-container');
      if (msgScroll) {
        msgScroll.scrollTop = msgScroll.scrollHeight;
      }

      // Update badges
      updateUnreadMessagesCount(conversations);

    } catch (err) {
      els.feedContainer.innerHTML = Components.renderEmptyState('Failed to load messages', err.message);
    }
  }

  async function checkUnreadMessages() {
    if (!State.isAuthenticated()) return;
    try {
      const convData = await API.messages.getConversations();
      updateUnreadMessagesCount(convData.conversations || []);
    } catch (e) {}
  }

  function updateUnreadMessagesCount(conversations) {
    let unreadTotal = 0;
    if (Array.isArray(conversations)) {
      unreadTotal = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
    }
    const msgBadge = document.getElementById('messages-nav-badge');
    const headerMsgBadge = document.getElementById('header-msg-badge');

    if (msgBadge) {
      if (unreadTotal > 0) {
        msgBadge.textContent = unreadTotal;
        msgBadge.style.display = 'inline-block';
      } else {
        msgBadge.style.display = 'none';
      }
    }
    if (headerMsgBadge) {
      if (unreadTotal > 0) {
        headerMsgBadge.textContent = unreadTotal;
        headerMsgBadge.style.display = 'inline-block';
      } else {
        headerMsgBadge.style.display = 'none';
      }
    }
  }

  // Open User Profile View
  async function openUserProfile(username) {
    State.update({ currentView: 'profile', profileUsername: username, profileTab: 'posts' });

    els.composerCard.style.display = 'none';
    if (els.storiesCarousel) els.storiesCarousel.style.display = 'none';
    els.feedTabs[0].parentElement.style.display = 'none';
    els.filterBanner.style.display = 'none';
    els.headerTitleText.textContent = `@${username}`;

    els.feedContainer.innerHTML = '<div class="skeleton" style="height: 320px; border-radius: 16px; margin: 20px;"></div>';

    try {
      const data = await API.users.getProfile(username);
      const profileHtml = Components.renderProfileHeader(data.profile, State.get().currentUser);
      els.feedContainer.innerHTML = `
        <div class="profile-view-container">
          ${profileHtml}
          <div class="posts-feed" id="profile-posts-container">
            ${Components.renderSkeletonPosts(2)}
          </div>
        </div>
      `;

      loadProfilePosts(username, 'posts');
    } catch (err) {
      els.feedContainer.innerHTML = Components.renderEmptyState('User not found', err.message);
    }
  }

  async function loadProfilePosts(username, subtab) {
    const container = document.getElementById('profile-posts-container');
    if (!container) return;
    container.innerHTML = Components.renderSkeletonPosts(2);

    try {
      const params = { username };
      const data = await API.posts.getFeed(params);

      if (data.posts.length === 0) {
        container.innerHTML = Components.renderEmptyState('No posts yet', `@${username} hasn't posted anything yet.`);
        return;
      }

      container.innerHTML = data.posts
        .map(p => Components.renderPostCard(p, State.get().currentUser))
        .join('');
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger-color); padding: 20px;">${err.message}</div>`;
    }
  }

  // Load Trending Topics
  async function loadTrendingTags() {
    try {
      const data = await API.posts.getTrendingTags();
      State.set('trendingTags', data.tags);

      if (!data.tags || data.tags.length === 0) {
        els.trendingList.innerHTML = '<div style="font-size: 13px; color: var(--text-muted);">No trends yet.</div>';
        return;
      }

      els.trendingList.innerHTML = data.tags.map(t => `
        <div class="trending-item" data-trending-tag="${t.name}">
          <div>
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Trending</div>
            <div class="trending-tag-name">#${Components.escapeHtml(t.name)}</div>
          </div>
          <span class="trending-count">${t.count} posts</span>
        </div>
      `).join('');
    } catch (err) {}
  }

  // Load Suggested Users & Populate Demo Switcher
  async function loadSuggestedUsers() {
    try {
      const data = await API.users.getSuggested();
      State.set('suggestedUsers', data.users);

      if (!data.users || data.users.length === 0) {
        els.whoToFollowList.innerHTML = '<div style="font-size: 13px; color: var(--text-muted);">No suggestions right now.</div>';
      } else {
        els.whoToFollowList.innerHTML = data.users
          .map(u => Components.renderUserCard(u, State.get().currentUser))
          .join('');
      }

      const demoUsers = [
        { username: 'alex_design', name: 'Alex' },
        { username: 'priya_codes', name: 'Priya' },
        { username: 'marcus_lens', name: 'Marcus' },
        { username: 'elena_ai', name: 'Elena' },
        { username: 'demo_user', name: 'Demo' }
      ];

      const currentUser = State.get().currentUser;
      const currentUsername = currentUser ? currentUser.username : 'demo_user';
      if (els.demoAccountsGrid) {
        els.demoAccountsGrid.innerHTML = demoUsers.map(u => `
          <button class="demo-chip ${u.username === currentUsername ? 'active' : ''}" data-demo-user="${u.username}">
            @${u.username}
          </button>
        `).join('');
      }
    } catch (err) {}
  }

  async function switchDemoAccount(username) {
    try {
      AudioFeedback.pop();
      const res = await API.auth.demo(username);
      State.set('currentUser', res.user);
      renderUserSidebar();
      if (els.demoAccountsGrid) {
        els.demoAccountsGrid.querySelectorAll('.demo-chip').forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-demo-user') === res.user.username);
        });
      }
      Toast.success(`Signed in as @${res.user.username}`);
      loadFeed();
      loadStories();
      loadNotifications();
      loadSuggestedUsers();
    } catch (err) {
      Toast.error(err.message || 'Failed to switch demo account.');
    }
  }

  function renderUserSidebar() {
    const user = State.get().currentUser;
    const btnLogout = document.getElementById('btn-sidebar-logout');
    const btnQuickEdit = document.getElementById('btn-sidebar-quick-edit');

    if (user) {
      els.currentUserAvatar.src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
      els.composerUserAvatar.src = els.currentUserAvatar.src;
      els.currentUserName.textContent = user.name;
      els.currentUserHandle.textContent = `@${user.username}`;
      if (btnLogout) btnLogout.style.display = 'flex';
      if (btnQuickEdit) btnQuickEdit.style.display = 'flex';
    } else {
      els.currentUserAvatar.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
      els.composerUserAvatar.src = els.currentUserAvatar.src;
      els.currentUserName.textContent = 'Sign In / Register';
      els.currentUserHandle.textContent = 'Create your account';
      if (btnLogout) btnLogout.style.display = 'none';
      if (btnQuickEdit) btnQuickEdit.style.display = 'none';
    }
  }

  async function handleSignOut() {
    AudioFeedback.pop();
    try {
      await API.auth.logout();
    } catch (e) {}
    State.set('currentUser', null);
    renderUserSidebar();
    loadFeed();
    loadStories();
    loadSuggestedUsers();
    Toast.info('Signed out. Create an account or sign in!');
    setTimeout(() => {
      openAuthModal();
    }, 400);
  }

  function updateFilterBanner() {
    const { filterTag, filterSearch } = State.get();
    if (filterTag) {
      els.filterText.textContent = `Posts tagged with #${filterTag}`;
      els.filterBanner.style.display = 'flex';
    } else if (filterSearch) {
      els.filterText.textContent = `Search results for "${filterSearch}"`;
      els.filterBanner.style.display = 'flex';
    } else {
      els.filterBanner.style.display = 'none';
    }
  }

  function renderSearchResults(users, query) {
    if (users.length === 0) {
      els.searchResultsDropdown.innerHTML = `
        <div style="padding: 10px; font-size: 13px; color: var(--text-muted); text-align: center;">
          Press Enter to search posts for "<strong>${Components.escapeHtml(query)}</strong>"
        </div>
      `;
      els.searchResultsDropdown.style.display = 'block';
      return;
    }

    els.searchResultsDropdown.innerHTML = `
      <div style="padding: 6px 10px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
        Users matching "${Components.escapeHtml(query)}"
      </div>
      ${users.map(u => `
        <div class="search-result-item" data-user="${Components.escapeHtml(u.username)}">
          <img src="${Components.escapeHtml(u.avatar)}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${Components.escapeHtml(u.name)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">@${Components.escapeHtml(u.username)}</div>
          </div>
        </div>
      `).join('')}
    `;
    els.searchResultsDropdown.style.display = 'block';
  }

  async function openStockPresetsModal() {
    try {
      const data = await API.upload.getPresets();
      const modal = createModal('Choose an Aesthetic Cover Photo', `
        <div class="presets-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-height: 340px; overflow-y: auto;">
          ${data.presets.map(p => `
            <div class="preset-card-item" data-preset-url="${Components.escapeHtml(p.url)}" style="position: relative; border-radius: 10px; overflow: hidden; cursor: pointer; height: 120px;">
              <img src="${Components.escapeHtml(p.url)}" alt="${Components.escapeHtml(p.label)}" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 6px 10px; background: linear-gradient(to top, rgba(0,0,0,0.85), transparent); font-size: 11px; font-weight: 700; color: #fff;">${Components.escapeHtml(p.label)}</div>
            </div>
          `).join('')}
        </div>
      `);

      modal.querySelectorAll('.preset-card-item').forEach(item => {
        item.addEventListener('click', () => {
          const url = item.getAttribute('data-preset-url');
          activeComposerImageUrl = url;
          activeComposerImageFile = null;
          els.composerImgPreview.src = url;
          els.composerImgPreviewWrapper.style.display = 'inline-block';
          closeModal();
          handleComposerInput();
          AudioFeedback.pop();
        });
      });
    } catch (err) {
      Toast.error('Failed to load presets.');
    }
  }

  function openEditProfileModal() {
    const user = State.get().currentUser;
    if (!user) {
      openAuthModal();
      return;
    }

    let selectedAvatarFile = null;
    let selectedAvatarUrl = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
    let selectedBannerFile = null;
    let selectedBannerUrl = user.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

    const avatarPresets = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    ];

    const modal = createModal('Edit Profile & Photo', `
      <form id="edit-profile-form" style="display: flex; flex-direction: column; gap: 18px;">

        <!-- 1. Avatar Picture Editor Section -->
        <div class="edit-profile-avatar-row">
          <img src="${Components.escapeHtml(selectedAvatarUrl)}" id="modal-avatar-preview-img" class="edit-profile-avatar-thumb" alt="Profile Picture Preview" />
          <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">Profile Picture</div>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <input type="file" id="edit-avatar-file-input" accept="image/*" style="display: none;" />
              <button type="button" class="btn-upload-file-pill" id="btn-trigger-avatar-file">
                📁 Upload Photo from PC
              </button>
            </div>
            <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 4px;">Or choose a quick preset:</div>
            <div class="avatar-quick-presets">
              ${avatarPresets.map((presetUrl, idx) => `
                <img src="${presetUrl}" class="avatar-preset-thumb ${presetUrl === selectedAvatarUrl ? 'active' : ''}" data-avatar-preset="${presetUrl}" title="Preset avatar ${idx + 1}" />
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 2. Cover Banner Editor Section -->
        <div style="display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Cover Banner</div>
            <input type="file" id="edit-banner-file-input" accept="image/*" style="display: none;" />
            <button type="button" class="util-btn" id="btn-trigger-banner-file" style="width: auto; padding: 5px 12px; font-size: 11px;">
              📁 Upload Banner from PC
            </button>
          </div>
          <div style="width: 100%; height: 90px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color);">
            <img src="${Components.escapeHtml(selectedBannerUrl)}" id="modal-banner-preview-img" style="width: 100%; height: 100%; object-fit: cover;" alt="Banner Preview" />
          </div>
        </div>

        <!-- 3. Profile Information Fields -->
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="edit-name" class="form-input" value="${Components.escapeHtml(user.name)}" required maxlength="50" />
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Bio</label>
            <span id="edit-bio-counter" style="font-size: 11px; color: var(--text-muted);">0/160</span>
          </div>
          <textarea id="edit-bio" class="form-textarea" placeholder="Tell the world about yourself and what you're working on..." maxlength="160">${Components.escapeHtml(user.bio || '')}</textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" id="edit-location" class="form-input" placeholder="e.g. Mumbai, India" value="${Components.escapeHtml(user.location || '')}" maxlength="40" />
          </div>
          <div class="form-group">
            <label class="form-label">Website</label>
            <input type="url" id="edit-website" class="form-input" placeholder="https://..." value="${Components.escapeHtml(user.website || '')}" />
          </div>
        </div>

        <button type="submit" id="btn-submit-profile-edit" class="btn-post-primary" style="margin-top: 6px;">
          Save Profile Changes
        </button>
      </form>
    `);

    const avatarFileInput = document.getElementById('edit-avatar-file-input');
    const btnTriggerAvatar = document.getElementById('btn-trigger-avatar-file');
    const avatarPreviewImg = document.getElementById('modal-avatar-preview-img');

    const bannerFileInput = document.getElementById('edit-banner-file-input');
    const btnTriggerBanner = document.getElementById('btn-trigger-banner-file');
    const bannerPreviewImg = document.getElementById('modal-banner-preview-img');

    const bioInput = document.getElementById('edit-bio');
    const bioCounter = document.getElementById('edit-bio-counter');
    bioCounter.textContent = `${bioInput.value.length}/160`;

    bioInput.addEventListener('input', () => {
      bioCounter.textContent = `${bioInput.value.length}/160`;
    });

    // 1. Avatar File Trigger
    btnTriggerAvatar.addEventListener('click', () => {
      AudioFeedback.pop();
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarPreviewImg.src = event.target.result;
        avatarPreviewImg.classList.add('heart-pop');
        setTimeout(() => avatarPreviewImg.classList.remove('heart-pop'), 400);
      };
      reader.readAsDataURL(file);
      AudioFeedback.pop();
      Toast.info('Photo selected! Click Save to apply.');
    });

    // Avatar Presets Click
    modal.querySelectorAll('[data-avatar-preset]').forEach(thumb => {
      thumb.addEventListener('click', () => {
        modal.querySelectorAll('.avatar-preset-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        selectedAvatarUrl = thumb.getAttribute('data-avatar-preset');
        selectedAvatarFile = null;
        avatarPreviewImg.src = selectedAvatarUrl;
        AudioFeedback.pop();
      });
    });

    // 2. Banner File Trigger
    btnTriggerBanner.addEventListener('click', () => {
      AudioFeedback.pop();
      bannerFileInput.click();
    });

    bannerFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedBannerFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        bannerPreviewImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
      AudioFeedback.pop();
    });

    // 3. Form Submit with Uploads
    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-profile-edit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Changes...';

      try {
        let finalAvatarUrl = selectedAvatarUrl;
        let finalBannerUrl = selectedBannerUrl;

        // If local avatar file was chosen, upload it first
        if (selectedAvatarFile) {
          const uploadRes = await API.upload.image(selectedAvatarFile);
          finalAvatarUrl = uploadRes.url;
        }

        // If local banner file was chosen, upload it
        if (selectedBannerFile) {
          const bannerRes = await API.upload.image(selectedBannerFile);
          finalBannerUrl = bannerRes.url;
        }

        const res = await API.users.updateProfile({
          name: document.getElementById('edit-name').value.trim(),
          bio: document.getElementById('edit-bio').value.trim(),
          location: document.getElementById('edit-location').value.trim(),
          website: document.getElementById('edit-website').value.trim(),
          avatar: finalAvatarUrl,
          banner: finalBannerUrl
        });

        // Update state
        State.set('currentUser', res.user);
        renderUserSidebar();
        closeModal();
        AudioFeedback.swoosh();
        Toast.success('Profile and profile picture updated! ✨');

        // Refresh views
        if (State.get().currentView === 'profile' && State.get().profileUsername === res.user.username) {
          openUserProfile(res.user.username);
        } else {
          loadFeed();
          loadStories();
        }
      } catch (err) {
        Toast.error(err.message || 'Failed to update profile.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Profile Changes';
      }
    });
  }

  async function openFollowersModal(userId, title) {
    const isFollowers = title === 'Followers';
    createModal(title, `
      <div id="followers-modal-list" style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
        <div class="skeleton" style="height: 50px;"></div>
      </div>
    `);

    try {
      const data = isFollowers
        ? await API.users.getFollowers(userId)
        : await API.users.getFollowing(userId);

      const list = isFollowers ? data.followers : data.following;
      const listEl = document.getElementById('followers-modal-list');

      if (list.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No ${title.toLowerCase()} yet.</div>`;
        return;
      }
      listEl.innerHTML = list.map(u => Components.renderUserCard(u, State.get().currentUser)).join('');
    } catch (err) {
      document.getElementById('followers-modal-list').innerHTML = `<div style="color: var(--danger-color);">${err.message}</div>`;
    }
  }

  function openShortcutsModal() {
    createModal('Keyboard Shortcuts', `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span>New Post / Compose</span>
          <kbd style="padding: 4px 8px; border-radius: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); font-weight: 700;">N</kbd>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span>Toggle Dark / Light Theme</span>
          <kbd style="padding: 4px 8px; border-radius: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); font-weight: 700;">T</kbd>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span>Quick Focus Search</span>
          <kbd style="padding: 4px 8px; border-radius: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); font-weight: 700;">/</kbd>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span>Close Active Modals / Drawers</span>
          <kbd style="padding: 4px 8px; border-radius: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); font-weight: 700;">Esc</kbd>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0;">
          <span>Show this Help Menu</span>
          <kbd style="padding: 4px 8px; border-radius: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); font-weight: 700;">?</kbd>
        </div>
      </div>
    `);
  }

  function openAuthModal() {
    let selectedRegAvatarFile = null;
    let selectedRegAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const avatarPresets = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    ];

    const modal = createModal('Join Haven', `
      <div style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 18px;">
        <button id="auth-tab-register" class="feed-tab active" style="flex: 1;">Create Account</button>
        <button id="auth-tab-login" class="feed-tab" style="flex: 1;">Sign In</button>
      </div>

      <!-- Registration Form (Default) -->
      <form id="form-auth-register" style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Avatar Selection -->
        <div style="display: flex; align-items: center; gap: 14px; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <img src="${selectedRegAvatarUrl}" id="reg-avatar-preview" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-primary); flex-shrink: 0;" alt="Avatar Preview" />
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Choose Profile Photo</div>
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <input type="file" id="reg-avatar-file-input" accept="image/*" style="display: none;" />
              <button type="button" id="btn-reg-upload-avatar" class="util-btn" style="width: auto; padding: 4px 10px; font-size: 11px;">
                📁 Upload Photo
              </button>
              <div style="display: flex; gap: 4px; align-items: center; margin-left: 2px;">
                ${avatarPresets.map((p, idx) => `
                  <img src="${p}" class="reg-avatar-preset-thumb ${p === selectedRegAvatarUrl ? 'active' : ''}" data-preset="${p}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid ${p === selectedRegAvatarUrl ? 'var(--accent-primary)' : 'transparent'};" title="Preset ${idx+1}" />
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="reg-name" class="form-input" placeholder="e.g. Sanjeet Chauhan" required maxlength="50" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" id="reg-username" class="form-input" placeholder="e.g. sanjeet_dev" required maxlength="25" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="reg-email" class="form-input" placeholder="name@email.com" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="reg-password" class="form-input" placeholder="At least 6 characters" minlength="6" required />
        </div>

        <div class="form-group">
          <label class="form-label">Bio (Optional)</label>
          <input type="text" id="reg-bio" class="form-input" placeholder="What are you working on or creating?" maxlength="120" />
        </div>

        <div id="reg-error-msg" class="form-error-msg" style="display: none; color: var(--danger-color); font-size: 12px; font-weight: 600;"></div>
        <button type="submit" id="btn-submit-register" class="btn-post-primary" style="margin-top: 4px; padding: 12px;">
          Create Account & Enter Haven ✦
        </button>
      </form>

      <!-- Sign In Form -->
      <form id="form-auth-login" style="display: none; flex-direction: column; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Username or Email</label>
          <input type="text" id="login-identifier" class="form-input" placeholder="Your username or email" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="login-password" class="form-input" placeholder="••••••••" required />
        </div>
        <div id="auth-error-msg" class="form-error-msg" style="display: none; color: var(--danger-color); font-size: 12px; font-weight: 600;"></div>
        <button type="submit" id="btn-submit-login" class="btn-post-primary" style="margin-top: 4px; padding: 12px;">
          Sign In to Account
        </button>
      </form>

      <!-- Guest / Demo Shortcut -->
      <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-subtle); text-align: center;">
        <span style="font-size: 12px; color: var(--text-muted);">Just testing around? </span>
        <button id="btn-quick-demo-login" type="button" style="background: none; border: none; color: var(--accent-primary); font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline;">
          Explore as Demo Guest (@demo_user)
        </button>
      </div>
    `);

    const tabRegister = document.getElementById('auth-tab-register');
    const tabLogin = document.getElementById('auth-tab-login');
    const formRegister = document.getElementById('form-auth-register');
    const formLogin = document.getElementById('form-auth-login');
    const btnQuickDemo = document.getElementById('btn-quick-demo-login');
    const authError = document.getElementById('auth-error-msg');
    const regError = document.getElementById('reg-error-msg');

    const regAvatarFileInput = document.getElementById('reg-avatar-file-input');
    const btnRegUploadAvatar = document.getElementById('btn-reg-upload-avatar');
    const regAvatarPreview = document.getElementById('reg-avatar-preview');

    // Tab Toggles
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.style.display = 'flex';
      formLogin.style.display = 'none';
      if (regError) regError.style.display = 'none';
    });

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'flex';
      formRegister.style.display = 'none';
      if (authError) authError.style.display = 'none';
    });

    // Avatar Presets Click
    modal.querySelectorAll('.reg-avatar-preset-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        modal.querySelectorAll('.reg-avatar-preset-thumb').forEach(t => t.style.borderColor = 'transparent');
        thumb.style.borderColor = 'var(--accent-primary)';
        selectedRegAvatarUrl = thumb.getAttribute('data-preset');
        selectedRegAvatarFile = null;
        regAvatarPreview.src = selectedRegAvatarUrl;
        AudioFeedback.pop();
      });
    });

    // Avatar PC File Upload
    if (btnRegUploadAvatar) {
      btnRegUploadAvatar.addEventListener('click', () => {
        AudioFeedback.pop();
        regAvatarFileInput.click();
      });
    }

    if (regAvatarFileInput) {
      regAvatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        selectedRegAvatarFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          regAvatarPreview.src = event.target.result;
          modal.querySelectorAll('.reg-avatar-preset-thumb').forEach(t => t.style.borderColor = 'transparent');
        };
        reader.readAsDataURL(file);
        AudioFeedback.pop();
      });
    }

    // Quick Demo Guest Login
    btnQuickDemo.addEventListener('click', async () => {
      try {
        const res = await API.auth.demo('demo_user');
        State.set('currentUser', res.user);
        renderUserSidebar();
        closeModal();
        AudioFeedback.swoosh();
        Toast.success(`Signed in as @${res.user.username}`);
        loadFeed();
        loadStories();
        loadNotifications();
        loadSuggestedUsers();
      } catch (err) {
        Toast.error(err.message || 'Demo login failed');
      }
    });

    // Form: Sign In
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.style.display = 'none';
      const submitBtn = document.getElementById('btn-submit-login');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await API.auth.login(identifier, password);
        State.set('currentUser', res.user);
        renderUserSidebar();
        closeModal();
        AudioFeedback.swoosh();
        Toast.success(`Welcome back, ${res.user.name}!`);
        loadFeed();
        loadStories();
        loadNotifications();
        loadSuggestedUsers();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Account';
        authError.textContent = err.message || 'Invalid credentials';
        authError.style.display = 'block';
      }
    });

    // Form: Register & Create Account
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      regError.style.display = 'none';
      const submitBtn = document.getElementById('btn-submit-register');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating your account...';

      const name = document.getElementById('reg-name').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const bio = document.getElementById('reg-bio') ? document.getElementById('reg-bio').value.trim() : '';

      try {
        let finalAvatar = selectedRegAvatarUrl;
        if (selectedRegAvatarFile) {
          const uploadRes = await API.upload.image(selectedRegAvatarFile);
          finalAvatar = uploadRes.url;
        }

        const res = await API.auth.register({
          name,
          username,
          email,
          password,
          avatar: finalAvatar,
          bio
        });

        State.set('currentUser', res.user);
        renderUserSidebar();
        closeModal();
        AudioFeedback.swoosh();
        Toast.success(`Welcome to Haven, ${res.user.name}! Account created ✨`);
        loadFeed();
        loadStories();
        loadNotifications();
        loadSuggestedUsers();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account & Enter Haven ✦';
        regError.textContent = err.message || 'Registration failed';
        regError.style.display = 'block';
      }
    });
  }

  function createModal(title, bodyHtml) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'active-modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">${Components.escapeHtml(title)}</h2>
          <button class="modal-close-btn" id="btn-close-modal">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    return backdrop;
  }

  function closeModal() {
    const existing = document.getElementById('active-modal-backdrop');
    if (existing) existing.remove();
  }

  return {
    init,
    openUserProfile,
    openMessagesView,
    openAuthModal,
    switchDemoAccount
  };
})();
