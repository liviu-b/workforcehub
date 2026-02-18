import { Router } from 'express';
import { Resend } from 'resend';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth.js';

export const apiRouter = Router();

apiRouter.use(requireAuth);

const tableMap = {
  shifts: prisma.shift,
  employees: prisma.employee,
  jobs: prisma.job,
  materials: prisma.material,
};

const getTableClient = (tableName) => tableMap[tableName];

apiRouter.get('/bootstrap', async (req, res) => {
  const appId = req.session.tenantId;
  const userId = req.session.userId;

  if (!appId) {
    return res.status(400).json({ error: 'Missing tenant in session' });
  }

  try {
    const [shifts, employees, jobs, materials, profile] = await Promise.all([
      prisma.shift.findMany({ where: { app_id: appId } }),
      prisma.employee.findMany({ where: { app_id: appId } }),
      prisma.job.findMany({ where: { app_id: appId } }),
      prisma.material.findMany({ where: { app_id: appId } }),
      prisma.userProfile.findUnique({
        where: {
          app_id_user_id: {
            app_id: appId,
            user_id: userId,
          },
        },
      }),
    ]);

    return res.json({
      user: { id: userId },
      userName: profile?.name || 'Utilizator',
      shifts,
      employees,
      jobs,
      materials,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load bootstrap data' });
  }
});

apiRouter.put('/user-profile', async (req, res) => {
  const { name } = req.body;
  const appId = req.session.tenantId;

  if (!appId) {
    return res.status(400).json({ error: 'Missing tenant in session' });
  }

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: {
        app_id_user_id: {
          app_id: appId,
          user_id: req.session.userId,
        },
      },
      update: {
        name: name.trim(),
      },
      create: {
        app_id: appId,
        user_id: req.session.userId,
        name: name.trim(),
      },
    });

    return res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to upsert profile' });
  }
});

apiRouter.post('/:tableName', async (req, res) => {
  const tableClient = getTableClient(req.params.tableName);
  if (!tableClient) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  const appId = req.session.tenantId;
  if (!appId) {
    return res.status(400).json({ error: 'Missing tenant in session' });
  }

  try {
    const payload = req.body || {};
    const created = await tableClient.create({
      data: {
        ...payload,
        app_id: appId,
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Create failed' });
  }
});

apiRouter.patch('/:tableName/:id', async (req, res) => {
  const tableClient = getTableClient(req.params.tableName);
  if (!tableClient) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  const { id } = req.params;
  const appId = req.session.tenantId;
  const { updates } = req.body;

  if (!appId) {
    return res.status(400).json({ error: 'Missing tenant in session' });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Updates are required' });
  }

  const safeUpdates = { ...updates };
  delete safeUpdates.app_id;
  delete safeUpdates.id;

  try {
    const updateResult = await tableClient.updateMany({
      where: { id, app_id: appId },
      data: safeUpdates,
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const updated = await tableClient.findFirst({ where: { id, app_id: appId } });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Update failed' });
  }
});

apiRouter.delete('/:tableName/:id', async (req, res) => {
  const tableClient = getTableClient(req.params.tableName);
  if (!tableClient) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  const { id } = req.params;
  const appId = req.session.tenantId;

  if (!appId) {
    return res.status(400).json({ error: 'Missing tenant in session' });
  }

  try {
    const deleteResult = await tableClient.deleteMany({
      where: { id, app_id: appId },
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

apiRouter.post('/notifications/shift-approved', async (req, res) => {
  const { shiftTitle, approvedBy, date, recipientEmail } = req.body;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
  }

  try {
    const resend = new Resend(resendApiKey);
    const toEmail = recipientEmail || process.env.NOTIFICATION_FALLBACK_RECIPIENT;

    const data = await resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL || 'onboarding@resend.dev',
      to: toEmail,
      subject: `✅ Raport Aprobat: ${shiftTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">Raport Finalizat</h2>
          <p>Raportul pentru lucrarea <strong>${shiftTitle}</strong> a fost aprobat și închis.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Data lucrării:</strong> ${date}</p>
          <p><strong>Semnat de:</strong> ${approvedBy}</p>
        </div>
      `,
    });

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Notification failed' });
  }
});
