import { Router } from 'express';
import { getMongoClient } from '../mongo';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', authMiddleware, async (req: any, res) => {
  const client = getMongoClient();
  const db = client.db();
  const userId = String(req.user.sub);

  const notifications = await db.collection('notifications').find({ userId }).sort({ createdAt: -1 }).toArray();

  res.json(notifications);
});

export default router;
