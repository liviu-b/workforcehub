export const requireAuth = (req, res, next) => {
  if (!req.session?.userId || !req.session?.tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};
