import gspread
import json
from config import GOOGLE_SHEET_ID

# Connect to Google Sheets using service account credentials
# You need a credentials.json file from Google Cloud Console
gc = gspread.service_account(filename="credentials.json")


def format_action_items(items):
    if not items:
        return "None"
    return "\n".join([f"• {item.get('responsible_person', 'Unknown')}: {item.get('task', '')} (Due: {item.get('deadline', 'N/A')} | Priority: {item.get('priority', 'N/A')})" for item in items])

def format_commitments(commitments):
    if not commitments:
        return "None"
    return "\n".join([f"• {item.get('person', 'Unknown')}: {item.get('commitment', '')}" for item in commitments])

def format_decisions(decisions):
    if not decisions:
        return "None"
    return "\n".join([f"• {d}" for d in decisions])


def save_to_sheets(data: dict):
    """Save meeting analysis results to Google Sheets"""

    sheet = gc.open_by_key(GOOGLE_SHEET_ID)
    worksheet = sheet.sheet1

    # Add headers if the sheet is empty
    if not worksheet.get_all_values():
        headers = [
            "Title", "Date", "Participants", "Meeting Type",
            "Summary", "Key Decisions", "Action Items", "Team Commitments"
        ]
        worksheet.append_row(headers)
        # Bold headers
        worksheet.format("A1:H1", {"textFormat": {"bold": True}})

    # Prepare formatted plain English strings
    key_decisions_str = format_decisions(data.get("key_decisions", []))
    action_items_str = format_action_items(data.get("action_items", []))
    commitments_str = format_commitments(data.get("team_commitments", []))

    # Prepare one row of data
    row = [
        data.get("title", ""),
        data.get("date", ""),
        data.get("participants", ""),
        data.get("meeting_type", ""),
        data.get("summary", ""),
        key_decisions_str,
        action_items_str,
        commitments_str,
    ]

    # Append the row
    worksheet.append_row(row)
    
    # Apply text wrapping to make multi-line lists readable
    worksheet.format("A:H", {"wrapStrategy": "WRAP"})
