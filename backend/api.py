from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import os
import shutil

from speech import transcribe_audio
from ai import analyze_meeting
from sheets import save_to_sheets

router = APIRouter()

# Create uploads folder if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze-meeting")
async def analyze_meeting_endpoint(
    title: str = Form(...),
    date: str = Form(...),
    participants: str = Form(...),
    meeting_type: str = Form(...),
    transcript: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
):
    """
    Single endpoint that handles everything:
    1. Transcribe audio (if uploaded)
    2. Analyze with Gemini AI
    3. Save to Google Sheets
    4. Return JSON response
    """

    try:
        # Step 1: Get the transcript
        if audio and audio.filename:
            # Save uploaded audio temporarily
            file_path = os.path.join(UPLOAD_DIR, audio.filename)
            with open(file_path, "wb") as f:
                shutil.copyfileobj(audio.file, f)

            # Convert speech to text
            transcript = transcribe_audio(file_path)

            # Clean up the temp file
            os.remove(file_path)

        if not transcript:
            return {"status": "error", "message": "Please provide either an audio file or a transcript."}

        # Step 2: Analyze with Gemini
        result = analyze_meeting(transcript, title, meeting_type, participants)

        # Step 3: Save to Google Sheets
        save_to_sheets({
            "title": title,
            "date": date,
            "participants": participants,
            "meeting_type": meeting_type,
            "summary": result.get("summary", ""),
            "key_decisions": result.get("key_decisions", []),
            "action_items": result.get("action_items", []),
            "team_commitments": result.get("team_commitments", []),
        })

        # Step 4: Return the response
        return {
            "summary": result.get("summary", ""),
            "key_decisions": result.get("key_decisions", []),
            "action_items": result.get("action_items", []),
            "team_commitments": result.get("team_commitments", []),
            "transcript": transcript,
            "status": "success",
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
