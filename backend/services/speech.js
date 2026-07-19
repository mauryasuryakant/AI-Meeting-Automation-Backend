'use strict';

const fs   = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const { GROQ_API_KEY } = require('../config');

const client = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Transcribe an audio file using Groq's Whisper API.
 * Automatically cleans up the temp file after transcription.
 * @param {string} filePath  — absolute path to the audio file
 * @returns {Promise<string>} — transcript text
 */
async function transcribeAudio(filePath) {
  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3',
      response_format: 'text',
    });

    return typeof transcription === 'string'
      ? transcription.trim()
      : (transcription.text || '').trim();
  } finally {
    // Always clean up the temp file
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

module.exports = { transcribeAudio };
