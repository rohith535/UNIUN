import { Router } from 'express'
import { authMiddleware } from '../utils/auth'
import { mem } from '../memory'
import { getMongoClient } from '../mongo'
import fs from 'fs'
import path from 'path'
import { ObjectId } from 'mongodb'
import AWS from 'aws-sdk'

const router = Router()

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Load avatar mapping (optional)
let avatarMap: Record<string, string> = {}
try {
  const p = path.resolve(__dirname, '..', '..', 'avatars', 'README.json')
  avatarMap = JSON.parse(fs.readFileSync(p, 'utf-8'))
} catch (e) { /* ignore load avatar map errors */ }

function getAvatarFor(username?: string) {
  if (!username) return '/avatars/veee.png'
  if (avatarMap[username]) return avatarMap[username]
  // default to veee.png for all unknown users
  return '/avatars/veee.png'
}

// User cards with counts: username, bio (if any), followers/following/posts counts
router.get('/cards', async (req: any, res: any) => {
  const sortParam = (req.query.sort || 'followers').toString()
  const dirParam = (req.query.dir || 'desc').toString().toLowerCase()
  const page = Math.max(1, parseInt((req.query.page || '1').toString(), 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit || '12').toString(), 10) || 12))
  const sortKey = ['followers','following','posts','username'].includes(sortParam) ? sortParam : 'followers'
  const sortDir = dirParam === 'asc' ? 'asc' : 'desc'
  try {
    const db = getMongoClient().db()
    const users = await db.collection('users').find({}, { projection: { password: 0 } } as any).limit(100).toArray()
    // If DB (or shim) returned nothing, fall back to memory users
    if (!users || users.length === 0) {
      const outMem = mem.users.slice(0, 100).map((u:any) => {
        const followersCount = mem.followers.filter(f => f.followeeId === String(u._id)).length
        const followingCount = mem.followers.filter(f => f.followerId === String(u._id)).length
        const postsCount = mem.posts.filter(p => String(p.ownerId) === String(u._id)).length
        return {
          id: u._id,
          username: u.username,
          avatarUrl: getAvatarFor(u.username),
          bio: (u as any).bio || null,
          followersCount,
          followingCount,
          postsCount,
        }
      })
      // Sort
      outMem.sort((a:any,b:any) => {
        if (sortKey === 'username') {
          const cmp = String(a.username || '').localeCompare(String(b.username || ''), undefined, { sensitivity: 'base' })
          return sortDir === 'asc' ? cmp : -cmp
        }
        const ka = sortKey==='followers'?a.followersCount: sortKey==='following'?a.followingCount: a.postsCount
        const kb = sortKey==='followers'?b.followersCount: sortKey==='following'?b.followingCount: b.postsCount
        const cmp = Number(ka) - Number(kb)
        return sortDir === 'asc' ? cmp : -cmp
      })
      const total = outMem.length
      const start = (page - 1) * limit
      const items = outMem.slice(start, start + limit)
      return res.json({ items, total })
    }
    const out = [] as any[]
    for (const u of users) {
      let followersCount = 0, followingCount = 0, postsCount = 0
      try {
        followersCount = await db.collection('follows').countDocuments({ followeeId: (u as any)._id })
      } catch {}
      try {
        followingCount = await db.collection('follows').countDocuments({ followerId: (u as any)._id })
      } catch {}
      try {
        postsCount = await db.collection('posts').countDocuments({ ownerId: (u as any)._id })
      } catch {}
      // add memory counts for dev fallback consistency
      const idStr = String((u as any)._id)
      followersCount += mem.followers.filter(f => String(f.followeeId) === idStr).length
      followingCount += mem.followers.filter(f => String(f.followerId) === idStr).length
      postsCount += mem.posts.filter(p => String(p.ownerId) === idStr).length
      out.push({
        id: (u as any)._id,
        username: (u as any).username,
        avatarUrl: getAvatarFor((u as any).username),
        bio: (u as any).bio || null,
        followersCount,
        followingCount,
        postsCount,
      })
    }
    // Sort
    out.sort((a:any,b:any) => {
      if (sortKey === 'username') {
        const cmp = String(a.username || '').localeCompare(String(b.username || ''), undefined, { sensitivity: 'base' })
        return sortDir === 'asc' ? cmp : -cmp
      }
      const ka = sortKey==='followers'?a.followersCount: sortKey==='following'?a.followingCount: a.postsCount
      const kb = sortKey==='followers'?b.followersCount: sortKey==='following'?b.followingCount: b.postsCount
      const cmp = Number(ka) - Number(kb)
      return sortDir === 'asc' ? cmp : -cmp
    })
    const total = out.length
    const start = (page - 1) * limit
    const items = out.slice(start, start + limit)
    return res.json({ items, total })
  } catch (e) {
    // fallback to memory
    const out = mem.users.slice(0, 100).map((u:any) => {
      const followersCount = mem.followers.filter(f => f.followeeId === String(u._id)).length
      const followingCount = mem.followers.filter(f => f.followerId === String(u._id)).length
      const postsCount = mem.posts.filter(p => String(p.ownerId) === String(u._id)).length
      return {
        id: u._id,
        username: u.username,
        avatarUrl: getAvatarFor(u.username),
        bio: (u as any).bio || null,
        followersCount,
        followingCount,
        postsCount,
      }
    })
    out.sort((a:any,b:any) => {
      if (sortKey === 'username') {
        const cmp = String(a.username || '').localeCompare(String(b.username || ''), undefined, { sensitivity: 'base' })
        return sortDir === 'asc' ? cmp : -cmp
      }
      const ka = sortKey==='followers'?a.followersCount: sortKey==='following'?a.followingCount: a.postsCount
      const kb = sortKey==='followers'?b.followersCount: sortKey==='following'?b.followingCount: b.postsCount
      const cmp = Number(ka) - Number(kb)
      return sortDir === 'asc' ? cmp : -cmp
    })
    const total = out.length
    const start = (page - 1) * limit
    const items = out.slice(start, start + limit)
    return res.json({ items, total })
  }
})

