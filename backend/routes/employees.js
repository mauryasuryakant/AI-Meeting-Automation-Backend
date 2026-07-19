'use strict';

const { Router } = require('express');
const {
  getEmployeesForUser,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../services/sheets');

const router = Router();

// ── GET /employees?user_id=xxx ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.json({ status: 'error', message: 'user_id is required.' });

    const employees = await getEmployeesForUser(user_id);
    return res.json({ status: 'success', employees });
  } catch (err) {
    console.error('[Employees/GET]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── POST /employees ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { user_id, name, email } = req.body;

    if (!user_id || !name?.trim() || !email?.trim()) {
      return res.json({ status: 'error', message: 'user_id, name, and email are required.' });
    }

    const employee = await addEmployee(user_id, name.trim(), email.trim());
    return res.json({ status: 'success', employee });
  } catch (err) {
    console.error('[Employees/POST]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── PUT /employees/:rowIndex ───────────────────────────────────────────────────
router.put('/:rowIndex', async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.json({ status: 'error', message: 'name and email are required.' });
    }

    await updateEmployee(rowIndex, name.trim(), email.trim());
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('[Employees/PUT]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── DELETE /employees/:rowIndex ────────────────────────────────────────────────
router.delete('/:rowIndex', async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    await deleteEmployee(rowIndex);
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('[Employees/DELETE]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

module.exports = router;
