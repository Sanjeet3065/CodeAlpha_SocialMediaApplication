// Haven Application State Store
const State = (() => {
  const listeners = [];

  const state = {
    currentUser: API.getStoredUser(),
    currentView: 'feed', // 'feed' | 'profile' | 'explore'
    feedTab: 'for_you',  // 'for_you' | 'following' | 'trending' | 'bookmarks'
    filterTag: null,
    filterSearch: '',
    profileUsername: null,
    profileTab: 'posts',
    posts: [],
    storyGroups: [],
    notifications: [],
    unreadNotifsCount: 0,
    conversations: [],
    activeChatPartner: null,
    chatMessages: [],
    unreadMessagesCount: 0,
    trendingTags: [],
    suggestedUsers: [],
    theme: localStorage.getItem('haven_theme') || localStorage.getItem('pulse_theme') || 'cream',
    composerImage: null,
    isSoundEnabled: true
  };

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  function notify(changedKey, value) {
    listeners.forEach(fn => fn(state, changedKey, value));
  }

  return {
    get: () => state,
    set(key, value) {
      state[key] = value;
      notify(key, value);
    },
    update(obj) {
      Object.assign(state, obj);
      notify('batch', obj);
    },
    subscribe,

    isAuthenticated() {
      return Boolean(state.currentUser && API.getToken());
    }
  };
})();
