import { Router } from 'express'
import { notificationsProcessed } from '../metrics';

const router = Router()

export default function(wss: any) {
  router.post('/broadcast', (req, res) => {
    const { userId, ...message } = req.body;
    if (userId) {
      wss.broadcast(userId, message);
    }
    res.status(204).send();
  });
  return router;
}
