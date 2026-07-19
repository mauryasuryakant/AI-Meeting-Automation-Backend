'use strict';

const Groq = require('groq-sdk');
const { GROQ_API_KEY } = require('../config');

const client = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Analyze a meeting transcript using Groq AI.
 * Tries multiple models in order; falls back if one is rate-limited.
 * @param {string} transcript
 * @returns {Promise<object>}
 */
async function analyzeMeeting(transcript) {
  const prompt = `You are a meeting analyst. Analyze the following meeting transcript and extract key information.

Generate a descriptive title, determine the meeting type (e.g., Sync, Planning, Brainstorming, Feedback, etc.), and identify the participants based on the transcript.

Transcript:
${transcript}

Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
    "title": "A descriptive title for the meeting",
    "meeting_type": "The type of meeting",
    "participants": "Comma-separated list of participant names",
    "summary": "A brief summary of the meeting in 3-5 sentences",
    "key_decisions": ["decision 1", "decision 2"],
    "action_items": [
        {
            "task": "what needs to be done",
            "responsible_person": "who should do it",
            "deadline": "when it should be done, or 'Not specified'",
            "priority": "High or Medium or Low"
        }
    ],
    "team_commitments": [
        {
            "person": "person name",
            "commitment": "what they committed to doing"
        }
    ]
}`;

  const models = [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'qwen/qwen3-32b',
    'openai/gpt-oss-20b',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant',
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      const response = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
      });

      let text = response.choices[0].message.content.trim();

      // Strip markdown code fences if present
      if (text.startsWith('```')) {
        text = text.split('\n').slice(1).join('\n');
        text = text.split('```')[0].trim();
      }

      return JSON.parse(text);
    } catch (err) {
      const isRetryable =
        err.status === 429 || // rate limit
        err.status === 500 || // server error
        err.status === 503 || // service unavailable
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT';

      if (isRetryable) {
        console.warn(`[AI] Model ${modelName} failed (retryable): ${err.message}. Trying next...`);
        lastError = err;
        continue;
      }

      // Non-retryable — re-throw immediately
      throw err;
    }
  }

  throw new Error(`All AI models unavailable. Last error: ${lastError?.message}`);
}

module.exports = { analyzeMeeting };
