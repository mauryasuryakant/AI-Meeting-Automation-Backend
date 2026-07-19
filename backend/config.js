'use strict';

require('dotenv').config();

module.exports = {
  PORT:                      process.env.PORT || 8000,
  GROQ_API_KEY:              process.env.GROQ_API_KEY || '',
  GOOGLE_SHEET_ID:           process.env.GOOGLE_SHEET_ID || '',
  GOOGLE_USERS_SHEET_ID:     process.env.GOOGLE_USERS_SHEET_ID || '',
  GOOGLE_OAUTH_CLIENT_ID:    process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  EMAIL_USER:                process.env.EMAIL_USER || '',
  EMAIL_PASSWORD:            process.env.EMAIL_PASSWORD || '',
};
