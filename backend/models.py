from pydantic import BaseModel
from typing import List

# --- Response Models ---
# These define the shape of data returned by the API

class ActionItem(BaseModel):
    task: str
    responsible_person: str
    deadline: str
    priority: str  # High / Medium / Low

class TeamCommitment(BaseModel):
    person: str
    commitment: str

class MeetingResponse(BaseModel):
    summary: str
    key_decisions: List[str]
    action_items: List[ActionItem]
    team_commitments: List[TeamCommitment]
    transcript: str
    status: str
