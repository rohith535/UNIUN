import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { saveDevData } from '../dev-storage'
import { mem } from '../memory'
import { getMongoClient } from '../mongo'
import { authMiddleware } from '../utils/auth'

const router = Router()

// Get interaction status for a post for current user
router.get('/:postId/status', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  const userId = String(req.user.sub)
  const [like, repost, bookmark] = await Promise.all([
    db.collection('likes').findOne({ userId, postId }),
    db.collection('reposts').findOne({ userId, postId }),
    db.collection('bookmarks').findOne({ userId, postId }),
  ])
  res.json({ ok: true, liked: !!like, reposted: !!repost, bookmarked: !!bookmark })
})

router.post('/:postId/like', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  const userId = String(req.user.sub)
  const postIdStr = String(postId)
  const idFilters: any[] = [{ _id: postIdStr }]
  if (ObjectId.isValid(postIdStr)) idFilters.push({ _id: new ObjectId(postIdStr) })
  const post = await db.collection('posts').findOne({ $or: idFilters })
  // Toggle like: if like exists, remove and decrement; else add and increment
  const existing = await db.collection('likes').findOne({ userId, postId: postIdStr })
  if (existing) {
    await db.collection('likes').deleteOne({ userId, postId: postIdStr })
    await db.collection('posts').updateOne({ $or: idFilters }, { $inc: { likes: -1 } })
    saveDevData()
    const post = await db.collection('posts').findOne({ $or: idFilters }, { projection: { likes: 1 } })
    return res.json({ ok: true, liked: false, likes: Math.max(0, Number(post?.likes || 0)) })
  } else {
    await db.collection('likes').insertOne({ userId, postId: postIdStr, createdAt: new Date() })
    await db.collection('posts').updateOne({ $or: idFilters }, { $inc: { likes: 1 } })
    if (post && post.userId && post.userId !== userId) {
      await db.collection('notifications').insertOne({
        userId: post.userId,
        fromUserId: userId,
        type: 'like',
        postId: postIdStr,
        createdAt: new Date(),
      })
    }
    saveDevData()
    const postAfter = await db.collection('posts').findOne({ $or: idFilters }, { projection: { likes: 1 } })
    return res.json({ ok: true, liked: true, likes: Math.max(0, Number(postAfter?.likes || 0)) })
  }
})

router.post('/:postId/repost', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  const userId = String(req.user.sub)
  const postIdStr = String(postId)
  const idFilters: any[] = [{ _id: postIdStr }]
  if (ObjectId.isValid(postIdStr)) idFilters.push({ _id: new ObjectId(postIdStr) })
  const post = await db.collection('posts').findOne({ $or: idFilters })
  // Toggle repost: if repost exists, remove and decrement; else add and increment
  const existing = await db.collection('reposts').findOne({ userId, postId: postIdStr })
  if (existing) {
    await db.collection('reposts').deleteOne({ userId, postId: postIdStr })
    await db.collection('posts').updateOne({ $or: idFilters }, { $inc: { reposts: -1 } })
    // update memory list
    const idx = mem.reposts.findIndex((r:any)=> r.userId===userId && r.postId===postIdStr)
    if (idx>=0) mem.reposts.splice(idx,1)
    saveDevData()
    const post = await db.collection('posts').findOne({ $or: idFilters }, { projection: { reposts: 1 } })
    return res.json({ ok: true, reposted: false, reposts: Math.max(0, Number(post?.reposts || 0)) })
  } else {
    await db.collection('reposts').insertOne({ userId, postId: postIdStr, createdAt: new Date() })
    await db.collection('posts').updateOne({ $or: idFilters }, { $inc: { reposts: 1 } })
    if (post && post.userId && post.userId !== userId) {
      await db.collection('notifications').insertOne({
        userId: post.userId,
        fromUserId: userId,
        type: 'repost',
        postId: postIdStr,
        createdAt: new Date(),
      })
    }
    mem.reposts.push({ userId, postId: postIdStr, createdAt: new Date() })
    saveDevData()
    const postAfter = await db.collection('posts').findOne({ $or: idFilters }, { projection: { reposts: 1 } })
    return res.json({ ok: true, reposted: true, reposts: Math.max(0, Number(postAfter?.reposts || 0)) })
  }
})

router.post('/:postId/bookmark', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const userId = String(req.user.sub)
  const postId = req.params.postId
  const existing = await db.collection('bookmarks').findOne({ userId, postId })
  if (existing) {
    await db.collection('bookmarks').deleteOne({ userId, postId })
    saveDevData()
    return res.json({ ok: true, bookmarked: false })
  } else {
    await db.collection('bookmarks').updateOne({ userId, postId }, { $set: { userId, postId, createdAt: new Date() } }, { upsert: true })
    saveDevData()
    return res.json({ ok: true, bookmarked: true })
  }
})

// simple reply to a post
router.post('/:postId/reply', authMiddleware, async (req: any, res: any) => {
  const { text } = req.body
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' })
  const postId = req.params.postId
  const postIdStr = String(postId)
  const idFilters: any[] = [{ _id: postIdStr }]
  if (ObjectId.isValid(postIdStr)) idFilters.push({ _id: new ObjectId(postIdStr) })
  const post = await db.collection('posts').findOne({ $or: idFilters })
  mem.replies.push({ userId: req.user.sub, postId: postIdStr, text, createdAt: new Date() })
  // bump replies count on post in memory shim path
  if (ObjectId.isValid(postIdStr)) idFilters.push({ _id: new ObjectId(postIdStr) })
  await getMongoClient().db().collection('posts').updateOne({ $or: idFilters }, { $inc: { replies: 1 } })
  if (post && post.userId && post.userId !== req.user.sub) {
    await db.collection('notifications').insertOne({
      userId: post.userId,
      fromUserId: req.user.sub,
      type: 'reply',
      postId: postIdStr,
      createdAt: new Date(),
    })
  }
  saveDevData()
  res.json({ ok: true })
})

export default router
