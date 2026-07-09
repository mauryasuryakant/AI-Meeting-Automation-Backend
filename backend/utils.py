def clean_json_text(text: str) -> str:
    """Remove markdown code block wrappers from AI response if present"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
        text = text.strip()
    return text
