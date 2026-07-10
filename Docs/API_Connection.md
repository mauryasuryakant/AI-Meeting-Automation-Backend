# Frontend & Backend Connection Architecture

This document explains how the React (Vite) frontend communicates with the FastAPI backend.

## 1. Environment Configuration
The frontend relies on an environment variable to locate the backend server.
In the frontend directory (`frontend/`), there is a `.env` file containing:
```env
VITE_API_BASE_URL=http://localhost:8000
```
This tells the frontend that the backend is running locally on port 8000.

## 2. The API Client
All network requests are routed through a centralized `apiRequest` utility function located at `frontend/src/api/client.js`.

### Content-Type Handling
The API client is intelligent about request content types:
- **Default (JSON):** If standard object data is passed, it defaults to `Content-Type: application/json`.
- **FormData (File Uploads):** If a `FormData` object is passed (e.g., when uploading audio files), the client detects this and purposely omits the `Content-Type` header. This allows the browser to automatically set `multipart/form-data` along with the correctly generated boundary needed for file processing.

## 3. Data Transfer & Form Submission
When a user wants to analyze a meeting, the connection starts in the `NewMeeting.jsx` component. 

Because the backend relies strictly on AI-extracted data, the frontend avoids submitting manual data (like Title, Participants, or Meeting Type). Instead, the frontend strictly sends either:
1. An **Audio File** (`.mp3`, `.wav`, `.webm`)
2. A raw text **Transcript**

### The Request Payload
The frontend constructs a standard Web `FormData` object:
```javascript
const formData = new FormData()

if (mode === 'upload') {
  formData.append('audio', file) // Attaches binary file
} else if (mode === 'transcript') {
  formData.append('transcript', text) // Attaches string text
} else if (mode === 'record') {
  formData.append('audio', webmBlob, 'recording.webm') // Attaches live recording blob
}
```

This payload is POSTed directly to the backend endpoint: `http://localhost:8000/analyze-meeting`

## 4. Backend Processing & Response
Once the backend receives the `FormData`:
1. If an `audio` file is present, it uses `faster-whisper` to transcribe the audio into a string.
2. It sends the transcript string to the **Groq API**, instructing the AI to autonomously extract:
   - Meeting Title
   - Meeting Type
   - Participants
   - Summary, Key Decisions, Action Items, and Commitments
3. The backend then structures this data into plain English and automatically appends it to a connected Google Sheet.
4. Finally, the backend returns the structured JSON back to the frontend.

### Example Backend Response:
```json
{
  "status": "success",
  "title": "Project Sync",
  "date": "2026-07-10",
  "participants": "Joy, Ayush, Prem",
  "meeting_type": "Sync",
  "summary": "Team discussed the new dashboard UI.",
  "key_decisions": ["Approved the blue theme"],
  "action_items": [{"task": "Update mockup", "responsible_person": "Joy", "deadline": "Friday"}],
  "team_commitments": [{"person": "Ayush", "commitment": "Deploy by Monday"}],
  "transcript": "Joy: The blue theme looks good. Ayush: I will deploy it on Monday."
}
```

## 5. UI State Updates
When the frontend receives this successful response, it maps the extracted metadata directly into the global React state (`addMeeting(...)` in `AppDataContext`). The user is then seamlessly redirected to the `/meetings` dashboard where the fully analyzed meeting is immediately visible, populating the UI with the AI-generated Title, Summary, and Tasks!
