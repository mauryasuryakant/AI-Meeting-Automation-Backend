'use strict';

const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { GOOGLE_SHEET_ID, GOOGLE_USERS_SHEET_ID } = require('../config');

// ── Auth: Google Service Account ──────────────────────────────────────────────
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatActionItems(items) {
  if (!items || items.length === 0) return 'None';
  return items
    .map(i => `• ${i.responsible_person || 'Unknown'}: ${i.task || ''} (Due: ${i.deadline || 'N/A'} | Priority: ${i.priority || 'N/A'})`)
    .join('\n');
}

function formatCommitments(items) {
  if (!items || items.length === 0) return 'None';
  return items.map(i => `• ${i.person || 'Unknown'}: ${i.commitment || ''}`).join('\n');
}

function formatDecisions(items) {
  if (!items || items.length === 0) return 'None';
  return items.map(d => `• ${d}`).join('\n');
}

function nowFormatted() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

// ── Sheet 1: Meetings (GOOGLE_SHEET_ID) ───────────────────────────────────────

async function saveMeetingToSheets(data) {
  const sheets = await getSheetsClient();
  const spreadsheetId = GOOGLE_SHEET_ID;

  // Check if header row exists
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:J1',
  });

  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Title', 'Date', 'Participants', 'Meeting Type',
          'Summary', 'Key Decisions', 'Action Items', 'Team Commitments',
          'Owner User ID', 'Task Status',
        ]],
      },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        data.title || '',
        data.date || '',
        data.participants || '',
        data.meeting_type || '',
        data.summary || '',
        formatDecisions(data.key_decisions),
        formatActionItems(data.action_items),
        formatCommitments(data.team_commitments),
        data.user_id || '',
        'pending',
      ]],
    },
  });
}

async function getTasksForUser(userId) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: 'Sheet1!A:J',
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const tasks = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const col = idx => (row[idx] || '');
    if (col(8) === userId) {
      tasks.push({
        row_index: i + 1, // 1-indexed sheet row (header is row 1)
        title: col(0),
        date: col(1),
        participants: col(2),
        action_items: col(6),
        status: col(9) || 'pending',
      });
    }
  }
  return tasks;
}

async function updateTaskStatus(rowIndex, status) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `Sheet1!J${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  });
}

async function deleteTaskRow(rowIndex) {
  const sheets = await getSheetsClient();
  const spreadsheetRes = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
  const sheetId = spreadsheetRes.data.sheets[0].properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: GOOGLE_SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-indexed
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

// ── Sheet 2: User Accounts (GOOGLE_USERS_SHEET_ID) ────────────────────────────

async function _ensureUsersSheet(sheets) {
  const spreadsheetId = GOOGLE_USERS_SHEET_ID;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);

  if (!sheetNames.includes('User Accounts')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'User Accounts' } } }],
      },
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'User Accounts!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['User ID', 'Name', 'Email', 'Password', 'Photo', 'Created At']] },
    });
  }
}

async function _getUsersRows() {
  const sheets = await getSheetsClient();
  await _ensureUsersSheet(sheets);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_USERS_SHEET_ID,
    range: 'User Accounts!A:F',
  });
  return { sheets, rows: res.data.values || [] };
}

function _rowToUser(row) {
  return {
    'User ID':    row[0] || '',
    'Name':       row[1] || '',
    'Email':      row[2] || '',
    'Password':   row[3] || '',
    'Photo':      row[4] || '',
    'Created At': row[5] || '',
  };
}

async function findUserByEmail(email) {
  const { rows } = await _getUsersRows();
  for (let i = 1; i < rows.length; i++) {
    const u = _rowToUser(rows[i]);
    if (u['Email'].toLowerCase() === email.toLowerCase()) return u;
  }
  return null;
}

async function findUserById(userId) {
  const { rows } = await _getUsersRows();
  for (let i = 1; i < rows.length; i++) {
    const u = _rowToUser(rows[i]);
    if (u['User ID'] === userId) return u;
  }
  return null;
}

async function createUser(name, email, password, photo = '') {
  const sheets = await getSheetsClient();
  await _ensureUsersSheet(sheets);

  const userId = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  const createdAt = nowFormatted();

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_USERS_SHEET_ID,
    range: 'User Accounts!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [[userId, name, email, password, photo, createdAt]] },
  });

  return { user_id: userId, name, email, photo };
}

// ── Sheet 3: Employees (GOOGLE_USERS_SHEET_ID) ────────────────────────────────

async function _ensureEmployeesSheet(sheets) {
  const spreadsheetId = GOOGLE_USERS_SHEET_ID;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);

  if (!sheetNames.includes('Employees')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'Employees' } } }],
      },
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Employees!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['Employee ID', 'Owner User ID', 'Name', 'Email']] },
    });
  }
}

async function _getEmployeesRows() {
  const sheets = await getSheetsClient();
  await _ensureEmployeesSheet(sheets);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_USERS_SHEET_ID,
    range: 'Employees!A:D',
  });
  return { sheets, rows: res.data.values || [] };
}

async function getEmployeesForUser(userId) {
  const { rows } = await _getEmployeesRows();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if ((row[1] || '') === userId) {
      result.push({
        row_index: i + 1,
        employee_id: row[0] || '',
        name: row[2] || '',
        email: row[3] || '',
      });
    }
  }
  return result;
}

async function addEmployee(userId, name, email) {
  const sheets = await getSheetsClient();
  await _ensureEmployeesSheet(sheets);

  const empId = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_USERS_SHEET_ID,
    range: 'Employees!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [[empId, userId, name, email]] },
  });

  return { employee_id: empId, name, email };
}

async function updateEmployee(rowIndex, name, email) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_USERS_SHEET_ID,
    range: `Employees!C${rowIndex}:D${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[name, email]] },
  });
}

async function deleteEmployee(rowIndex) {
  const sheets = await getSheetsClient();
  const spreadsheetRes = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_USERS_SHEET_ID });
  const empSheet = spreadsheetRes.data.sheets.find(s => s.properties.title === 'Employees');
  if (!empSheet) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: GOOGLE_USERS_SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: empSheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

async function findEmployeeEmail(userId, personName) {
  const employees = await getEmployeesForUser(userId);
  const nameLower = personName.toLowerCase().trim();
  for (const emp of employees) {
    const empLower = emp.name.toLowerCase().trim();
    if (empLower === nameLower || nameLower.includes(empLower) || empLower.includes(nameLower)) {
      return emp.email;
    }
  }
  return '';
}

module.exports = {
  // Meetings
  saveMeetingToSheets,
  getTasksForUser,
  updateTaskStatus,
  deleteTaskRow,
  // Users
  findUserByEmail,
  findUserById,
  createUser,
  // Employees
  getEmployeesForUser,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  findEmployeeEmail,
};
