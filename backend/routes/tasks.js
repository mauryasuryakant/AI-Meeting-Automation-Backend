'use strict';

const { Router } = require('express');
const {
  getTasksForUser,
  updateTaskStatus,
  deleteTaskRow,
} = require('../services/sheets');

const router = Router();

// ── GET /tasks?user_id=xxx ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.json({ status: 'error', message: 'user_id is required.' });

    const tasks = await getTasksForUser(user_id);
    return res.json({ status: 'success', tasks });
  } catch (err) {
    console.error('[Tasks/GET]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── PUT /tasks/:rowIndex/status ───────────────────────────────────────────────
router.put('/:rowIndex/status', async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    const { status } = req.body;

    if (!status) return res.json({ status: 'error', message: 'status is required.' });

    await updateTaskStatus(rowIndex, status);
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('[Tasks/PUT]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── DELETE /tasks/:rowIndex ───────────────────────────────────────────────────
router.delete('/:rowIndex', async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    await deleteTaskRow(rowIndex);
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('[Tasks/DELETE]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

module.exports = router;
