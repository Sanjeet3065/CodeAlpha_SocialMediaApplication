// Haven API Client
const API = (() => {
  const TOKEN_KEY = 'haven_token';
  const USER_KEY = 'haven_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('pulse_token');
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('pulse_token');
    }
  }

  function getStoredUser() {
    try {
      const data = localStorage.getItem(USER_KEY) || localStorage.getItem('pulse_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function setStoredUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('pulse_user');
    }
  }

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
    const headers = options.headers || {};

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    getStoredUser,
    setStoredUser,

    // Auth endpoints
    auth: {
      async login(identifier, password) {
        const data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password })
        });
        setToken(data.token);
        setStoredUser(data.user);
        return data;
      },
      async register(userData) {
        const data = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
        setToken(data.token);
        setStoredUser(data.user);
        return data;
      },
      async demo(username = 'demo_user') {
        const data = await request('/auth/demo', {
          method: 'POST',
          body: JSON.stringify({ username })
        });
        setToken(data.token);
        setStoredUser(data.user);
        return data;
      },
      async me() {
        const data = await request('/auth/me');
        setStoredUser(data.user);
        return data.user;
      },
      async logout() {
        try {
          await request('/auth/logout', { method: 'POST' });
        } catch (e) {}
        setToken(null);
        setStoredUser(null);
      }
    },

    // Posts endpoints
    posts: {
      getFeed(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/posts?${query}`);
      },
      getTrendingTags() {
        return request('/posts/trending/tags');
      },
      get(id) {
        return request(`/posts/${id}`);
      },
      create(data) {
        return request('/posts', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      delete(id) {
        return request(`/posts/${id}`, {
          method: 'DELETE'
        });
      },
      toggleLike(id, reaction = 'heart') {
        return request(`/posts/${id}/like`, {
          method: 'POST',
          body: JSON.stringify({ reaction })
        });
      },
      votePoll(id, optionIndex) {
        return request(`/posts/${id}/poll-vote`, {
          method: 'POST',
          body: JSON.stringify({ optionIndex })
        });
      },
      toggleBookmark(id) {
        return request(`/posts/${id}/bookmark`, {
          method: 'POST'
        });
      }
    },

    // Stories endpoints
    stories: {
      getAll() {
        return request('/stories');
      },
      add(media_url, caption) {
        return request('/stories', {
          method: 'POST',
          body: JSON.stringify({ media_url, caption })
        });
      }
    },

    // Notifications endpoints
    notifications: {
      getAll() {
        return request('/notifications');
      },
      markAllRead() {
        return request('/notifications/read-all', {
          method: 'POST'
        });
      }
    },

    // Direct Messages endpoints
    messages: {
      getConversations() {
        return request('/messages/conversations');
      },
      getThread(userId) {
        return request(`/messages/${userId}`);
      },
      sendMessage(userId, content) {
        return request(`/messages/${userId}`, {
          method: 'POST',
          body: JSON.stringify({ content })
        });
      },
      markRead(userId) {
        return request(`/messages/read/${userId}`, {
          method: 'POST'
        });
      }
    },

    // Comments endpoints
    comments: {
      getForPost(postId) {
        return request(`/comments/post/${postId}`);
      },
      add(postId, content) {
        return request(`/comments/post/${postId}`, {
          method: 'POST',
          body: JSON.stringify({ content })
        });
      },
      delete(id) {
        return request(`/comments/${id}`, {
          method: 'DELETE'
        });
      }
    },

    // Users endpoints
    users: {
      getProfile(username) {
        return request(`/users/profile/${encodeURIComponent(username)}`);
      },
      toggleFollow(userId) {
        return request(`/users/${userId}/follow`, {
          method: 'POST'
        });
      },
      getFollowers(userId) {
        return request(`/users/${userId}/followers`);
      },
      getFollowing(userId) {
        return request(`/users/${userId}/following`);
      },
      getSuggested() {
        return request('/users/suggested/list');
      },
      updateProfile(data) {
        return request('/users/profile', {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      },
      search(q) {
        return request(`/users/search/query?q=${encodeURIComponent(q)}`);
      }
    },

    // Media upload
    upload: {
      async image(file) {
        const formData = new FormData();
        formData.append('image', file);
        return request('/upload/image', {
          method: 'POST',
          body: formData
        });
      },
      getPresets() {
        return request('/upload/presets');
      }
    }
  };
})();
