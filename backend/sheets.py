import gspread
import json
from config import GOOGLE_SHEET_ID

# Connect to Google Sheets using service account credentials
# You need a credentials.json file from Google Cloud Console
gc = gspread.service_account(filename="credentials.json")


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

    # Prepare one row of data
    row = [
        data.get("title", ""),
        data.get("date", ""),
        data.get("participants", ""),
        data.get("meeting_type", ""),
        data.get("summary", ""),
        json.dumps(data.get("key_decisions", [])),
        json.dumps(data.get("action_items", [])),
        json.dumps(data.get("team_commitments", [])),
    ]

    worksheet.append_row(row)
