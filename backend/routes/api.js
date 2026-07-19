'use strict';

const { Router } = require('express');
const upload = require('../middleware/upload');
const { transcribeAudio } = require('../services/speech');
const { analyzeMeeting }  = require('../services/ai');
const { saveMeetingToSheets, findEmployeeEmail, findUserById } = require('../services/sheets');
const { sendTaskEmail } = require('../services/email');

const router = Router();

// ── POST /analyze-meeting ─────────────────────────────────────────────────────
router.post('/analyze-meeting', upload.single('audio'), async (req, res) => {
  try {
    let transcript = req.body.transcript || null;
    const userId   = req.body.user_id || null;

    // Step 1 — Transcribe audio if uploaded
    if (req.file) {
      transcript = await transcribeAudio(req.file.path);
    }

    if (!transcript || !transcript.trim()) {
      return res.json({ status: 'error', message: 'Please provide either an audio file or a transcript.' });
    }

    // Step 2 — AI analysis
    const result = await analyzeMeeting(transcript);
    const currentDate = new Date().toISOString().slice(0, 10);

    // Step 3 — Save to Google Sheets
    await saveMeetingToSheets({
      title:            result.title            || 'Untitled Meeting',
      date:             currentDate,
      participants:     result.participants      || 'Unknown',
      meeting_type:     result.meeting_type      || 'General',
      summary:          result.summary           || '',
      key_decisions:    result.key_decisions     || [],
      action_items:     result.action_items      || [],
      team_commitments: result.team_commitments  || [],
      user_id:          userId || '',
    });

    // Step 4 — Send task emails if user is logged in
    if (userId) {
      const senderUser = await findUserById(userId);
      const emailPromises = (result.action_items || []).map(async (item) => {
        const person = (item.responsible_person || '').trim();
        if (!person) return;

        const email = await findEmployeeEmail(userId, person);
        if (!email) return;

        try {
          await sendTaskEmail({
            toEmail:       email,
            employeeName:  person,
            task:          item.task      || '',
            deadline:      item.deadline  || 'Not specified',
            priority:      item.priority  || 'Medium',
            meetingTitle:  result.title   || 'Meeting',
            senderName:    senderUser ? senderUser['Name'] : null,
            senderEmail:   senderUser ? senderUser['Email'] : null,
          });
        } catch (e) {
          console.error(`[API] Email error for ${person}:`, e.message);
        }
      });

      await Promise.allSettled(emailPromises);
    }

    // Step 5 — Return structured response
    return res.json({
      title:            result.title            || 'Untitled Meeting',
      date:             currentDate,
      participants:     result.participants      || 'Unknown',
      meeting_type:     result.meeting_type      || 'General',
      summary:          result.summary           || '',
      key_decisions:    result.key_decisions     || [],
      action_items:     result.action_items      || [],
      team_commitments: result.team_commitments  || [],
      transcript,
      status: 'success',
    });
  } catch (err) {
    console.error('[API/analyze-meeting]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

module.exports = router;
