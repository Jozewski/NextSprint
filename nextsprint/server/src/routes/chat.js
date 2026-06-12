import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

const initialsFor = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const publicMessageFrom = (row) => {
  const mentions = db
    .prepare(
      `SELECT cm.user_id AS id, COALESCE(u.name, cm.username) AS name, cm.username
       FROM chat_mentions cm
       LEFT JOIN users u ON u.id = cm.user_id
       WHERE cm.message_id = ?
       ORDER BY cm.username`
    )
    .all(row.id);

  return {
    id: row.id,
    body: row.body,
    author: {
      id: row.authorId,
      name: row.authorName,
      initials: initialsFor(row.authorName),
    },
    mentions,
    createdAt: row.createdAt,
  };
};

const messageById = (id) => {
  const row = db
    .prepare(
      `SELECT m.id, m.body, m.author_id AS authorId, m.created_at AS createdAt,
              u.name AS authorName
       FROM chat_messages m
       JOIN users u ON u.id = m.author_id
       WHERE m.id = ?`
    )
    .get(id);

  return row ? publicMessageFrom(row) : null;
};

router.get('/messages', (req, res) => {
  const rows = db
    .prepare(
      `SELECT m.id, m.body, m.author_id AS authorId, m.created_at AS createdAt,
              u.name AS authorName
       FROM chat_messages m
       JOIN users u ON u.id = m.author_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 50`
    )
    .all();
  const online = db.prepare('SELECT COUNT(*) AS n FROM users').get();

  res.json({
    onlineCount: online.n,
    messages: rows.map(publicMessageFrom),
  });
});

router.post('/messages', (req, res) => {
  const { body, mentions = [] } = req.body || {};
  const trimmedBody = body?.trim();

  if (!trimmedBody) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  const result = db
    .prepare('INSERT INTO chat_messages (body, author_id) VALUES (?, ?)')
    .run(trimmedBody, req.user.id);

  for (const username of mentions) {
    const cleanUsername = String(username).trim().replace(/^@/, '');
    if (!cleanUsername) continue;

    const mentionedUser = db
      .prepare('SELECT id FROM users WHERE lower(name) LIKE lower(?) LIMIT 1')
      .get(`${cleanUsername}%`);

    db
      .prepare(
        'INSERT OR IGNORE INTO chat_mentions (message_id, user_id, username) VALUES (?, ?, ?)'
      )
      .run(result.lastInsertRowid, mentionedUser?.id || null, cleanUsername);
  }

  res.status(201).json({ message: messageById(result.lastInsertRowid) });
});

export default router;
