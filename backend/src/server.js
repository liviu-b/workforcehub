import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createSessionMiddleware, redisClient } from './lib/session.js';
import { authRouter } from './routes/auth.js';
import { apiRouter } from './routes/api.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(createSessionMiddleware());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/api', apiRouter);

const start = async () => {
  try {
    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET is required');
    }

    await redisClient.connect();

    app.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
};

start();
