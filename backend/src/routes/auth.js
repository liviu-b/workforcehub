import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const authRouter = Router();

authRouter.post('/anonymous', async (req, res) => {
  const tenantId = String(req.body?.appId || '').trim();
  if (!tenantId) {
    return res.status(400).json({ error: 'appId is required' });
  }

  try {
    const user = await prisma.user.create({ data: {} });
    req.session.userId = user.id;
    req.session.tenantId = tenantId;
    return res.status(201).json({ user: { id: user.id }, tenantId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create anonymous session' });
  }
});

authRouter.get('/session', async (req, res) => {
  try {
    const userId = req.session?.userId;
    const tenantId = req.session?.tenantId;
    if (!userId || !tenantId) {
      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    return res.json({ user: { id: user.id }, tenantId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('wfhub.sid');
    res.status(204).send();
  });
});
