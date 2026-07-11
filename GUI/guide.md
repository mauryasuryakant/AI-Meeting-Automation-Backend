# Frontend Developer Guide

This guide provides information on how to integrate the frontend with the AI Meeting Analyzer backend API.

## Base URL
For local development, the backend API runs at:
```text
http://localhost:8000
```
*(Ensure your frontend fetch/axios requests point to this URL)*

---

## API Endpoints

### 1. Analyze Meeting
This endpoint accepts either an audio file or a text transcript. It processes the input, uses AI to extract meeting insights (summary, action items, decisions, etc.), saves the data to Google Sheets, and returns the parsed result.

- **URL:** `/analyze-meeting`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`

#### Request Form Data Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `audio` | File (Blob) | Optional* | An audio recording of the meeting to be transcribed. |
| `transcript` | String | Optional* | Raw text transcript of the meeting. |

*\* Note: You must provide **either** an `audio` file **or** a `transcript`.*

#### Example Usage (JavaScript / Fetch)

```javascript
async function uploadMeetingData(audioFile, textTranscript) {
  const formData = new FormData();
  
  // Append whichever data is available
  if (audioFile) {
    formData.append("audio", audioFile);
  } else if (textTranscript) {
    formData.append("transcript", textTranscript);
  }

  try {
    const response = await fetch("http://localhost:8000/analyze-meeting", {
      method: "POST",
      body: formData,
      // Note: Do NOT set the 'Content-Type' header manually when using FormData.
      // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
    });

    const result = await response.json();
    
    if (result.status === "success") {
      console.log("Meeting Analyzed Successfully:", result);
    } else {
      console.error("Backend Error:", result.message);
    }
    
    return result;
  } catch (error) {
    console.error("Network Error:", error);
  }
}
```

#### Success Response
If the meeting is processed correctly, you will receive a JSON response with status `"success"` and all the extracted fields.

```json
{
  "title": "Weekly Engineering Sync",
  "date": "2026-07-11",
  "participants": "Alice, Bob, Charlie",
  "meeting_type": "Weekly Sync",
  "summary": "Discussed the new API integration and frontend refactoring plans.",
  "key_decisions": [
    "Use FastAPI for the backend service"
  ],
  "action_items": [
    "Alice to setup the repository by Monday"
  ],
  "team_commitments": [
    "Deliver MVP by end of the week"
  ],
  "transcript": "Alright everyone, let's get started with the weekly sync...",
  "status": "success"
}
```

#### Error Response
If there's an issue (e.g., missing inputs or processing error), the backend returns a JSON object with status `"error"`.

```json
{
  "status": "error",
  "message": "Please provide either an audio file or a transcript."
}
```
