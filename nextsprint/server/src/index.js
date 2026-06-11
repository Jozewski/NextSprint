import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import statsRoutes from './routes/stats.js';

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : true; // allow all in local dev if not set

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, db: 'sqlite' }));

app.use('/api/auth', authRoutes);       // Developer 1
app.use('/api/users', userRoutes);      // Developer 1
app.use('/api/projects', projectRoutes); // Developer 2
app.use('/api/tasks', taskRoutes);      // Developer 3
app.use('/api/stats', statsRoutes);     // Developer 4

// Central error fallback
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`NextSprint API running on http://localhost:${PORT}`);
  });
}

export default app;
