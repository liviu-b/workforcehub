import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

export const createSessionMiddleware = () => {
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'wfhub:sess:',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    name: 'wfhub.sid',
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
};