// List users (basic)
router.get('/', async (req: any, res: any) => {
  try {
    const db = getMongoClient().db()
    const docs = await db.collection('users').find({}, { projection: { password: 0 } } as any).limit(50).toArray()
    if (!docs || docs.length === 0) {
      // shim likely returned empty; use memory fallback
      return res.json(mem.users.map(u => ({ id: u._id, _id: u._id, username: u.username, createdAt: u.createdAt, avatarUrl: getAvatarFor(u.username) })))
    }
    return res.json(docs.map((u:any)=> ({ id: u._id, _id: u._id, username: u.username, avatarUrl: getAvatarFor(u.username) })))
  } catch (e) {
    // fallback to memory (exclude password)
    return res.json(mem.users.map(u => ({ id: u._id, _id: u._id, username: u.username, createdAt: u.createdAt, avatarUrl: getAvatarFor(u.username) })))
  }
})

// Lookup minimal profile for a set of user IDs
router.get('/lookup', async (req: any, res: any) => {
  const idsRaw = (req.query.ids || '').toString()
  const ids = idsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
  if (ids.length === 0) return res.json([])
  const out: any[] = []
  try {
    const db = getMongoClient().db()
    const docs = await db.collection('users').find({ _id: { $in: ids as any } }).project({ password: 0 }).toArray()
    for (const u of docs) out.push({ id: u._id, _id: u._id, username: (u as any).username, avatarUrl: getAvatarFor((u as any).username) })
  } catch (e) { /* ignore DB lookup */ }
  // include any from memory not found above
  for (const id of ids) {
    if (!out.find(p => String(p.id) === String(id))) {
      const m = mem.users.find(u => String(u._id) === String(id))
      if (m) out.push({ id: m._id, _id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
    }
  }
  res.json(out)
})

// Current user profile (id, username)
router.get('/me', authMiddleware, async (req: any, res: any) => {
  const userId = req.user.sub
  // try to get from mem first
  const m = mem.users.find(u => String(u._id) === String(userId))
  if (m) return res.json({ id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
  // try DB
  try {
    const db = getMongoClient().db()
    // Allow both string and ObjectId _id schemas
    let query: any = { _id: userId as any }
    // If looks like a 24-char hex, try ObjectId as well
    if (typeof userId === 'string' && /^[a-fA-F0-9]{24}$/.test(userId)) {
      try { query = { $or: [ { _id: new ObjectId(userId) }, { _id: userId } ] } } catch { /* ignore invalid ObjectId */ }
    }
    const user = await db.collection('users').findOne(query)
    if (user) return res.json({ id: user._id, username: (user as any).username, avatarUrl: getAvatarFor((user as any).username) })
  } catch (e) {
    // ignore
  }
  return res.status(404).json({ error: 'not found' })
})

// Follow a user
router.post('/follow/:userId', authMiddleware, async (req: any, res: any) => {
  const followerId = String(req.user.sub)
  const followeeId = String(req.params.userId)
  if (followerId === followeeId) return res.status(400).json({ error: 'cannot follow self' })

  // memory record (avoid duplicates)
  const already = mem.followers.find((f: any) => f.followerId === followerId && f.followeeId === followeeId)
  if (!already) mem.followers.push({ followerId, followeeId, createdAt: new Date() })

  // DB best-effort
  try {
    const db = getMongoClient().db()
    await db.collection('follows').updateOne({ followerId, followeeId }, { $set: { followerId, followeeId, createdAt: new Date() } }, { upsert: true })
    // Create notification
    const notificationId = new ObjectId().toHexString();
    const notification = {
      TableName: 'Notifications',
      Item: {
        userId: followeeId,
        createdAt: Date.now(),
        notificationId,
        type: 'follow',
        fromUserId: followerId,
        read: false,
      },
    };
    await dynamodb.put(notification).promise();
  } catch (e) { /* ignore */ }

  res.json({ ok: true })
})

// Unfollow a user
router.post('/unfollow/:userId', authMiddleware, async (req: any, res: any) => {
  const followerId = String(req.user.sub)
  const followeeId = String(req.params.userId)
  const idx = mem.followers.findIndex((f: any) => f.followerId === followerId && f.followeeId === followeeId)
  if (idx >= 0) mem.followers.splice(idx, 1)
  try {
    const db = getMongoClient().db()
    await db.collection('follows').deleteOne({ followerId, followeeId })
  } catch (e) { /* ignore */ }
  res.json({ ok: true })
})

// List followers
router.get('/:id/followers', async (req: any, res: any) => {
  const id = String(req.params.id)
  // Combine DB and memory
  let list: any[] = mem.followers.filter((f: any) => String(f.followeeId) === id)
  try {
    const db = getMongoClient().db()
    const docs = await db.collection('follows').find({ followeeId: (id as any) }).toArray()
    list = list.concat(docs.map((d:any) => ({ followerId: String(d.followerId), followeeId: String(d.followeeId), createdAt: d.createdAt || new Date() })))
  } catch {}
  // de-duplicate by followerId
  const seen = new Set<string>()
  list = list.filter((f:any) => { const k = String(f.followerId); if (seen.has(k)) return false; seen.add(k); return true })
  if (String(req.query.expand) === '1' || String(req.query.expand).toLowerCase() === 'true') {
    const ids = Array.from(new Set(list.map((f:any)=> f.followerId)))
    const profiles: any[] = []
    try {
      const db = getMongoClient().db()
      const docs = await db.collection('users').find({ _id: { $in: ids as any } }).project({ password: 0 }).toArray()
      for (const u of docs) profiles.push({ id: u._id, username: (u as any).username, avatarUrl: getAvatarFor((u as any).username) })
  } catch (e) { /* ignore DB expand */ }
    for (const uid of ids) {
      if (!profiles.find(p => String(p.id) === String(uid))) {
        const m = mem.users.find(u => String(u._id) === String(uid))
        if (m) profiles.push({ id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
      }
    }
    return res.json(profiles)
  }
  res.json(list)
})

// List following
router.get('/:id/following', async (req: any, res: any) => {
  const id = String(req.params.id)
  let list: any[] = mem.followers.filter((f: any) => String(f.followerId) === id)
  try {
    const db = getMongoClient().db()
    const docs = await db.collection('follows').find({ followerId: (id as any) }).toArray()
    list = list.concat(docs.map((d:any) => ({ followerId: String(d.followerId), followeeId: String(d.followeeId), createdAt: d.createdAt || new Date() })))
  } catch {}
  const seen = new Set<string>()
  list = list.filter((f:any) => { const k = String(f.followeeId); if (seen.has(k)) return false; seen.add(k); return true })
  if (String(req.query.expand) === '1' || String(req.query.expand).toLowerCase() === 'true') {
    const ids = Array.from(new Set(list.map((f:any)=> f.followeeId)))
    const profiles: any[] = []
    try {
      const db = getMongoClient().db()
      const docs = await db.collection('users').find({ _id: { $in: ids as any } }).project({ password: 0 }).toArray()
      for (const u of docs) profiles.push({ id: u._id, username: (u as any).username, avatarUrl: getAvatarFor((u as any).username) })
  } catch (e) { /* ignore DB expand */ }
    for (const uid of ids) {
      if (!profiles.find(p => String(p.id) === String(uid))) {
        const m = mem.users.find(u => String(u._id) === String(uid))
        if (m) profiles.push({ id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
      }
    }
    return res.json(profiles)
  }
  res.json(list)
})

// User meta: id, username, avatarUrl, bio, followersCount, followingCount, postsCount
router.get('/:id/meta', async (req: any, res: any) => {
  const id = String(req.params.id)
  try {
    const db = getMongoClient().db()
    const user = await db.collection('users').findOne({ _id: (id as any) }, { projection: { password: 0 } } as any)
    if (user) {
      let followersCount = 0, followingCount = 0, postsCount = 0
      try { followersCount = await db.collection('follows').countDocuments({ followeeId: (user as any)._id }) } catch {}
      try { followingCount = await db.collection('follows').countDocuments({ followerId: (user as any)._id }) } catch {}
      try { postsCount = await db.collection('posts').countDocuments({ ownerId: (user as any)._id }) } catch {}
      return res.json({ id: (user as any)._id, username: (user as any).username, avatarUrl: getAvatarFor((user as any).username), bio: (user as any).bio || null, followersCount, followingCount, postsCount })
    }
  } catch (e) { /* ignore and fall back */ }
  // Memory fallback
  const m = mem.users.find(u => String(u._id) === id)
  if (m) {
    const followersCount = mem.followers.filter(f => String(f.followeeId) === id).length
    const followingCount = mem.followers.filter(f => String(f.followerId) === id).length
    const postsCount = mem.posts.filter(p => String(p.ownerId) === id).length
    return res.json({ id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username), bio: (m as any).bio || null, followersCount, followingCount, postsCount })
  }
  return res.status(404).json({ error: 'not found' })
})

// Alias: GET /:id returns same meta
router.get('/:id', async (req: any, res: any) => {
  // delegate to /:id/meta logic
  (req.url = '/meta'), (req.params = { ...req.params })
  return (router as any).handle(req, res)
})

export default router
