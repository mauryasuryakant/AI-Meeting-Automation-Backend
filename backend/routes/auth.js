'use strict';

const { Router } = require('express');
const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_OAUTH_CLIENT_ID } = require('../config');
const {
  findUserByEmail,
  findUserById,
  createUser,
} = require('../services/sheets');

const router = Router();
const oauthClient = new OAuth2Client(GOOGLE_OAUTH_CLIENT_ID);

// ── POST /auth/signup ──────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.json({ status: 'error', message: 'All fields are required.' });
    }
    if (password.length < 8) {
      return res.json({ status: 'error', message: 'Password must be at least 8 characters.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.json({ status: 'error', message: 'An account with this email already exists.' });
    }

    const user = await createUser(name.trim(), email.trim().toLowerCase(), password);
    return res.json({ status: 'success', user });
  } catch (err) {
    console.error('[Auth/signup]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── POST /auth/login ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ status: 'error', message: 'No account found with that email.' });
    }
    if (user['Password'] !== password) {
      return res.json({ status: 'error', message: 'Incorrect password.' });
    }

    return res.json({
      status: 'success',
      user: {
        user_id: user['User ID'],
        name:    user['Name'],
        email:   user['Email'],
        photo:   user['Photo'] || '',
      },
    });
  } catch (err) {
    console.error('[Auth/login]', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// ── POST /auth/google ──────────────────────────────────────────────────────────
// Accepts a Google ID token (credential) from the Google Sign-In button on frontend.
router.post('/google', async (req, res) => {
  try {
    if (!GOOGLE_OAUTH_CLIENT_ID) {
      return res.json({ status: 'error', message: 'Google OAuth is not configured on this server.' });
    }

    const { token } = req.body;
    if (!token) {
      return res.json({ status: 'error', message: 'Google token is required.' });
    }

    // Verify the Google ID token
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleEmail = (payload.email || '').toLowerCase().trim();
    const googleName  = payload.name  || 'Google User';
    const googlePhoto = payload.picture || '';

    if (!googleEmail) {
      return res.json({ status: 'error', message: 'Could not retrieve email from Google token.' });
    }

    // Find or create user
    let existing = await findUserByEmail(googleEmail);
    let user;

    if (existing) {
      user = {
        user_id: existing['User ID'],
        name:    existing['Name'],
        email:   existing['Email'],
        photo:   existing['Photo'] || googlePhoto,
      };
    } else {
      // Create new user with empty password (OAuth user)
      user = await createUser(googleName, googleEmail, '', googlePhoto);
    }

    return res.json({ status: 'success', user });
  } catch (err) {
    console.error('[Auth/google]', err);
    // google-auth-library throws on invalid tokens
    if (err.message?.includes('Invalid token')) {
      return res.json({ status: 'error', message: `Invalid Google token: ${err.message}` });
    }
    return res.json({ status: 'error', message: err.message });
  }
});

module.exports = router;
