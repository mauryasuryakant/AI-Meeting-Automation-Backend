from faster_whisper import WhisperModel

# Load Whisper model once when server starts
# "base" model = good balance of speed and accuracy for a college project
model = WhisperModel("base", compute_type="int8")

def transcribe_audio(file_path: str) -> str:
    """Convert an audio file to text using Faster-Whisper"""
    segments, _ = model.transcribe(file_path)
    text = " ".join([segment.text for segment in segments])
    return text.strip()
