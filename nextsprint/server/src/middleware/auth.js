// JWT auth middleware — attach to any route that requires a logged-in user.
// Expects: Authorization: Bearer <token>
import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, email }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
