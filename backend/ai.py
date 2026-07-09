import google.generativeai as genai
import json
from config import GEMINI_API_KEY

# Setup Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")


def analyze_meeting(transcript: str, title: str, meeting_type: str, participants: str) -> dict:
    """Send transcript to Gemini and get structured analysis back"""

    prompt = f"""
You are a meeting analyst. Analyze the following meeting transcript and extract key information.

Meeting Title: {title}
Meeting Type: {meeting_type}
Participants: {participants}

Transcript:
{transcript}

Return ONLY valid JSON in this exact format (no extra text, no markdown):
{{
    "summary": "A brief summary of the meeting in 3-5 sentences",
    "key_decisions": ["decision 1", "decision 2"],
    "action_items": [
        {{
            "task": "what needs to be done",
            "responsible_person": "who should do it",
            "deadline": "when it should be done, or 'Not specified'",
            "priority": "High or Medium or Low"
        }}
    ],
    "team_commitments": [
        {{
            "person": "person name",
            "commitment": "what they committed to doing"
        }}
    ]
}}
"""

    response = model.generate_content(prompt)
    text = response.text.strip()

    # Remove markdown code block if Gemini wraps the JSON in ```json ... ```
    if text.startswith("```"):
        text = text.split("\n", 1)[1]       # remove first line (```json)
        text = text.rsplit("```", 1)[0]     # remove last ``` 
        text = text.strip()

    return json.loads(text)
