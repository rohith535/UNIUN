import express from 'express';
import cors from 'cors';
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { setupMetrics, register } from './metrics';
import authRoutes from './routes/auth'
import postsRoutes from './routes/posts'
import mediaRoutes from './routes/media'
import paymentsRoutes from './routes/payments'
import interactionsRoutes from './routes/interactions'
import cartRoutes from './routes/cart'
import turnRoutes from './routes/turn'
import devRoutes from './routes/dev'
import profileRoutes from './routes/profile'
import searchRoutes from './routes/search'
import usersRoutes from './routes/users'
import messagesRoutes from './routes/messages'
import notificationsRoutes from './routes/notifications'
import 'express-async-errors'
import path from 'path'
import os from 'os'

const app = express();
app.set('trust proxy', 1)
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}))
app.use(rateLimit({ windowMs: 60 * 1000, max: 600 }))
app.use(express.json());
// Lightweight request logger for debugging in ECS
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[req] ${req.method} ${req.path}`)
  }
  next()
})
// Serve uploads from both possible locations (dist/../uploads and dist/../../uploads) to cover
// dev and docker layouts; first existing path will serve.
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))
app.use('/uploads', express.static(path.resolve(__dirname, '..', '..', 'uploads')))
app.use('/avatars', express.static(path.join(__dirname, '..', 'avatars')))

setupMetrics();

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});
// Alias under /api for ALB path routing convenience
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok' })
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/interactions', interactionsRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/turn', turnRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/notifications', notificationsRoutes)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: any, res: any, next: any) => {
  try {
    console.error(`[error] ${req?.method || ''} ${req?.path || ''}`)
    if (err?.stack) console.error(err.stack)
    else console.error(err)
  } catch (e) {
    console.error(err)
  }
  res.status(500).json({ error: 'internal' })
})

export default app
