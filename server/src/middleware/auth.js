import jwt from 'jsonwebtoken';

function getSecret() {
  return process.env.JWT_SECRET || 'os_platform_dev_jwt_secret_2026';
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id || user.id),
      email: user.email,
      name: user.name,
      role: user.role || 'student'
    },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, getSecret());
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    try {
      const payload = jwt.verify(token, getSecret());
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role
      };
    } catch {
      // Ignore invalid token for optional auth routes
    }
  }
  return next();
}
