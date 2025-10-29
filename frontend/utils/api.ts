// Prefer same-origin calls everywhere. Allow explicit override via envs (useful in local dev SSR).
const API_BASE = typeof window !== 'undefined'
  ? ''
  : (process.env.API_SERVER_URL
      || process.env.NEXT_PUBLIC_API_BASE
      || process.env.NEXT_PUBLIC_API_URL
      || '')

export async function api(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  // some endpoints return empty 204
  if (res.status === 204) return null
  return res.json()
}

export async function register(username: string, password: string) {
  return api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function login(username: string, password: string) {
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function createPost(title: string, mediaType: string, mediaUrl?: string, price?: number) {
  const body: any = { title, mediaType, mediaUrl }
  if (typeof price === 'number' && isFinite(price)) body.price = price
  return api('/api/posts', { method: 'POST', body: JSON.stringify(body) })
}

export async function listPosts() {
  return api('/api/posts')
}

export async function deletePost(postId: string) {
  return api(`/api/posts/${postId}`, { method: 'DELETE' })
}

export async function viewPost(postId: string) {
  return api(`/api/posts/${postId}/view`, { method: 'POST' })
}

// interactions
export async function likePost(postId: string) {
  return api(`/api/interactions/${postId}/like`, { method: 'POST' })
}

export async function repostPost(postId: string) {
  return api(`/api/interactions/${postId}/repost`, { method: 'POST' })
}

export async function bookmarkPost(postId: string) {
  return api(`/api/interactions/${postId}/bookmark`, { method: 'POST' })
}
export async function replyPost(postId: string, text: string) {
  return api(`/api/interactions/${postId}/reply`, { method: 'POST', body: JSON.stringify({ text }) })
}

export async function interactionStatus(postId: string) {
  return api(`/api/interactions/${postId}/status`)
}

// cart
export async function addToCart(item: { id: string; title: string; price?: number }) {
  return api('/api/cart/add', { method: 'POST', body: JSON.stringify(item) })
}

export async function getCart() {
  return api('/api/cart')
}

export async function checkoutCart() {
  return api('/api/cart/checkout', { method: 'POST' })
}

// profile data
export async function listBookmarks() { return api('/api/profile/bookmarks') }
export async function listReposts() { return api('/api/profile/reposts') }
export async function listReplies() { return api('/api/profile/replies') }

// users
export async function me() { return api('/api/users/me') }
export async function followUser(userId: string) { return api(`/api/users/follow/${userId}`, { method: 'POST' }) }
export async function unfollowUser(userId: string) { return api(`/api/users/unfollow/${userId}`, { method: 'POST' }) }
export async function listFollowers(userId: string) { return api(`/api/users/${userId}/followers`) }
export async function listFollowing(userId: string) { return api(`/api/users/${userId}/following`) }

// messages
export async function listConversations() { return api('/api/messages') }
export async function unreadCount() { return api('/api/messages/unread-count') }
export async function getThread(withUserId: string) { return api(`/api/messages/${withUserId}`) }
export async function sendMessage(withUserId: string, text: string) { return api(`/api/messages/${withUserId}`, { method: 'POST', body: JSON.stringify({ text }) }) }

export async function getNotifications() {
  return api('/api/notifications');
}

export async function checkUsernameAvailability(username: string) {
  return api(`/api/auth/username-available/${username}`);
}

const exported = { api, register, login, createPost, listPosts, deletePost, viewPost, likePost, repostPost, bookmarkPost, replyPost, interactionStatus, addToCart, getCart, checkoutCart, listBookmarks, listReposts, listReplies, me, followUser, unfollowUser, listFollowers, listFollowing, listConversations, unreadCount, getThread, sendMessage, getNotifications, checkUsernameAvailability };
export default exported;
