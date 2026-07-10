import json
from groq import Groq
from config import GROQ_API_KEY

# Setup Groq client
client = Groq(api_key=GROQ_API_KEY)


def analyze_meeting(transcript: str) -> dict:
    """Send transcript to AI and get structured analysis back"""

    prompt = f"""
You are a meeting analyst. Analyze the following meeting transcript and extract key information.

Generate a descriptive title, determine the meeting type (e.g., Sync, Planning, Brainstorming, Feedback, etc.), and identify the participants based on the transcript.

Transcript:
{transcript}

Return ONLY valid JSON in this exact format (no extra text, no markdown):
{{
    "title": "A descriptive title for the meeting",
    "meeting_type": "The type of meeting",
    "participants": "Comma-separated list of participant names",
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

    models = [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "qwen/qwen3-32b",
        "openai/gpt-oss-20b",
        "mixtral-8x7b-32768",
        "llama-3.1-8b-instant",
    ]

    import groq
    
    text = None
    retryable_errors = (
        groq.RateLimitError,
        groq.InternalServerError,
        groq.APIConnectionError,
        groq.APITimeoutError
    )

    for model_name in models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            text = response.choices[0].message.content.strip()
            break  # Success, exit loop
        except retryable_errors as e:
            print(f"Model {model_name} failed with a retryable error ({type(e).__name__}): {e}. Trying next model...")
            continue
        except Exception as e:
            # Non-retryable error (e.g. 400, 401, 403, 404, or programming error)
            print(f"Model {model_name} encountered a non-retryable error: {e}.")
            raise
            
    if text is None:
        raise Exception("All models are currently unavailable due to retryable errors (e.g. rate limits, timeouts).")

    # Remove markdown code block if AI wraps the JSON in ```json ... ```
    if text.startswith("```"):
        text = text.split("\n", 1)[1]       # remove first line (```json)
        text = text.rsplit("```", 1)[0]     # remove last ```
        text = text.strip()

    return json.loads(text)
