'use strict';

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const authRouter      = require('./routes/auth');
const apiRouter       = require('./routes/api');
const employeesRouter = require('./routes/employees');
const tasksRouter     = require('./routes/tasks');

const { PORT } = require('./config');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/auth',      authRouter);
app.use('/',          apiRouter);
app.use('/employees', employeesRouter);
app.use('/tasks',     tasksRouter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'AI Meeting ActionFlow (JS backend)', port: PORT });
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ AI Meeting ActionFlow backend running → http://localhost:${PORT}\n`);
});
